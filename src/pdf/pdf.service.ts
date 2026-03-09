import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  async downloadAndStoreForm(url: string, patientId: string) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await page.emulateMediaType('screen');
      await page.goto(url, { waitUntil: 'networkidle0' });

      // Create local storage directory
      const storageDir = path.join(process.cwd(), 'stored_forms', patientId);
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      // 1. Store the PDF
      const pdfPath = path.join(storageDir, `form.pdf`);
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
      });

      // 2. Store the Form Info (JSON)
      // We extract the 'form' and 'meta' data directly from the page's window object
      const formData = await page.evaluate(() => {
        // This assumes your Dummy App passes data to the template
        // If you want to capture the actual filled-in values:
        const inputs = Array.from(document.querySelectorAll('input'));
        return inputs.map((i) => ({
          label: i.previousElementSibling?.textContent || 'unknown',
          value:
            i.type === 'checkbox' || i.type === 'radio' ? i.checked : i.value,
        }));
      });

      const jsonPath = path.join(storageDir, `data.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(formData, null, 2));

      await browser.close();
      return { savedAt: pdfPath, dataSavedAt: jsonPath };
    } catch (error) {
      await browser.close();
      throw error;
    }
  }
}

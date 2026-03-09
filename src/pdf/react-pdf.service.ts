import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';

@Injectable()
export class ReactPdfService {
  async captureMultipageForm(
    url: string,
    patientId: string,
  ): Promise<{ fullPdf: string }> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const mergedPdf = await PDFDocument.create();
    let finalData: any[] = [];

    try {
      await page.goto(url, { waitUntil: 'networkidle0' });
      const storageDir = path.join(
        process.cwd(),
        'stored_forms_react',
        patientId,
      );
      if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

      let hasNext = true;
      while (hasNext) {
        // --- IMPROVED DATA EXTRACTION ---
        const pageData = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('input, textarea, select'));


          return elements.map((el: any) => {
            // Label dhundne ka logic: 1. placeholder, 2. name, 3. nearest text
            let label = el.placeholder || el.name || el.previousElementSibling?.textContent?.trim() || 'Unknown Field';
            const id = el.id;
            const labelTag = id
              ? document.querySelector(`label[for="${id}"]`)
              : null;

                    if (labelTag) {
              label = labelTag.textContent?.trim() || 'Field';
            } else if (el.placeholder) {
                      label = el.placeholder;
                    } else if (el.name) {
                      label = el.name;
                    } else {
                      // Nearest Text dhundo (complex tables ke liye)
              label =
                el.previousElementSibling?.textContent?.trim() ||
                              el.parentElement?.previousElementSibling?.textContent?.trim() || 
                              'Field';
                    }

           // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
           let val = el.value;
    if (el.type === 'checkbox' || el.type === 'radio') {
      val = el.checked ? (el.nextElementSibling?.textContent?.trim() || 'Yes') : 'No';
    }

    return { field: label.replace(':', ''), value: val };
  });
        });
        finalData = [...finalData, ...pageData];

        // --- PDF CAPTURE ---
        const pdfBytes = await page.pdf({ format: 'A4', printBackground: true });
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((p) => mergedPdf.addPage(p));

        // --- NEXT BUTTON LOGIC ---
        const nextBtn = await page.$('.next');
        if (nextBtn) {
          const isVisible = await page.evaluate((sel) => {
            const b = document.querySelector(sel) as HTMLElement;
            return !!(
              b &&
              b.offsetParent !== null &&
              !b.hasAttribute('disabled')
            );
          }, '.next');
          if (isVisible) {
            await page.click('.next');
            await new Promise((r) => setTimeout(r, 1000));
          } else {
            hasNext = false;
          }
        } else {
          hasNext = false;
        }
      }

      // Save PDF & JSON
      const pdfPath = path.join(storageDir, 'complete_report.pdf');
      const jsonPath = path.join(storageDir, 'data.json');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      fs.writeFileSync(pdfPath, Buffer.from(await mergedPdf.save()));
      fs.writeFileSync(jsonPath, JSON.stringify(finalData, null, 2));

      await browser.close();
      return { fullPdf: pdfPath };
    } catch (e) {
      await browser.close();
      throw e;
    }
  }
}

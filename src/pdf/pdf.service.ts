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
      // 1. Emulate screen to keep colors/images as they appear on the monitor
      await page.emulateMediaType('screen');
      // 2. Go to URL and wait for the initial network to be quiet
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

      // 3. CRITICAL: Wait for all <img>, <video>, and <audio> tags to finish loading
      await page.evaluate(async () => {
        const selectors = Array.from(
          document.querySelectorAll('img, audio, video'),
        );
        const promises = selectors.map((item) => {
          // Check the tag name to decide how to cast
          if (item.tagName === 'IMG') {
            // 1. Cast to HTMLImageElement to access .complete and .onload
            const img = item as HTMLImageElement;

            if (img.complete) return Promise.resolve(true);

            return new Promise((resolve) => {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
            });
          } else if (item.tagName === 'AUDIO' || item.tagName === 'VIDEO') {
            // 2. Cast to HTMLMediaElement to access .oncanplaythrough
            const media = item as HTMLMediaElement;

            return new Promise((resolve) => {
              media.oncanplaythrough = () => resolve(true);
              // Fail-safe timeout so the PDF doesn't hang if media fails to load
              setTimeout(() => resolve(false), 2000);
            });
          }
          return Promise.resolve(true);
        });
        await Promise.all(promises);
      });

      // Create local storage directory
      const storageDir = path.join(process.cwd(), 'stored_forms', patientId);
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }
      await page.evaluate(async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const elements = Array.from(
          document.querySelectorAll('img, canvas, .signature-pad'),
        );
        // Waiting for one animation frame to ensure <canvas> signatures are "painted"
        await new Promise((resolve) => requestAnimationFrame(resolve));

        // using a signature library, sometimes there's tiny delay
        await new Promise((resolve) => setTimeout(resolve, 500));
      });
      // 1. Store the PDF
      const pdfPath = path.join(storageDir, `form.pdf`);
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      });

      // 2. Store the Form Info (JSON)
      // We extract the 'form' and 'meta' data directly from the page's window object
      const formData = await page.evaluate(() => {
        const results: any[] = [];
        // Capture standard inputs
        document.querySelectorAll('input').forEach((i) => {
          results.push({
            type: 'input',
            label: i.previousElementSibling?.textContent?.trim() || 'unknown',
            value:
              i.type === 'checkbox' || i.type === 'radio' ? i.checked : i.value,
          });
        });

        // Capture Media sources so you know what was in the PDF
        document.querySelectorAll('img, audio, video').forEach((media: any) => {
          results.push({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            type: media.tagName.toLowerCase(),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            src: media.currentSrc || media.src,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            alt: media.alt || 'no-alt-text',
          });
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return results;
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

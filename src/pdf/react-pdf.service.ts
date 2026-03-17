import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReactPdfService {
  async captureMultipageForm(
    url: string,
  ): Promise<{ fullPdf: string; id: string }> {
    const autoId = uuidv4();
    console.log(`🆔 Generated Auto ID: ${autoId}`);
    console.log('🚀 Launching Browser...');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const mergedPdf = await PDFDocument.create();
    let finalData: any[] = [];

    try {
      console.log(`🔗 Navigating to: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

      const storageDir = path.join(process.cwd(), 'stored_forms_react', autoId);
      if (!fs.existsSync(storageDir))
        fs.mkdirSync(storageDir, { recursive: true });

      let hasNext = true;
      let pageCount = 1;

      while (hasNext) {
        console.log(`📸 Processing Page ${pageCount}...`);

        // 1. Data Extraction Log
        const pageData = await this.extractPageData(page);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        finalData = [...finalData, ...pageData];
        console.log(
          `✅ Extracted ${pageData.length} fields from Page ${pageCount}`,
        );

        // 2. PDF Capture Log
        const pdfBytes = await page.pdf({
          format: 'A4',
          printBackground: true,
        });
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(
          pdfDoc,
          pdfDoc.getPageIndices(),
        );
        copiedPages.forEach((p) => mergedPdf.addPage(p));
        console.log(`📄 Page ${pageCount} added to Merged PDF`);

        // 3. Robust Next Button Logic
        console.log(`🔍 Searching for Next button on Page ${pageCount}...`);

        // Ham "Next" text wala button dhoond rahe hain jo visible ho
        const nextButtonHandle = await page.evaluateHandle(() => {
          const buttons = Array.from(
            document.querySelectorAll('button, .next, .btn-next'),
          );
          return buttons.find(
            (btn) =>
              (btn.textContent?.trim().toLowerCase().includes('next') ||
                btn.classList.contains('next')) &&
              (btn as HTMLElement).offsetParent !== null &&
              !btn.hasAttribute('disabled'),
          );
        });

        const nextBtn = nextButtonHandle.asElement();

        if (nextBtn) {
          console.log(`👉 Next button found! Clicking now...`);

          // Browser context mein click karwao (More reliable)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          await page.evaluate((el: any) => el.click(), nextBtn);

          // CRITICAL: Wait for React to transition
          console.log('⏳ Waiting for page transition (3s)...');
          await new Promise((r) => setTimeout(r, 3000));

          pageCount++;
        } else {
          console.log('🛑 No active Next button found. Finishing capture.');
          hasNext = false;
        }
        await nextButtonHandle.dispose();
      }

      // Save PDF & JSON
      const pdfPath = path.join(storageDir, 'complete_report.pdf');
      const jsonPath = path.join(storageDir, 'data.json');

      const finalPdfBytes = await mergedPdf.save();
      fs.writeFileSync(pdfPath, Buffer.from(finalPdfBytes));
      fs.writeFileSync(jsonPath, JSON.stringify(finalData, null, 2));

      console.log(`🏁 Total Pages Captured: ${pageCount}`);
      await browser.close();
      console.log(`✅ Success! PDF saved for ID: ${autoId}`);
      return { fullPdf: pdfPath, id: autoId };
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.error('❌ Service Error:', e.message);
      await browser.close();
      throw e;
    }
  }

  // Helper method for extraction to keep code clean
  private async extractPageData(page: puppeteer.Page) {
    return await page.evaluate(() => {
      const elements = Array.from(
        document.querySelectorAll('input, textarea, select'),
      );
      return elements.map((el: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        let label =
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          el.placeholder ||
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          el.name ||
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          el.previousElementSibling?.textContent?.trim() ||
          'Field';
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const id = el.id;
        const labelTag = id
          ? document.querySelector(`label[for="${id}"]`)
          : null;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        if (labelTag) label = labelTag.textContent?.trim() || label;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        let val = el.value;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (el.type === 'checkbox' || el.type === 'radio') {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          val = el.checked
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              ?(el.nextElementSibling as HTMLElement)?.textContent?.trim() ||
              'Yes'
            : 'No';
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        return { field: label.replace(':', ''), value: val };
      });
    });
  }
}

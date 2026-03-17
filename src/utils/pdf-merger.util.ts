import { PDFDocument } from 'pdf-lib';

export async function mergePdfs(pdfBuffers: Buffer[]): Promise<Buffer> {
  const mergedPdf = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const pdf = await PDFDocument.load(buffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedPdfBytes = await mergedPdf.save();
  // Uint8Array ko Node.js Buffer mein convert karne ka foolproof tarika
  return Buffer.from(mergedPdfBytes);
}

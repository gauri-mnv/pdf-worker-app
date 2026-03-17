/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import express from 'express';
import { ReactPdfService } from './react-pdf.service';

@Controller('worker')
export class PdfController {
  constructor(private readonly reactPdfService: ReactPdfService) {}

  @Post('execute-react')
  async handleReactForm(
    @Body('link') link: string,
    @Res() res: express.Response,
  ) {
    console.log(`📩 Request received for Link: ${link}`);
    try {
      const result: any = await this.reactPdfService.captureMultipageForm(link);
      console.log(`✅ Success! PDF saved at: ${result.fullPdf}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      res.setHeader('X-Generated-Id', result.id);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return res.download(result.fullPdf);
    } catch (error) {
      console.error('❌ Controller Error:', error.message);
      const message =
        error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(message);
    }
  }
}

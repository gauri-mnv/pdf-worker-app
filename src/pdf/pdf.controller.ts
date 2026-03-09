import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  // Get,
  // Render,
} from '@nestjs/common';
import express from 'express';
import { PdfService } from './pdf.service';
import { ReactPdfService } from './react-pdf.service';

@Controller('worker')
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly reactPdfService: ReactPdfService,
  ) {}

  // // 1. GET route to show the UI where you can input the link
  // @Get()
  // @Render('capture_form')
  // showUi() {
  //   return { title: 'PDF Generator' };
  // }

  // // 2. POST route to process the input and save to local storage
  // @Post('execute-and-view')
  // async runAndView(
  //   @Body('link') link: string,
  //   @Body('id') id: string,
  //   @Res() res: express.Response,
  // ) {
  //   try {
  //     // This service method handles saving the PDF & JSON to your local disk
  //     const result = await this.pdfService.downloadAndStoreForm(link, id);

  //     // This sends the saved file to your browser
  //     return res.download(result.savedAt);
  //   } catch (error) {
  //     const message =
  //       error instanceof Error ? error.message : 'An unknown error occurred';
  //     return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(message);
  //   }
  // }

  @Post('execute-react')
  async handleReactForm(
    @Body('link') link: string,
    @Body('id') id: string,
    @Res() res: express.Response,
  ) {
    try {
      // Ye link http://localhost:3005/view-form
      const result: any = await this.reactPdfService.captureMultipageForm(
        link,
        id,
      );

      // console.log(
      //   `Success! Data stored for Patient ${id}. Total steps captured.`,
      //   res.json({
      //     status: 'Success',
      //     pdfPath: result.fullPdf,
      //     jsonPath: result.dataLog,
      //     message: 'Check your local folder to verify data accuracy',
      //   }),
      // );
      return res.download(result.fullPdf);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(message);
    }
  }
}

import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { PdfService } from './pdf/pdf.service';
import { PdfController } from './pdf/pdf.controller';
import { ReactPdfService } from './pdf/react-pdf.service';

@Module({
  imports: [],
  controllers: [PdfController],
  providers: [PdfService, ReactPdfService],
})
export class AppModule {}

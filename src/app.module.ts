import { Module } from '@nestjs/common';
import { PdfController } from './pdf/pdf.controller';
import { ReactPdfService } from './pdf/react-pdf.service';

@Module({
  imports: [],
  controllers: [PdfController],
  providers: [ReactPdfService],
})
export class AppModule {}

import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FileService } from './file.service';
import { UploadDto } from './dto/upload.dto';
import { MarkUploadedDto } from './dto/mark-uploaded.dto';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload-url')
  getUploadUrl(@Body() dto: UploadDto) {
    return this.fileService.getUploadUrl(dto.fileName, dto.ownerId);
  }

  @Post('mark-uploaded')
  async markFileAsUploaded(@Body() dto: MarkUploadedDto) {
    return this.fileService.markAsUploaded(dto);
  }

  @Get('download-url/:id')
  getDownloadUrl(@Param('id') id: string, @Body('ownerId') ownerId: string) {
    return this.fileService.getDownloadUrl(id, ownerId);
  }
}

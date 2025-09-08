import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { FileService } from './file.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { MarkUploadedDto } from './dto/mark-uploaded.dto';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  async getAllActive(@Query('ownerId') ownerId: string) {
    return await this.fileService.getAllOwnerFiles(ownerId);
  }

  @Post('upload-url')
  getUploadUrl(@Body() dto: UploadFileDto) {
    return this.fileService.getUploadUrl(dto);
  }

  @Post('mark-uploaded')
  async markFileAsUploaded(@Body() dto: MarkUploadedDto) {
    return this.fileService.markAsUploaded(dto);
  }

  @Get('download-url/:id')
  getDownloadUrl(@Param('id') id: string, @Query('ownerId') ownerId: string) {
    return this.fileService.getDownloadUrl(id, ownerId);
  }

  @Delete('delete/:fileId')
  async deleteFile(
    @Param('fileId') fileId: string,
    @Query('ownerId') ownerId: string,
  ) {
    await this.fileService.deleteFile(fileId, ownerId);
    return { message: 'File deleted successfully' };
  }
}

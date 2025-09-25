import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FileService } from './file.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { MarkUploadedDto } from './dto/mark-uploaded.dto';
import { SetUserPipe } from 'src/common/pipes/set-user.pipe';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CognitoAuthGuard } from 'src/auth/auth.guard';
import type { Request } from 'express';
import { UserProfileDto } from 'src/common/dto/user-profile.dto';

@Controller('files')
@UseGuards(CognitoAuthGuard)
@ApiBearerAuth('cognitoAuth')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  async getAllActive(@Query('ownerId') ownerId: string, @Req() req: Request) {
    return await this.fileService.getAllOwnerFiles(
      ownerId,
      req.user as UserProfileDto,
    );
  }

  @Post('upload-url')
  getUploadUrl(@Body(SetUserPipe) dto: UploadFileDto) {
    return this.fileService.getUploadUrl(dto);
  }

  @Post('mark-uploaded')
  async markFileAsUploaded(@Body(SetUserPipe) dto: MarkUploadedDto) {
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

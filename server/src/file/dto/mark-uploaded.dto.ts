import { IsString, IsNotEmpty } from 'class-validator';

export class MarkUploadedDto {
  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @IsString()
  @IsNotEmpty()
  fileId: string;
}

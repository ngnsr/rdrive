import { IsString, IsNotEmpty, IsDefined, IsNumber } from 'class-validator';

export class UploadFileDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsDefined()
  @IsNumber()
  size: number;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  mimeType: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  hash: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  createdAt: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  modifiedAt: string;
}

import { IsString, IsNotEmpty, IsDefined, IsNumber } from 'class-validator';

export class UploadDto {
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
}

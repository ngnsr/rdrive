import { IsString, IsNotEmpty } from 'class-validator';

export class UploadDto {
  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;
}

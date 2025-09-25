import {
  IsString,
  IsNotEmpty,
  IsDefined,
  IsNumber,
  IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreatedUserDto } from 'src/common/dto/created-user.dto';

export class UploadFileDto extends CreatedUserDto {
  @ApiProperty({ description: 'Owner ID of the file (email)' })
  @IsDefined()
  @IsString()
  @IsEmail()
  ownerId: string;

  @ApiProperty({ description: 'Original file name with extension' })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'File size in bytes', example: 1024 })
  @IsDefined()
  @IsNumber()
  size: number;

  @ApiProperty({ description: 'MIME type of the file', example: 'image/png' })
  @IsString()
  @IsDefined()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({
    description: 'File hash for integrity check',
    example: 'd41d8cd98f00b204e9800998ecf8427e',
  })
  @IsString()
  @IsDefined()
  @IsNotEmpty()
  hash: string;

  @ApiProperty({
    description: 'ISO date string when file was created',
    example: '2025-09-23T12:34:56.000Z',
  })
  @IsString()
  @IsDefined()
  @IsNotEmpty()
  createdAt: string;

  @ApiProperty({
    description: 'ISO date string when file was last modified',
    example: '2025-09-23T12:34:56.000Z',
  })
  @IsString()
  @IsDefined()
  @IsNotEmpty()
  updatedAt: string;
}

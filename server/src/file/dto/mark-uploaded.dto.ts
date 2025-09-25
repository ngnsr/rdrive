import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UpdatedUserDto } from 'src/common/dto/updated-user.dto';

export class MarkUploadedDto extends UpdatedUserDto {
  @ApiProperty({ description: 'Owner ID of the file (Cognito user ID)' })
  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @ApiProperty({ description: 'Unique identifier of the file' })
  @IsString()
  @IsNotEmpty()
  fileId: string;
}

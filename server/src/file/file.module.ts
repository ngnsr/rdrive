import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { AwsModule } from '../aws/aws.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AwsModule, AuthModule],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}

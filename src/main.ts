import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('File Sync API')
    .setDescription('API for uploading, downloading, and syncing files')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Get port from ConfigService
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Swagger docs available on http://localhost:${port}/api`);
}

bootstrap();

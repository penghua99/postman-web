import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.standalone';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    abortOnError: process.env.NODE_ENV !== 'development',
  });

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: true,
    }),
  );

  const logger = new Logger('Bootstrap');
  const host = process.env.SERVER_HOST || '0.0.0.0';
  const port = Number(process.env.SERVER_PORT || '3000');

  await app.listen(port, host);
  logger.log(`Server running on http://${host}:${port}`);
  logger.log(`API endpoints ready at http://${host}:${port}/api`);
}

bootstrap();

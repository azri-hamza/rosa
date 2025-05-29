import 'reflect-metadata'; // ✅ Required for TypeORM metadata

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const logger = new Logger('Application');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });
  
  // Add request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.log(`Incoming ${req.method} request to ${req.url}`);
    next();
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Enable CORS for the frontend
  app.enableCors({
    origin: ['http://localhost:4200'], // Angular dev server
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();

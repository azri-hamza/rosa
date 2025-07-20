import 'reflect-metadata'; // ✅ Required for TypeORM metadata

import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const logger = new Logger('Application');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });
  
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1', // Optional
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
    origin: [
      'http://localhost:4200', // Angular dev server
      'http://localhost:8080', // Flutter web dev server
      'http://10.0.2.2:3000',  // Android emulator access to host
    ],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0'; // Bind to all interfaces for emulator access
  
  await app.listen(port, host);
  logger.log(
    `🚀 Application is running on: http://${host}:${port}/${globalPrefix}`
  );
  logger.log(
    `📱 Android emulator can access via: http://10.0.2.2:${port}/${globalPrefix}`
  );
}

bootstrap();

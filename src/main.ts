import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { DomainExceptionFilter } from './infrastructure/http/filters/domain-exception.filter.ts';
import { Logger } from 'nestjs-pino';
import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  app.useLogger(app.get(Logger));
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new DomainExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();

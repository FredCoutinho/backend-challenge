import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './shared/infra/database/database.module.ts';
import { WalletModule } from './wallet.module.ts';
import { MessagingModule } from './shared/infra/messaging/messaging.module.ts';
import { ScheduleModule } from '@nestjs/schedule';
import { PendingReferenceWorker } from './infrastructure/workers/pending-reference.worker.ts';
import { WageringController } from './infrastructure/http/controllers/wagering.controller.ts';
import { WalletsController } from './infrastructure/http/controllers/wallets.controller.ts';
import { WagerService } from './domain/services/wager.service.ts';
import { WalletService } from './domain/services/wallet.service.ts';
import { SqsProducerService } from './infrastructure/messaging/sqs-producer.service.ts';
import { SqsConsumerService } from './infrastructure/messaging/sqs-consumer.service.ts';
import { OutboxRelayWorker } from './infrastructure/workers/outbox-relay.worker.ts';
import { LoggerModule } from 'nestjs-pino';
import { CorrelationIdMiddleware, CORRELATION_ID_HEADER } from './infrastructure/logging/correlation-id.middleware.ts';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    DatabaseModule, 
    WalletModule,
    MessagingModule,
    ScheduleModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        // Injeta o correlationId em todos os logs de requisição HTTP
        customProps: (req: any) => ({
          correlationId: req.headers[CORRELATION_ID_HEADER],
        }),
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'body.password',
            'body.token',
            'body.secret',
            'body.creditCard',
          ],
          censor: '***REDACTED***',
        },
      }
    }),
  ],
  controllers: [
    AppController,
    WageringController,
    WalletsController
  ],
  providers: [
    AppService, 
    PendingReferenceWorker,
    WalletService,
    WagerService,
    SqsProducerService,
    SqsConsumerService,
    OutboxRelayWorker
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}

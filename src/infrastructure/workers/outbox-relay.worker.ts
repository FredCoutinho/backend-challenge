import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/core';
import { OutboxMessage, OutboxStatus } from '../../domain/entities/outbox-message.entity.ts';
import { SqsProducerService } from '../messaging/sqs-producer.service.ts';

@Injectable()
export class OutboxRelayWorker {
  private readonly logger = new Logger(OutboxRelayWorker.name);
  private isProcessing = false;

  constructor(
    private readonly em: EntityManager,
    private readonly sqsProducer: SqsProducerService,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleOutboxRelay() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const em = this.em.fork();

    try {
      const pendingMessages = await em.find(
        OutboxMessage,
        { status: OutboxStatus.PENDING },
        { limit: 20, orderBy: { createdAt: 'ASC' } },
      );

      for (const msg of pendingMessages) {
        try {
          await this.sqsProducer.sendEvent(msg.payload as any);

          msg.status = OutboxStatus.PROCESSED;
          msg.processedAt = new Date();
        } catch (error: any) {
          msg.retryCount += 1;
          msg.errorMessage = error.message;

          if (msg.retryCount >= 5) {
            msg.status = OutboxStatus.FAILED;
          }
        }
      }

      if (pendingMessages.length > 0) {
        await em.flush();
        this.logger.log(`${pendingMessages.length} mensagem(ns) do Outbox processada(s).`);
      }
    } catch (error) {
      this.logger.error('Erro ao processar mensagens do Outbox', error);
    } finally {
      this.isProcessing = false;
    }
  }
}
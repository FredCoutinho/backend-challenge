import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { EntityManager } from '@mikro-orm/core';
import { InboxMessage } from '../../domain/entities/inbox-message.entity.ts';
import { IntegrationEvent } from '../../domain/events/integration-event.interface.ts';

@Injectable()
export class SqsConsumerService {
  private readonly logger = new Logger(SqsConsumerService.name);
  private readonly sqsClient: SQSClient;
  private readonly queueUrl = 'http://localhost:4566/000000000000/wager-transactions.fifo';
  private isPolling = false;

  constructor(private readonly em: EntityManager) {
    this.sqsClient = new SQSClient({
      region: 'us-east-1',
      endpoint: 'http://localhost:4566',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
    });
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async pollMessages() {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      const response = await this.sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 5,
          WaitTimeSeconds: 2,
        }),
      );

      if (!response.Messages || response.Messages.length === 0) {
        return;
      }

      for (const message of response.Messages) {
        if (!message.Body || !message.ReceiptHandle) continue;

        const event: IntegrationEvent = JSON.parse(message.Body);
        const processedSuccessfully = await this.processMessageWithInbox(event);

        if (processedSuccessfully) {
          // ACK: Deleta a mensagem no SQS somente após o commit com sucesso no banco de dados
          await this.sqsClient.send(
            new DeleteMessageCommand({
              QueueUrl: this.queueUrl,
              ReceiptHandle: message.ReceiptHandle,
            }),
          );
        }
      }
    } catch (error) {
      this.logger.error('Erro ao consumir mensagens do SQS', error);
    } finally {
      this.isPolling = false;
    }
  }

  private async processMessageWithInbox(event: IntegrationEvent): Promise<boolean> {
    const em = this.em.fork();

    try {
      // 1. Verificação de Idempotência pelo Inbox
      const existingInbox = await em.findOne(InboxMessage, { eventId: event.eventId });
      if (existingInbox) {
        this.logger.warn(`Mensagem duplicada ignorada (eventId: ${event.eventId})`);
        return true; // Retorna true para dar o ACK e remover do SQS
      }

      // 2. Processamento da regra de negócio associada ao evento
      this.logger.log(`Processando evento '${event.eventType}' (eventId: ${event.eventId})`);

      // 3. Registro no Inbox dentro da mesma transação
      const inboxEntry = new InboxMessage({
        eventId: event.eventId,
        eventType: event.eventType,
      });
      em.persist(inboxEntry);

      await em.flush();
      return true;
    } catch (error) {
      this.logger.error(`Falha ao processar mensagem (eventId: ${event.eventId})`, error);
      // Retorna false para não dar ACK; o SQS tentará reentregar ou enviará para a DLQ após o maxReceiveCount
      return false;
    }
  }
}
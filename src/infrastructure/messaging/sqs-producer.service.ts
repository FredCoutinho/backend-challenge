import { Injectable } from '@nestjs/common';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { IntegrationEvent } from '../../domain/events/integration-event.interface.ts';

@Injectable()
export class SqsProducerService {
  private readonly sqsClient: SQSClient;
  private readonly queueUrl = 'http://localhost:4566/000000000000/wager-transactions.fifo';

  constructor() {
    this.sqsClient = new SQSClient({
      region: 'us-east-1',
      endpoint: 'http://localhost:4566',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
    });
  }

  async sendEvent(event: IntegrationEvent): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(event),
      MessageGroupId: event.eventType, // Garante ordenação sequencial por tipo na fila FIFO
      MessageDeduplicationId: event.eventId, // Evita duplicidade no nível do SQS
    });

    await this.sqsClient.send(command);
  }
}
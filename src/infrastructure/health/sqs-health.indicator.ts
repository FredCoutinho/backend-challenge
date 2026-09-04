import { Injectable } from '@nestjs/common';
import { HealthIndicatorService, HealthIndicatorResult } from '@nestjs/terminus';
import { SQSClient, ListQueuesCommand } from '@aws-sdk/client-sqs';

@Injectable()
export class SqsHealthIndicator {
  private readonly sqsClient: SQSClient;

  constructor(private readonly healthIndicatorService: HealthIndicatorService) {
    this.sqsClient = new SQSClient({
      region: 'us-east-1',
      endpoint: 'http://localhost:4566',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
    });
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.sqsClient.send(new ListQueuesCommand({ MaxResults: 1 }));
      return indicator.up();
    } catch (error: any) {
      return indicator.down({ message: error.message });
    }
  }
}
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SqsHealthIndicator } from './sqs-health.indicator.ts';

describe('SqsHealthIndicator', () => {
  let indicator: SqsHealthIndicator;
  let healthIndicatorServiceMock: any;

  beforeEach(() => {
    healthIndicatorServiceMock = {
      check: jest.fn().mockReturnValue({
        up: jest.fn().mockReturnValue({ sqs: { status: 'up' } }),
        down: jest.fn().mockReturnValue({ sqs: { status: 'down', message: 'Connection refused' } }),
      }),
    };

    indicator = new SqsHealthIndicator(healthIndicatorServiceMock);
  });

  it('deve retornar status up quando o SQS responder', async () => {
    // Mock do SQSClient send
    (indicator as any).sqsClient.send = jest.fn<() => Promise<any>>().mockResolvedValue({});

    const result = await indicator.isHealthy('sqs');
    expect(result).toEqual({ sqs: { status: 'up' } });
  });

  it('deve retornar status down quando houver falha no SQS', async () => {
    (indicator as any).sqsClient.send = jest.fn(() => Promise.reject(new Error('Connection refused')));

    const result = await indicator.isHealthy('sqs');
    expect(result).toEqual({ sqs: { status: 'down', message: 'Connection refused' } });
  });
});
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SqsConsumerService } from './sqs-consumer.service.ts';

describe('SqsConsumerService', () => {
  let service: SqsConsumerService;
  let emMock: any;

  beforeEach(() => {
    emMock = {
      fork: jest.fn().mockReturnValue({
        findOne: jest.fn<() => Promise<null>>().mockResolvedValue(null),
        persist: jest.fn(),
        flush: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      }),
    };

    service = new SqsConsumerService(emMock);
  });

  it('deve instanciar o consumidor SQS com sucesso', () => {
    expect(service).toBeDefined();
  });
});
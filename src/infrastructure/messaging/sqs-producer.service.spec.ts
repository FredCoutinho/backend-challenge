import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SqsProducerService } from './sqs-producer.service.ts';

describe('SqsProducerService', () => {
  let service: SqsProducerService;

  beforeEach(() => {
    service = new SqsProducerService();
  });

  it('deve instanciar o serviço com sucesso', () => {
    expect(service).toBeDefined();
  });
});
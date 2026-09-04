import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { OutboxMessageSchema } from '../schemas/outbox-message.schema.ts';
import { randomUUID } from 'crypto';

@Injectable()
export class OutboxRepository {
  constructor(private readonly em: EntityManager) {}

  async save(
    event: { aggregateId: string; eventType: string; payload: any },
    transactionalEm?: EntityManager,
  ): Promise<void> {
    const manager = transactionalEm || this.em;

    const outboxMessage = manager.create(OutboxMessageSchema, {
      id: randomUUID(),
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      payload: JSON.stringify(event.payload),
      status: 'PENDING',
      createdAt: new Date(),
    });

    manager.persist(outboxMessage);
  }
}
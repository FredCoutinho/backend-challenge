import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InboxMessageSchema } from '../schemas/inbox-message.schema.ts';
import { randomUUID } from 'crypto';

@Injectable()
export class InboxRepository {
  constructor(private readonly em: EntityManager) {}

  async isProcessed(messageId: string, transactionalEm?: EntityManager): Promise<boolean> {
    const manager = transactionalEm || this.em;
    const existing = await manager.findOne(InboxMessageSchema, { messageId });
    return !!existing;
  }

  async saveProcessed(
    messageId: string,
    eventType: string,
    payload: any,
    transactionalEm?: EntityManager,
  ): Promise<void> {
    const manager = transactionalEm || this.em;

    const inboxMessage = manager.create(InboxMessageSchema, {
      id: randomUUID(),
      messageId,
      eventType,
      payload: JSON.stringify(payload),
      processedAt: new Date(),
    });

    manager.persist(inboxMessage);
  }
}
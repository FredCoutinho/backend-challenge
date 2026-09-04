import { EntitySchema } from '@mikro-orm/core';

export const OutboxMessageSchema = new EntitySchema({
  name: 'OutboxMessage',
  tableName: 'outbox_messages',
  properties: {
    id: { type: 'string', primary: true, length: 36 },
    aggregateId: { type: 'string', length: 36, fieldName: 'aggregate_id' },
    eventType: { type: 'string', length: 100, fieldName: 'event_type' },
    payload: { type: 'json' },
    status: { type: 'string', length: 20 },
    createdAt: { type: 'date', fieldName: 'created_at' },
    publishedAt: { type: 'date', nullable: true, fieldName: 'published_at' },
  },
});
import { EntitySchema } from '@mikro-orm/core';

export const InboxMessageSchema = new EntitySchema({
  name: 'InboxMessage',
  tableName: 'inbox_messages',
  properties: {
    id: { type: 'string', primary: true, length: 36 },
    messageId: { type: 'string', length: 150, unique: true, fieldName: 'message_id' },
    payloadHash: { type: 'string', length: 64, fieldName: 'payload_hash' },
    status: { type: 'string', length: 20 },
    createdAt: { type: 'date', fieldName: 'created_at' },
    processedAt: { type: 'date', nullable: true, fieldName: 'processed_at' },
  },
});
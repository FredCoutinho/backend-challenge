import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'inbox_messages' })
export class InboxMessage {
  @PrimaryKey({ type: 'uuid' })
  id: string = crypto.randomUUID();

  @Property({ type: 'varchar', length: 255, unique: true })
  eventId!: string;

  @Property({ type: 'varchar', length: 100 })
  eventType!: string;

  @Property({ type: 'datetime' })
  processedAt: Date = new Date();

  constructor(partial?: Partial<InboxMessage>) {
    Object.assign(this, partial);
  }
}
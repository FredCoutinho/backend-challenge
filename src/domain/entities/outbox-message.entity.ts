import { Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core';

export enum OutboxStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

@Entity({ tableName: 'outbox_messages' })
export class OutboxMessage {
  @PrimaryKey({ type: 'uuid' })
  id: string = crypto.randomUUID();

  @Property({ type: 'varchar', length: 100 })
  eventType!: string;

  @Property({ type: 'json' })
  payload!: Record<string, any>;

  @Enum(() => OutboxStatus)
  status: OutboxStatus = OutboxStatus.PENDING;

  @Property({ type: 'int', default: 0 })
  retryCount: number = 0;

  @Property({ type: 'varchar', length: 255, nullable: true })
  errorMessage?: string;

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();

  @Property({ type: 'datetime', nullable: true })
  processedAt?: Date;

  constructor(partial?: Partial<OutboxMessage>) {
    Object.assign(this, partial);
  }
}
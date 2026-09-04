import { Entity, Enum, ManyToOne, Property, PrimaryKey } from '@mikro-orm/core';
import { TransactionKind } from '../enums/transaction.enums.ts';
import { Wallet } from './wallet.entity.ts';

@Entity({ tableName: 'transactions' })
export class Transaction {
  @PrimaryKey({ type: 'uuid' })
  id: string = crypto.randomUUID();

  @ManyToOne(() => Wallet)
  wallet!: Wallet;

  @Enum(() => TransactionKind)
  kind!: TransactionKind;

  @Property({ type: 'varchar', length: 50 })
  amount!: string;

  @Property({ type: 'varchar', length: 3 })
  currency!: string;

  @Property({ type: 'varchar', length: 255 })
  idempotencyKey!: string;

  @Property({ type: 'varchar', length: 64 })
  payloadHash!: string;

  @Property({ type: 'uuid', nullable: true })
  referenceTransactionId?: string;

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();

  constructor(partial?: Partial<Transaction>) {
    Object.assign(this, partial);
  }
}
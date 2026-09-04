import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { Money } from '../value-objects/money.ts';
import { MoneyType } from '../../shared/infra/database/types/money.type.ts';
import { TransactionKind, TransactionStatus } from '../enums/transaction.enums.ts';

@Entity({ tableName: 'wager_transactions' })
export class WagerTransaction {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv4();

  @Index()
  @Property({ type: 'varchar', length: 255, unique: true })
  idempotencyKey!: string;

  @Index()
  @Property({ type: 'varchar', length: 255 })
  walletId!: string;

  @Property({ type: 'enum', name: 'transaction_kind' })
  kind!: TransactionKind;

  @Property({ type: 'varchar', length: 50, default: 'PENDING' })
  status!: string;

  @Property({ type: MoneyType })
  amount!: Money;

  @Property({ type: 'varchar', length: 255, nullable: true })
  referenceTransactionId?: string;

  @Property({ type: 'varchar', length: 64 })
  payloadHash!: string;

  @Property({ type: 'varchar', length: 100, nullable: true })
  failureCode?: string;

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();

  @Property({ type: 'datetime', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(partial?: Partial<WagerTransaction>) {
    Object.assign(this, partial);
  }
}
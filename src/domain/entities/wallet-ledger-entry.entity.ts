import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { Money } from '../value-objects/money.ts';
import { MoneyType } from '../../shared/infra/database/types/money.type.ts';
import { LedgerDirection } from '../enums/transaction.enums.ts';
import { Wallet } from '../entities/wallet.entity.ts';
import { WagerTransaction } from '../entities/wager-transaction.entity.ts';

@Entity({ tableName: 'wallet_ledger_entries' })
export class WalletLedgerEntry {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv4();

  @ManyToOne(() => Wallet)
  wallet!: Wallet;

  @ManyToOne(() => WagerTransaction)
  transaction!: WagerTransaction;

  @Property({ type: MoneyType })
  amount!: Money;

  @Property({ type: MoneyType })
  balanceBefore!: Money;

  @Property({ type: MoneyType })
  balanceAfter!: Money;

  @Property({ type: 'enum', name: 'ledger_direction' })
  direction!: LedgerDirection;

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();

  constructor(partial?: Partial<WalletLedgerEntry>) {
    Object.assign(this, partial);
  }
}
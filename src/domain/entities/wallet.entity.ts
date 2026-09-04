import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { Money } from '../value-objects/money.ts';

@Entity({ tableName: 'wallets' })
export class Wallet {
  @PrimaryKey({ type: 'uuid' })
  id: string = crypto.randomUUID();

  @Property({ type: 'varchar' })
  playerId!: string;

  @Property({ type: 'varchar', length: 3 })
  currency!: string;

  @Property({ type: 'json' })
  private _balance!: { amount: string; currency: string };

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();

  @Property({ type: 'datetime', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  get balance(): Money {
    return Money.from({
      amount: this._balance.amount,
      currency: this._balance.currency,
    });
  }
}
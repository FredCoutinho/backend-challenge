import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Wallet } from '../../../../domain/wallet/wallet.ts';
import { Money } from '../../../../domain/value-objects/money.ts';
import { WalletSchema } from '../schemas/wallet.schema.ts';

@Injectable()
export class WalletRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string, transactionalEm?: EntityManager): Promise<Wallet | null> {
    const manager = transactionalEm || this.em;
    const rawWallet = await manager.findOne(WalletSchema, { id });
    if (!rawWallet) return null;

    return Wallet.rehydrate({
      id: rawWallet.id,
      playerId: rawWallet.playerId,
      currency: rawWallet.currency,
      balance: {
        amount: String(rawWallet.balance),
        currency: rawWallet.currency,
      },
      version: rawWallet.version,
      createdAt: rawWallet.createdAt,
      updatedAt: rawWallet.updatedAt,
    });
  }

  async save(wallet: Wallet, transactionalEm?: EntityManager): Promise<void> {
    const manager = transactionalEm || this.em;
    const balanceAmount = (wallet.balance as any).amount ?? wallet.balance.valueOf();

    const data = {
      id: wallet.id,
      playerId: wallet.playerId,
      currency: wallet.currency,
      balance: balanceAmount,
      version: wallet.version,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };

    const existing = await manager.findOne(WalletSchema, { id: wallet.id });
    
    if (existing) {
      manager.assign(existing, data);
    } else {
      const newWallet = manager.create(WalletSchema, data);
      manager.persist(newWallet);
    }

    await manager.flush();
  }
}
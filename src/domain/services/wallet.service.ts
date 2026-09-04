import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Wallet } from '../entities/wallet.entity.ts';
import { Transaction } from '../entities/transaction.entity.ts';
import { Money, MoneyProps } from '../value-objects/money.ts';

@Injectable()
export class WalletService {
  constructor(private readonly em: EntityManager) {}

  async getWalletById(id: string) {
    const wallet = await this.em.findOne(Wallet, { id });
    if (!wallet) {
      throw new NotFoundException(`Carteira com ID '${id}' não encontrada.`);
    }

    return {
      id: wallet.id,
      playerId: wallet.playerId,
      balance: typeof wallet.balance === 'object' ? (wallet.balance as any).amount : wallet.balance,
      currency: wallet.currency,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  async getLedger(walletId: string, limit: number = 10, startingAfter?: string) {
    const wallet = await this.em.findOne(Wallet, { id: walletId });
    if (!wallet) {
      throw new NotFoundException(`Carteira com ID '${walletId}' não encontrada.`);
    }

    const where: any = { wallet: walletId };

    if (startingAfter) {
      const refTx = await this.em.findOne(Transaction, { id: startingAfter });
      if (refTx) {
        where.createdAt = { $lt: refTx.createdAt };
      }
    }

    // em.find evita a necessidade de casting do SqlEntityManager
    const items = await this.em.find(
      Transaction,
      where,
      {
        orderBy: { createdAt: 'DESC', id: 'DESC' },
        limit: limit + 1,
      },
    );

    const hasMore = items.length > limit;

    if (hasMore) {
      items.pop(); // Remove o item excedente usado para detecção de próxima página
    }

    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    return {
      data: items,
      hasMore,
      nextCursor,
    };
  }

  async reconcile(walletId: string, expectedBalanceStr: string, currency: string) {
    const wallet = await this.em.findOne(Wallet, { id: walletId });
    if (!wallet) {
      throw new NotFoundException(`Carteira com ID '${walletId}' não encontrada.`);
    }

    const currentBalance = wallet.balance;
    const expectedBalance = Money.from({ amount: expectedBalanceStr, currency: currency });

    const isMatch = currentBalance.equals(expectedBalance);
    const discrepancy = currentBalance.subtract(expectedBalance);

    return {
      walletId: wallet.id,
      status: isMatch ? 'MATCH' : 'DISCREPANCY',
      storedBalance: currentBalance.value,
      expectedBalance: expectedBalance.value,
      discrepancy: discrepancy.value,
      currency: wallet.currency,
      reconciledAt: new Date(),
    };
  }
}
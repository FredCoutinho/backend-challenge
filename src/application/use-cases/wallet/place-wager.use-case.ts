import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { WalletRepository } from '../../../shared/infra/database/repositories/wallet.repository.ts';
import { Money } from '../../../domain/value-objects/money.ts';
import { WagerTransactionSchema } from '../../../shared/infra/database/schemas/wager-transaction.schema.ts';
import { WalletLedgerEntrySchema } from '../../../shared/infra/database/schemas/wallet-ledger-entry.schema.ts';
import { randomUUID } from 'crypto';
import { OutboxRepository } from '../../../shared/infra/database/repositories/outbox.repository.ts';

export interface PlaceWagerCommand {
  walletId: string;
  amount: number | string;
  currency: string;
  externalTransactionId: string; // Chave de idempotência
}

@Injectable()
export class PlaceWagerUseCase {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly outboxRepository: OutboxRepository,
    private readonly em: EntityManager,
  ) {}

  async execute(command: PlaceWagerCommand): Promise<void> {
    await this.em.transactional(async (trxEm) => {
      const existingTx = await trxEm.findOne(WagerTransactionSchema, {
        externalId: command.externalTransactionId,
      });
      if (existingTx) return;

      const wallet = await this.walletRepository.findById(command.walletId, trxEm);
      if (!wallet) {
        throw new NotFoundException('Carteira não encontrada.');
      }

      const wagerMoney = Money.from({
        amount: String(command.amount),
        currency: command.currency,
      });

      wallet.debit(wagerMoney);
      await this.walletRepository.save(wallet, trxEm);

      const txId = randomUUID();
      const wagerTx = trxEm.create(WagerTransactionSchema, {
        id: txId,
        walletId: wallet.id,
        amount: String(command.amount),
        currency: command.currency,
        type: 'WAGER',
        externalId: command.externalTransactionId,
        createdAt: new Date(),
      });
      trxEm.persist(wagerTx);

      const ledgerEntry = trxEm.create(WalletLedgerEntrySchema, {
        id: randomUUID(),
        walletId: wallet.id,
        transactionId: txId,
        amount: `-${command.amount}`,
        balanceAfter: wallet.balance.valueOf(),
        createdAt: new Date(),
      });
      trxEm.persist(ledgerEntry);

      await this.outboxRepository.save(
        {
          aggregateId: wallet.id,
          eventType: 'WalletDebitedEvent',
          payload: {
            walletId: wallet.id,
            playerId: wallet.playerId,
            amount: command.amount,
            currency: command.currency,
            transactionId: txId,
            balanceAfter: wallet.balance.valueOf(),
          },
        },
        trxEm,
      );
    });
  }
}
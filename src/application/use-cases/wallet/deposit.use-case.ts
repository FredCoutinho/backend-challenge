import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { WalletRepository } from '../../../shared/infra/database/repositories/wallet.repository.ts';
import { Money } from '../../../domain/value-objects/money.ts';
import { WagerTransactionSchema } from '../../../shared/infra/database/schemas/wager-transaction.schema.ts';
import { WalletLedgerEntrySchema } from '../../../shared/infra/database/schemas/wallet-ledger-entry.schema.ts';
import { randomUUID } from 'crypto';

export interface DepositCommand {
  walletId: string;
  amount: number | string;
  currency: string;
  externalTransactionId: string; // Chave de idempotência
  type?: 'DEPOSIT' | 'WIN'; // Permite diferenciar se é depósito de saldo ou premiação
}

@Injectable()
export class DepositUseCase {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly em: EntityManager,
  ) {}

  async execute(command: DepositCommand): Promise<void> {
    await this.em.transactional(async (trxEm) => {
      // 1. Verificação de idempotência
      const existingTx = await trxEm.findOne(WagerTransactionSchema, {
        externalId: command.externalTransactionId,
      });
      if (existingTx) {
        return; // Transação já processada anteriormente (idempotente)
      }

      // 2. Busca a carteira utilizando a transação ativa
      const wallet = await this.walletRepository.findById(command.walletId, trxEm);
      if (!wallet) {
        throw new NotFoundException('Carteira não encontrada.');
      }

      const depositMoney = Money.from({
        amount: String(command.amount),
        currency: command.currency,
      });

      // 3. Aplica a regra de negócio de crédito na carteira
      wallet.credit(depositMoney);

      // 4. Salva a carteira com a versão atualizada
      await this.walletRepository.save(wallet, trxEm);

      // 5. Registra a transação financeira
      const txId = randomUUID();
      const transactionType = command.type ?? 'DEPOSIT';
      const depositTx = trxEm.create(WagerTransactionSchema, {
        id: txId,
        walletId: wallet.id,
        amount: String(command.amount),
        currency: command.currency,
        type: transactionType,
        externalId: command.externalTransactionId,
        createdAt: new Date(),
      });
      trxEm.persist(depositTx);

      // 6. Registra a entrada imutável positiva no Ledger (extrato)
      const ledgerEntry = trxEm.create(WalletLedgerEntrySchema, {
        id: randomUUID(),
        walletId: wallet.id,
        transactionId: txId,
        amount: `+${command.amount}`,
        balanceAfter: wallet.balance.valueOf(),
        createdAt: new Date(),
      });
      trxEm.persist(ledgerEntry);
    });
  }
}
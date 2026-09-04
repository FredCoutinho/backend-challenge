import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Wallet } from '../entities/wallet.entity.ts';
import { WagerTransaction } from '../entities/wager-transaction.entity.ts';
import { WalletLedgerEntry } from '../entities/wallet-ledger-entry.entity.ts';
import { Money } from '../value-objects/money.ts';
import { FailureCode } from '../enums/failure-code.enum.ts';
import { TransactionKind } from '../enums/transaction.enums.ts';
import { withRetry } from '../../infrastructure/utils/retry.util.ts';
import { DomainException } from '../exceptions/domain.exception.ts';


@Injectable()
export class WagerService {
  constructor(private readonly em: EntityManager) {}

  async processBet(
    playerId: string,
    walletId: string,
    idempotencyKey: string,
    payloadHash: string,
    rawAmount: string,
    currency: string,
  ): Promise<void> {
    return withRetry(async () => {
      const em = this.em.fork();
      await em.transactional(async (EntityManager) => {
        const wallet = await EntityManager.findOne(
          Wallet,
          { id: walletId },
          { lockMode: 1 },
        );
        if (!wallet) throw new DomainException(FailureCode.REFERENCE_NOT_FOUND, 'Wallet not found');

        const betAmount = Money.from({
          amount: rawAmount,
          currency: currency,
        });

        if (wallet.balance.isLessThan(betAmount)) {
          throw new DomainException(FailureCode.INSUFFICIENT_FUNDS, 'Insufficient funds');
        }

        wallet.balance = wallet.balance.subtract(betAmount);

        const tx = new WagerTransaction({
          id: crypto.randomUUID(),
          idempotencyKey,
          walletId,
          kind: TransactionKind.BET,
          status: 'SETTLED',
          amount: betAmount,
          payloadHash,
        });

        const ledger = new WalletLedgerEntry({
          wallet,
          transaction: tx,
          amount: betAmount,
          balanceAfter: wallet.balance,
        });

        EntityManager.persist([wallet, tx, ledger]);
      });
    });
  }

  async processLoss(
    walletId: string,
    idempotencyKey: string,
    payloadHash: string,
    currency: string,
  ): Promise<void> {
    return withRetry(async () => {
      const em = this.em.fork();
      await em.transactional(async (EntityManager) => {
        const zeroAmount = Money.from({ amount: '0', currency });

        const tx = new WagerTransaction({
          id: crypto.randomUUID(),
          idempotencyKey,
          walletId,
          kind: TransactionKind.LOSS,
          status: 'SETTLED',
          amount: zeroAmount,
          payloadHash,
        });
        EntityManager.persist(tx);
      });
    });
  }

  async processRefund(
    referenceTransactionId: string,
    idempotencyKey: string,
    payloadHash: string,
    rawAmount: string,
    currency: string,
  ): Promise<void> {
    return withRetry(async () => {
      const em = this.em.fork();
      await em.transactional(async (EntityManager) => {
        const originalTx = await EntityManager.findOne(WagerTransaction, {
          id: referenceTransactionId,
        });

        const refundAmount = Money.from({
          amount: rawAmount,
          currency: currency,
        });

        if (!originalTx) {
          const pendingTx = new WagerTransaction({
            id: crypto.randomUUID(),
            idempotencyKey,
            walletId: '',
            kind: TransactionKind.REFUND,
            status: 'PENDING_REFERENCE',
            amount: refundAmount,
            referenceTransactionId,
            payloadHash,
          });
          EntityManager.persist(pendingTx);
          return;
        }

        const originalLedger = await EntityManager.findOne(WalletLedgerEntry, {
          transaction: originalTx,
        });
        if (!originalLedger) {
          throw new DomainException(FailureCode.REFERENCE_NOT_FOUND, 'Wallet ledger entry not found');
        }

        const wallet = await EntityManager.findOne(
          Wallet,
          { id: originalLedger.wallet.id },
          { lockMode: 1 },
        );

        if (!wallet) throw new DomainException(FailureCode.REFERENCE_NOT_FOUND, 'Wallet not found');

        Object.assign(wallet, { balance: wallet.balance.add(refundAmount) });

        const tx = new WagerTransaction({
          id: crypto.randomUUID(),
          idempotencyKey,
          walletId: wallet.id,
          kind: TransactionKind.REFUND,
          status: 'SETTLED',
          amount: refundAmount,
          referenceTransactionId: originalTx.id,
          payloadHash,
        });

        const ledger = new WalletLedgerEntry({
          wallet,
          transaction: tx,
          amount: refundAmount,
          balanceAfter: wallet.balance,
        });

        EntityManager.persist([wallet, tx, ledger]);
      });
    });
  }

  async processRollback(
    referenceTransactionId: string,
    idempotencyKey: string,
    payloadHash: string,
    currency: string,
  ): Promise<void> {
    return withRetry(async () => {
      const em = this.em.fork();
      await em.transactional(async (EntityManager) => {
        const originalTx = await EntityManager.findOne(WagerTransaction, {
          id: referenceTransactionId,
        });

        if (!originalTx) {
          const zeroAmount = Money.from({ amount: '0', currency });
          const pendingTx = new WagerTransaction({
            id: crypto.randomUUID(),
            idempotencyKey,
            walletId: '',
            kind: TransactionKind.ROLLBACK,
            status: 'PENDING_REFERENCE',
            amount: zeroAmount,
            referenceTransactionId,
            payloadHash,
          });
          EntityManager.persist(pendingTx);
          return;
        }

        const originalLedger = await EntityManager.findOne(WalletLedgerEntry, {
          transaction: originalTx,
        });
        if (!originalLedger) {
          throw new DomainException(FailureCode.REFERENCE_NOT_FOUND, 'Wallet ledger entry not found');
        }

        const wallet = await EntityManager.findOne(
          Wallet,
          { id: originalLedger.wallet.id },
          { lockMode: 1 },
        );

        if (!wallet) throw new DomainException(FailureCode.REFERENCE_NOT_FOUND, 'Wallet not found');

        const rollbackAmount = originalTx.amount;
        Object.assign(wallet, { balance: wallet.balance.add(rollbackAmount) });

        const tx = new WagerTransaction({
          id: crypto.randomUUID(),
          idempotencyKey,
          walletId: wallet.id,
          kind: TransactionKind.ROLLBACK,
          status: 'SETTLED',
          amount: rollbackAmount,
          referenceTransactionId: originalTx.id,
          payloadHash,
        });

        const ledger = new WalletLedgerEntry({
          wallet,
          transaction: tx,
          amount: rollbackAmount,
          balanceAfter: wallet.balance,
        });

        EntityManager.persist([wallet, tx, ledger]);
      });
    });
  }
}
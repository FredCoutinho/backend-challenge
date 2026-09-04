import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { PendingReferenceWorker } from './pending-reference.worker.ts';
import { WagerTransaction } from '../../domain/entities/wager-transaction.entity.ts';
import { Wallet } from '../../domain/entities/wallet.entity.ts';
import { WalletLedgerEntry } from '../../domain/entities/wallet-ledger-entry.entity.ts';
import { Money } from '../../domain/value-objects/money.ts';
import { TransactionKind } from '../../domain/enums/transaction.enums.ts';

describe('PendingReferenceWorker', () => {
  let worker: PendingReferenceWorker;
  let emMock: any;
  let forkEmMock: any;

  beforeEach(async () => {
    forkEmMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      transactional: jest.fn(async (cb: (em: any) => any) => cb(forkEmMock)),
      persist: jest.fn(),
    };

    emMock = {
      fork: jest.fn().mockReturnValue(forkEmMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PendingReferenceWorker,
        { provide: EntityManager, useValue: emMock },
      ],
    }).compile();

    worker = module.get<PendingReferenceWorker>(PendingReferenceWorker);
  });

  it('deve reprocessar transação pendente assim que a transação original for encontrada', async () => {
    const pendingTx = {
      id: 'tx-refund-pending',
      referenceTransactionId: 'tx-bet-original',
      kind: TransactionKind.REFUND,
      amount: Money.from({ amount: '50.00', currency: 'BRL' }),
      status: 'PENDING_REFERENCE',
    };

    const originalTx = {
      id: 'tx-bet-original',
      kind: TransactionKind.BET,
    };

    const mockWallet = {
      id: 'wallet-123',
      balance: Money.from({ amount: '100.00', currency: 'BRL' }),
    };

    const mockLedger = {
      wallet: mockWallet,
      transaction: originalTx,
    };

    forkEmMock.find.mockResolvedValue([pendingTx]);
    
    forkEmMock.findOne.mockImplementation((entity: any, query: any) => {
      if (entity === WagerTransaction && query.id === 'tx-bet-original') {
        return Promise.resolve(originalTx);
      }
      if (entity === WalletLedgerEntry) {
        return Promise.resolve(mockLedger);
      }
      if (entity === Wallet) {
        return Promise.resolve(mockWallet);
      }
      return Promise.resolve(null);
    });

    await worker.processPendingReferences();

    expect(pendingTx.status).toBe('SETTLED');
    expect(forkEmMock.persist).toHaveBeenCalled();
  });
});
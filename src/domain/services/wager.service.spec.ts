import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { WagerService } from './wager.service.ts';
import { Wallet } from '../entities/wallet.entity.ts';
import { WagerTransaction } from '../entities/wager-transaction.entity.ts';
import { WalletLedgerEntry } from '../entities/wallet-ledger-entry.entity.ts';
import { Money } from '../value-objects/money.ts';
import { FailureCode } from '../enums/failure-code.enum.ts';
import { TransactionKind } from '../enums/transaction.enums.ts';
import { DomainException } from '../exceptions/domain.exception.ts';

describe('WagerService', () => {
  let service: WagerService;
  let emMock: any;
  let forkEmMock: any;

  const mockWallet = {
    id: 'wallet-123',
    playerId: 'player-1',
    balance: Money.from({ amount: '100.00', currency: 'BRL' }),
  };

  beforeEach(async () => {
    forkEmMock = {
      transactional: jest.fn(async (cb: (em: any) => any) => cb(forkEmMock)),
      findOne: jest.fn(),
      persist: jest.fn(),
    };

    emMock = {
      fork: jest.fn().mockReturnValue(forkEmMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WagerService,
        { provide: EntityManager, useValue: emMock },
      ],
    }).compile();

    service = module.get<WagerService>(WagerService);
  });

  describe('processBet', () => {
    it('deve debitar o saldo e registrar a transação com sucesso', async () => {
      forkEmMock.findOne.mockImplementation((entity: any) => {
        if (entity === Wallet) return Promise.resolve({ ...mockWallet });
        return Promise.resolve(null);
      });

      await service.processBet(
        'player-1',
        'wallet-123',
        'idemp-1',
        'hash-1',
        '30.00',
        'BRL',
      );

      expect(forkEmMock.persist).toHaveBeenCalled();
    });

    it('deve lançar erro INSUFFICIENT_FUNDS se o saldo for menor que a aposta', async () => {
      forkEmMock.findOne.mockImplementation((entity: any) => {
        if (entity === Wallet) {
          return Promise.resolve({
            ...mockWallet,
            balance: Money.from({ amount: '10.00', currency: 'BRL' }),
          });
        }
        return Promise.resolve(null);
      });

      await expect(
        service.processBet(
          'player-1',
          'wallet-123',
          'idemp-2',
          'hash-2',
          '50.00',
          'BRL',
        ),
      ).rejects.toThrow(DomainException);
    });
  });

  describe('processRefund (Fora de Ordem)', () => {
    it('deve registrar como PENDING_REFERENCE se a aposta original ainda não existir', async () => {
      forkEmMock.findOne.mockResolvedValue(null); // Transação original não encontrada

      await service.processRefund(
        'original-tx-999',
        'idemp-3',
        'hash-3',
        '30.00',
        'BRL',
      );

      expect(forkEmMock.persist).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PENDING_REFERENCE',
          referenceTransactionId: 'original-tx-999',
        }),
      );
    });
  });
});
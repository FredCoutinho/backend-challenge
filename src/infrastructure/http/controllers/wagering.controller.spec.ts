import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WageringController } from './wagering.controller.ts';
import { WagerService } from '../../../domain/services/wager.service.ts';
import { TransactionKind } from '../../../domain/enums/transaction.enums.ts';

describe('WageringController', () => {
  let controller: WageringController;
  let wagerServiceMock: any;

  beforeEach(async () => {
    wagerServiceMock = {
      processBet: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      processRefund: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WageringController],
      providers: [
        {
          provide: WagerService,
          useValue: wagerServiceMock,
        },
      ],
    }).compile();

    controller = module.get<WageringController>(WageringController);
  });

  describe('POST /wagering/transactions', () => {
    it('deve lançar BadRequestException se o header idempotency-key estiver ausente', async () => {
      const dto = {
        kind: TransactionKind.BET,
        playerId: 'player-1',
        walletId: 'wallet-123',
        amount: '10.00',
        currency: 'BRL',
      };

      await expect(
        controller.handleTransaction('', dto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve chamar processBet quando o tipo de transação for BET', async () => {
      const dto = {
        kind: TransactionKind.BET,
        playerId: 'player-1',
        walletId: 'wallet-123',
        amount: '25.00',
        currency: 'BRL',
      };

      const result = await controller.handleTransaction('idemp-key-1', dto as any);

      expect(result).toEqual({ status: 'SUCCESS' });
      expect(wagerServiceMock.processBet).toHaveBeenCalledWith(
        'player-1',
        'wallet-123',
        'idemp-key-1',
        expect.any(String), // payloadHash calculado
        '25.00',
        'BRL',
      );
    });

    it('deve lançar BadRequestException se REFUND for enviado sem referenceTransactionId', async () => {
      const dto = {
        kind: TransactionKind.REFUND,
        playerId: 'player-1',
        walletId: 'wallet-123',
        amount: '25.00',
        currency: 'BRL',
      };

      await expect(
        controller.handleTransaction('idemp-key-2', dto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve chamar processRefund quando REFUND possuir referenceTransactionId', async () => {
      const dto = {
        kind: TransactionKind.REFUND,
        playerId: 'player-1',
        walletId: 'wallet-123',
        amount: '25.00',
        currency: 'BRL',
        referenceTransactionId: 'tx-bet-original-123',
      };

      const result = await controller.handleTransaction('idemp-key-3', dto as any);

      expect(result).toEqual({ status: 'SUCCESS' });
      expect(wagerServiceMock.processRefund).toHaveBeenCalledWith(
        'tx-bet-original-123',
        'idemp-key-3',
        expect.any(String),
        '25.00',
        'BRL',
      );
    });
  });
});
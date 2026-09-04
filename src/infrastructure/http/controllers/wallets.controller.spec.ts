import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WalletsController } from './wallets.controller.ts';
import { WalletService } from '../../../domain/services/wallet.service.ts';

describe('WalletsController', () => {
  let controller: WalletsController;
  let walletServiceMock: any;

  beforeEach(async () => {
    walletServiceMock = {
      getWalletById: jest.fn(),
      getLedger: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [
        {
          provide: WalletService,
          useValue: walletServiceMock,
        },
      ],
    }).compile();

    controller = module.get<WalletsController>(WalletsController);
  });

  describe('GET /wallets/:id', () => {
    it('deve retornar os dados da carteira com sucesso', async () => {
      const mockWallet = {
        id: 'wallet-1',
        playerId: 'player-1',
        balance: '100.00',
        currency: 'BRL',
      };
      walletServiceMock.getWalletById.mockResolvedValue(mockWallet);

      const result = await controller.getWallet('wallet-1');

      expect(result).toEqual(mockWallet);
      expect(walletServiceMock.getWalletById).toHaveBeenCalledWith('wallet-1');
    });

    it('deve repassar NotFoundException caso a carteira não exista', async () => {
      walletServiceMock.getWalletById.mockRejectedValue(
        new NotFoundException('Carteira com ID \'invalid\' não encontrada.'),
      );

      await expect(controller.getWallet('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('GET /wallets/:id/ledger', () => {
    it('deve retornar o histórico paginado com os parâmetros padrão', async () => {
      const mockLedger = {
        data: [],
        hasMore: false,
        nextCursor: null,
      };
      walletServiceMock.getLedger.mockResolvedValue(mockLedger);

      const result = await controller.getLedger('wallet-1', {});

      expect(result).toEqual(mockLedger);
      expect(walletServiceMock.getLedger).toHaveBeenCalledWith(
        'wallet-1',
        undefined,
        undefined,
      );
    });

    it('deve repassar os parâmetros de limit e starting_after para o serviço', async () => {
      const query = { limit: 5, starting_after: 'tx-123' };
      walletServiceMock.getLedger.mockResolvedValue({ data: [], hasMore: false, nextCursor: null });

      await controller.getLedger('wallet-1', query);

      expect(walletServiceMock.getLedger).toHaveBeenCalledWith(
        'wallet-1',
        5,
        'tx-123',
      );
    });
  });

  describe('POST /wallets/:id/reconciliation', () => {
    it('deve retornar resultado MATCH quando os saldos baterem', async () => {
      const mockResult = {
        walletId: 'wallet-1',
        status: 'MATCH',
        storedBalance: '100.00',
        expectedBalance: '100.00',
        discrepancy: '0.00',
        currency: 'BRL',
        reconciledAt: new Date(),
      };
      walletServiceMock.reconcile = jest
        .fn<() => Promise<typeof mockResult>>()
        .mockResolvedValue(mockResult);

      const dto = { expectedBalance: '100.00', currency: 'BRL' };
      const result = await controller.reconcile('wallet-1', dto);

      expect(result).toEqual(mockResult);
      expect(walletServiceMock.reconcile).toHaveBeenCalledWith('wallet-1', '100.00', 'BRL');
    });

    it('deve retornar resultado DISCREPANCY quando houver divergência no saldo', async () => {
    const mockResult = {
      walletId: 'wallet-1',
      status: 'DISCREPANCY',
      storedBalance: '100.00',
      expectedBalance: '80.00',
      discrepancy: '20.00',
      currency: 'BRL',
      reconciledAt: new Date(),
    };
    walletServiceMock.reconcile = jest
      .fn<() => Promise<typeof mockResult>>()
      .mockResolvedValue(mockResult);

    const dto = { expectedBalance: '80.00', currency: 'BRL' };
    const result = await controller.reconcile('wallet-1', dto);

    expect(result.status).toBe('DISCREPANCY');
    expect(result.discrepancy).toBe('20.00');
    });       
  });
});
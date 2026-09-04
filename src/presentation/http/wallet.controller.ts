import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateWalletUseCase } from '../../application/use-cases/wallet/create-wallet.use-case.ts';
import { PlaceWagerUseCase } from '../../application/use-cases/wallet/place-wager.use-case.ts';
import { DepositUseCase } from '../../application/use-cases/wallet/deposit.use-case.ts';
import { ReconcileWalletDto } from '../../infrastructure/http/dtos/reconcile-wallet.dto.ts';
import { WalletService } from '../../domain/services/wallet.service.ts';

class CreateWalletDto {
  playerId!: string;
  currency!: string;
  initialBalance?: number | string;
}

class PlaceWagerDto {
  amount!: number | string;
  currency!: string;
  externalTransactionId!: string;
}

class DepositDto {
  amount!: number | string;
  currency!: string;
  externalTransactionId!: string;
  type?: 'DEPOSIT' | 'WIN';
}

@Controller('wallets')
export class WalletController {
  constructor(
    private readonly createWalletUseCase: CreateWalletUseCase,
    private readonly placeWagerUseCase: PlaceWagerUseCase,
    private readonly depositUseCase: DepositUseCase,
    private readonly walletService: WalletService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateWalletDto) {
    const wallet = await this.createWalletUseCase.execute({
      playerId: dto.playerId,
      currency: dto.currency,
      initialBalance: dto.initialBalance,
    });

    return {
      id: wallet.id,
      playerId: wallet.playerId,
      currency: wallet.currency,
      balance: wallet.balance.valueOf(), 
      version: wallet.version,
      createdAt: wallet.createdAt,
    };
  }

  @Post(':id/wager')
  @HttpCode(HttpStatus.OK)
  async placeWager(
    @Param('id') walletId: string,
    @Body() dto: PlaceWagerDto,
  ) {
    await this.placeWagerUseCase.execute({
      walletId,
      amount: dto.amount,
      currency: dto.currency,
      externalTransactionId: dto.externalTransactionId,
    });

    return { message: 'Aposta processada com sucesso.' };
  }

  @Post(':id/deposit')
  @HttpCode(HttpStatus.OK)
  async deposit(
    @Param('id') walletId: string,
    @Body() dto: DepositDto,
  ) {
    await this.depositUseCase.execute({
      walletId,
      amount: dto.amount,
      currency: dto.currency,
      externalTransactionId: dto.externalTransactionId,
      type: dto.type,
    });

    return { message: 'Crédito processado com sucesso.' };
  }

  @Post(':id/reconciliation')
  async reconcile(
    @Param('id') id: string,
    @Body() dto: ReconcileWalletDto,
  ) {
    return this.walletService.reconcile(id, dto.expectedBalance, dto.currency);
  }
}
import { Module } from '@nestjs/common';
import { DatabaseModule } from './shared/infra/database/database.module.ts';
import { WalletController } from './presentation/http/wallet.controller.ts';
import { CreateWalletUseCase } from './application/use-cases/wallet/create-wallet.use-case.ts';
import { WalletRepository } from './shared/infra/database/repositories/wallet.repository.ts';
import { PlaceWagerUseCase } from './application/use-cases/wallet/place-wager.use-case.ts';
import { DepositUseCase } from './application/use-cases/wallet/deposit.use-case.ts';
import { OutboxRepository } from './shared/infra/database/repositories/outbox.repository.ts';

@Module({
  imports: [DatabaseModule],
  controllers: [WalletController],
  providers: [
    CreateWalletUseCase,
    WalletRepository,
    PlaceWagerUseCase,
    DepositUseCase,
    OutboxRepository,
  ],
})
export class WalletModule {}
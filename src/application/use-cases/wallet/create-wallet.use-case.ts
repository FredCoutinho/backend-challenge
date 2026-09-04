import { Injectable } from '@nestjs/common';
import { Wallet } from '../../../domain/wallet/wallet.ts';
import { Money } from '../../../domain/value-objects/money.ts';
import { WalletRepository } from '../../../shared/infra/database/repositories/wallet.repository.ts';
import { randomUUID } from 'crypto';

export interface CreateWalletCommand {
  playerId: string;
  currency: string;
  initialBalance?: number | string;
}

@Injectable()
export class CreateWalletUseCase {
  constructor(private readonly walletRepository: WalletRepository) {}

  async execute(command: CreateWalletCommand): Promise<Wallet> {
    const walletId = randomUUID();
    const initialAmount = command.initialBalance ?? '0.00';
    
    // Utiliza o método de fábrica do Value Object Money conforme a modelagem
    const initialMoney = Money.from({
      amount: String(initialAmount),
      currency: command.currency,
    });

    const wallet = Wallet.open({
      id: walletId,
      playerId: command.playerId,
      initialBalance: initialMoney,
    });

    await this.walletRepository.save(wallet);

    return wallet;
  }
}
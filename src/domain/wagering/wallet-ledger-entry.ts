import { Money, MoneyProps } from '../value-objects/money.ts';

export enum LedgerDirection {
  Debit = 'DEBIT',
  Credit = 'CREDIT',
}

export interface WalletLedgerEntryProps {
  id: string;
  walletId: string;
  transactionId: string;
  direction: LedgerDirection;
  money: MoneyProps;
  balanceBefore: MoneyProps;
  balanceAfter: MoneyProps;
  createdAt: Date;
}

export class WalletLedgerEntry {
  private constructor(
    public readonly id: string,
    public readonly walletId: string,
    public readonly transactionId: string,
    public readonly direction: LedgerDirection,
    public readonly money: Money,
    public readonly balanceBefore: Money,
    public readonly balanceAfter: Money,
    public readonly createdAt: Date,
  ) {}

  public static create(props: {
    id: string;
    walletId: string;
    transactionId: string;
    direction: LedgerDirection;
    money: Money;
    balanceBefore: Money;
    balanceAfter: Money;
  }): WalletLedgerEntry {
    // Validação matemática contábil na criação
    const expectedBalance =
      props.direction === LedgerDirection.Credit
        ? props.balanceBefore.add(props.money)
        : props.balanceBefore.subtract(props.money);

    if (!expectedBalance.equals(props.balanceAfter)) {
      throw new Error('Inconsistência matemática no ledger: o saldo final não confere com a operação.');
    }

    return new WalletLedgerEntry(
      props.id,
      props.walletId,
      props.transactionId,
      props.direction,
      props.money,
      props.balanceBefore,
      props.balanceAfter,
      new Date(),
    );
  }

  public static rehydrate(state: WalletLedgerEntryProps): WalletLedgerEntry {
    return new WalletLedgerEntry(
      state.id,
      state.walletId,
      state.transactionId,
      state.direction,
      Money.from(state.money),
      Money.from(state.balanceBefore),
      Money.from(state.balanceAfter),
      state.createdAt,
    );
  }
}
import { Money, MoneyProps } from '../value-objects/money.ts';

// Estado bruto usado para reidratar a carteira do banco de dados
export interface WalletState {
  id: string;
  playerId: string;
  currency: string;
  balance: MoneyProps;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Wallet {
  private constructor(
    public readonly id: string,
    public readonly playerId: string,
    public readonly currency: string,
    private _balance: Money,
    private _version: number,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  // 1. Fábrica para abrir uma nova carteira
  public static open(props: {
    id: string;
    playerId: string;
    initialBalance: Money;
  }): Wallet {
    return new Wallet(
      props.id,
      props.playerId,
      props.initialBalance.currency,
      props.initialBalance,
      1, // Versão inicial começa em 1
      new Date(),
      new Date(),
    );
  }

  // 2. Fábrica para reconstruir a carteira a partir do que está salvo no banco
  // (Não revalida regras de transição, apenas traz o estado salvo)
  public static rehydrate(state: WalletState): Wallet {
    const money = Money.from(state.balance);
    return new Wallet(
      state.id,
      state.playerId,
      state.currency,
      money,
      state.version,
      state.createdAt,
      state.updatedAt,
    );
  }

  // Getters públicos para leitura segura do estado
  public get balance(): Money {
    return this._balance;
  }

  public get version(): number {
    return this._version;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // --- REGRAS DE MOVIMENTAÇÃO DE SALDO ---

  public credit(amount: Money): void {
    this.assertSameCurrency(amount);
    
    // Aplica a operação matemática imutável do Money
    this._balance = this._balance.add(amount);
    this.incrementVersionAndTouch();
  }

  public debit(amount: Money): void {
    this.assertSameCurrency(amount);

    // Invariante global: O sistema não pode permitir saldo negativo
    const remainingBalance = this._balance.subtract(amount);
    if (remainingBalance.isNegative()) {
      throw new Error('Saldo insuficiente para realizar a operação.');
    }

    this._balance = remainingBalance;
    this.incrementVersionAndTouch();
  }

  // --- AUXILIARES INTERNOS ---

  private assertSameCurrency(money: Money): void {
    if (this.currency !== money.currency) {
      throw new Error(
        `Moeda da operação (${money.currency}) incompatível com a carteira (${this.currency})`,
      );
    }
  }

  private incrementVersionAndTouch(): void {
    this._version += 1; // Incrementa a versão para o Optimistic Locking do banco
    this._updatedAt = new Date();
  }
}
import { Decimal } from 'decimal.js';

// Define o formato esperado para entrar e sair da nossa classe
export interface MoneyProps {
  amount: string;   
  currency: string; 
}

export class Money {
  // Construtor privado: ninguém pode fazer "new Money()". 
  // Eles precisam usar as Factories abaixo.
  private constructor(
    public readonly value: Decimal,
    public readonly currency: string,
  ) {}

  public get amount(): string {
    return this.value.toFixed(2);
  }

  // --- FACTORIES (Fábricas de instâncias) ---

  public static create(amount: string, currency: string = 'BRL'): Money {
    return Money.from({ amount, currency });
  }

  public static from(props: MoneyProps): Money {
    // 1. Validações de segurança e entrada
    if (!props.amount || props.amount.trim() === '') {
      throw new Error('O valor (amount) não pode ser vazio.');
    }
    
    // O Decimal.js cuida de validar NaN, Infinity, etc.
    const decimalValue = new Decimal(props.amount);

    if (decimalValue.decimalPlaces() > 2 || decimalValue.isNegative()) {
      throw new Error('O valor não pode ter mais de 2 casas decimais ou ser negativo.');
    }

    // Força para ter sempre 2 casas decimais na representação
    const fixedValue = decimalValue.toDecimalPlaces(2);

    return new Money(fixedValue, props.currency.toUpperCase());
  }

  public static zero(currency: string = 'BRL'): Money {
    return new Money(new Decimal('0.00'), currency.toUpperCase());
  }

  // --- OPERAÇÕES MATEMÁTICAS ---
  // De acordo com a regra de imutabilidade elas sempre retornam um "novo" Money.

  public add(other: Money): Money {
    this.assertSameCurrency(other);
    const newValue = this.value.plus(other.value).toDecimalPlaces(2);
    return new Money(newValue.toDecimalPlaces(2), this.currency.toUpperCase());
  }

  public subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const newValue = this.value.minus(other.value).toDecimalPlaces(2);
    return new Money(newValue.toDecimalPlaces(2), this.currency.toUpperCase());
  }

  public negate(): Money {
    return new Money(this.value.negated().toDecimalPlaces(2), this.currency.toUpperCase());
  }

  // --- COMPARAÇÕES ---

  public isZero(): boolean {
    return this.value.isZero();
  }

  public isPositive(): boolean {
    return this.value.isPositive() && !this.value.isZero();
  }

  public isNegative(): boolean {
    return this.value.isNegative();
  }

  public isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.value.lessThan(other.value);
  }

  public isLessThanOrEqualTo(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.value.lessThanOrEqualTo(other.value);
  }

  public isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.value.greaterThan(other.value);
  }

  public isGreaterThanOrEqualTo(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.value.greaterThanOrEqualTo(other.value);
  }

  public equals(other: Money): boolean {
    if (this.currency !== other.currency) return false;
    return this.value.equals(other.value);
  }

  // --- FORMATAÇÃO E EXPORTAÇÃO ---

  public toJSON(): MoneyProps {
    return {
      amount: this.value.toFixed(2), // Garante que sai como "25.00"
      currency: this.currency.toUpperCase(),
    };
  }

  public toString(): string {
    return `${this.currency} ${this.value.toFixed(2)}`;
  }

  // --- VALIDAÇÕES INTERNAS ---

  private assertSameCurrency(other: Money): void {
    if (this.currency.toUpperCase() !== other.currency.toUpperCase()) {
      throw new Error(`Moedas incompatíveis: ${this.currency.toUpperCase()} e ${other.currency.toUpperCase()}`);
    }
  }
}
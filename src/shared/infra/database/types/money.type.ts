import { Type } from '@mikro-orm/core';
import { Money } from '../../../../domain/value-objects/money.ts'; 

export class MoneyType extends Type<Money | undefined, string | null> {

  convertToDatabaseValue(value: Money | undefined): string | null {
    if (!value) {
      return null;
    }
    // Salva no banco como um JSON stringificado contendo amount e currency
    return JSON.stringify({
      amount: value.value.toString(),
      currency: value.currency,
    });
  }

  convertToJSValue(value: string | object | null): Money | undefined {
    if (!value) {
      return undefined;
    }

    // Se o driver já retornar como objeto JSON ou string, normalizamos
    const data = typeof value === 'string' ? JSON.parse(value) : value;

    if (!data || typeof data.amount !== 'string' || typeof data.currency !== 'string') {
      return undefined;
    }

    // Reconstrói a instância do seu Value Object usando o método de fábrica ou construtor oficial
    return Money.from({
      amount: data.amount,
      currency: data.currency,
    });
  }

  getColumnType(): string {
    return 'jsonb'; // Utiliza o tipo nativo JSONB do PostgreSQL para alta performance e segurança
  }
}
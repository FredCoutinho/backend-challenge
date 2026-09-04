import { describe, it, expect } from '@jest/globals';
import { Money, MoneyProps } from './money.ts';

describe('Money Value Object', () => {
  describe('Criação e Validação', () => {
    it('deve criar uma instância válida de Money', () => {
      const money = Money.from({ amount: '100.50', currency: 'BRL' });
      expect(money.amount).toBe('100.50');
      expect(money.currency).toBe('BRL');
    });

    it('deve formatar valores inteiros com duas casas decimais', () => {
      const money = Money.from({ amount: '100', currency: 'USD' });
      expect(money.amount).toBe('100.00');
    });

    it('deve lançar erro ao tentar criar Money com valor inválido', () => {
      expect(() => Money.from({ amount: 'invalido', currency: 'BRL' })).toThrow();
      expect(() => Money.from({ amount: '-10.00', currency: 'BRL' })).toThrow();
    });

    it('deve converter a moeda para maiúsculas automaticamente', () => {
      const money = Money.from({ amount: '50.00', currency: 'brl' });
      expect(money.currency).toBe('BRL');
    });
  });

  describe('Aritmética Decimal Exata', () => {
    it('deve somar dois valores com a mesma moeda corretamente', () => {
      const m1 = Money.from({ amount: '10.25', currency: 'BRL' });
      const m2 = Money.from({ amount: '5.75', currency: 'BRL' });
      const result = m1.add(m2);

      expect(result.amount).toBe('16.00');
      expect(result.currency).toBe('BRL');
    });

    it('deve subtrair dois valores com a mesma moeda corretamente', () => {
      const m1 = Money.from({ amount: '20.00', currency: 'USD' });
      const m2 = Money.from({ amount: '7.30', currency: 'USD' });
      const result = m1.subtract(m2);

      expect(result.amount).toBe('12.70');
    });

    it('não deve causar erros de arredondamento de ponto flutuante (ex: 0.1 + 0.2)', () => {
      const m1 = Money.from({ amount: '0.10', currency: 'EUR' });
      const m2 = Money.from({ amount: '0.20', currency: 'EUR' });
      const result = m1.add(m2);

      expect(result.amount).toBe('0.30');
    });

    it('deve lançar erro ao tentar somar moedas diferentes', () => {
      const brl = Money.from({ amount: '10.00', currency: 'BRL' });
      const usd = Money.from({ amount: '10.00', currency: 'USD' });

      expect(() => brl.add(usd)).toThrow('Moedas incompatíveis: ' + brl.currency.toUpperCase() + ' e ' + usd.currency.toUpperCase());
    });

    it('deve lançar erro ao tentar subtrair moedas diferentes', () => {
      const brl = Money.from({ amount: '10.00', currency: 'BRL' });
      const usd = Money.from({ amount: '10.00', currency: 'USD' });

      expect(() => brl.subtract(usd)).toThrow('Moedas incompatíveis: ' + brl.currency.toUpperCase() + ' e ' + usd.currency.toUpperCase());
    });
  });

  describe('Comparações e Invariantes', () => {
    it('deve comparar igualdade de valores corretamente', () => {
      const m1 = Money.from({ amount: '100.00', currency: 'BRL' });
      const m2 = Money.from({ amount: '100.00', currency: 'BRL' });
      const m3 = Money.from({ amount: '50.00', currency: 'BRL' });

      expect(m1.equals(m2)).toBe(true);
      expect(m1.equals(m3)).toBe(false);
    });

    it('deve verificar se um valor é maior ou igual a outro', () => {
      const m100 = Money.from({ amount: '100.00', currency: 'BRL' });
      const m50 = Money.from({ amount: '50.00', currency: 'BRL' });

      expect(m100.isGreaterThanOrEqualTo(m50)).toBe(true);
      expect(m100.isGreaterThanOrEqualTo(m100)).toBe(true);
      expect(m50.isGreaterThanOrEqualTo(m100)).toBe(false);
    });

    it('deve verificar se o saldo é zero', () => {
      const zero = Money.from({ amount: '0.00', currency: 'BRL' });
      const positive = Money.from({ amount: '0.01', currency: 'BRL' });

      expect(zero.isZero()).toBe(true);
      expect(positive.isZero()).toBe(false);
    });
  });
});
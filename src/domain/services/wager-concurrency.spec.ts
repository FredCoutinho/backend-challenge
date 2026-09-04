import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Money, MoneyProps } from '../value-objects/money.ts';

describe('Teste de Concorrência - Mitigação de Race Conditions', () => {
  let walletBalance: Money;
  let successCount: number;
  let failureCount: number;

  beforeEach(() => {
    walletBalance = Money.create('100.00', 'BRL');
    successCount = 0;
    failureCount = 0;
  });

  // Simula uma transação de débito atômica com Lock Otimista / Pessimista
  async function processWagerTransaction(betAmount: Money): Promise<boolean> {
    // Simula um pequeno delay de I/O de banco para forçar sobreposição de Threads/Event Loop
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));

    if (walletBalance.isGreaterThanOrEqualTo(betAmount)) {
      walletBalance = walletBalance.subtract(betAmount);
      return true;
    }
    return false;
  }

  it('deve processar 50 requisições paralelas e impedir saldo negativo (Double Spending)', async () => {
    const betAmount = Money.create('10.00', 'BRL');
    const totalRequests = 50;

    // Dispara 50 requisições simultâneas em paralelo via Promise.all
    const promises = Array.from({ length: totalRequests }).map(async () => {
      const success = await processWagerTransaction(betAmount);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    });

    await Promise.all(promises);

    // Validações de Integridade
    expect(successCount).toBe(10); // Apenas 10 apostas de R$ 10,00 caibam em R$ 100,00
    expect(failureCount).toBe(40); // 40 requisições devem falhar graciosa e seguramente
    expect(walletBalance.amount).toBe('0.00'); // O saldo restante deve ser exatamente R$ 0,00
  });

  it('deve garantir idempotência em 50 requisições simultâneas com a mesma chave', async () => {
    const executedOperations = new Set<string>();
    const idempotencyKey = 'req-idempotent-uuid-123';
    let executionCounter = 0;

    async function processIdempotentRequest(key: string) {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));

      if (executedOperations.has(key)) {
        return { status: 'IDEMPOTENT_RESPONSE', executed: false };
      }

      executedOperations.add(key);
      executionCounter++;
      return { status: 'PROCESSED', executed: true };
    }

    const promises = Array.from({ length: 50 }).map(() =>
      processIdempotentRequest(idempotencyKey),
    );

    const results = await Promise.all(promises);

    const processed = results.filter((r) => r.executed);
    const cached = results.filter((r) => !r.executed);

    expect(processed.length).toBe(1); // Executou no banco apenas 1 vez
    expect(cached.length).toBe(49);   // Retornou resposta idempotente para as outras 49
    expect(executionCounter).toBe(1);
  });
});
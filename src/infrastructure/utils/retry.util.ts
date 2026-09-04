import { OptimisticLockError } from '@mikro-orm/core';

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 50,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && (error instanceof OptimisticLockError || isSerializationFailure(error))) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return withRetry(fn, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

function isSerializationFailure(error: any): boolean {
  // Código SQLState 40001 é Serialization Failure no Postgres
  return error?.code === '40001' || error?.sqlState === '40001';
}
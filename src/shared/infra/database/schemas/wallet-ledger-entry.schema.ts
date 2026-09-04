import { EntitySchema } from '@mikro-orm/core';

export const WalletLedgerEntrySchema = new EntitySchema({
  name: 'WalletLedgerEntry',
  tableName: 'wallet_ledger_entries',
  properties: {
    id: { type: 'string', primary: true, length: 36 },
    walletId: { type: 'string', length: 36, fieldName: 'wallet_id' },
    transactionId: { type: 'string', length: 36, fieldName: 'transaction_id' },
    direction: { type: 'string', length: 10 },
    money: { type: 'decimal', precision: 19, scale: 4 },
    balanceBefore: { type: 'decimal', precision: 19, scale: 4, fieldName: 'balance_before' },
    balanceAfter: { type: 'decimal', precision: 19, scale: 4, fieldName: 'balance_after' },
    createdAt: { type: 'date', fieldName: 'created_at' },
  },
});
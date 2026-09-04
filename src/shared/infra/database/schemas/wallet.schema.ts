import { EntitySchema } from '@mikro-orm/core';

export const WalletSchema = new EntitySchema({
  name: 'Wallet',
  tableName: 'wallets',
  properties: {
    id: { type: 'string', primary: true, length: 36 },
    playerId: { type: 'string', length: 36, fieldName: 'player_id' },
    currency: { type: 'string', length: 3 },
    balance: { type: 'decimal', precision: 19, scale: 4 },
    version: { type: 'number', version: true },
    createdAt: { type: 'date', fieldName: 'created_at' },
    updatedAt: { type: 'date', fieldName: 'updated_at' },
  },
});
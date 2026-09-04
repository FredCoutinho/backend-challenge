import { EntitySchema } from '@mikro-orm/core';

export const WagerTransactionSchema = new EntitySchema({
  name: 'WagerTransaction',
  tableName: 'wager_transactions',
  properties: {
    id: { type: 'string', primary: true, length: 36 },
    providerId: { type: 'string', length: 50, fieldName: 'provider_id' },
    externalTransactionId: { type: 'string', length: 100, fieldName: 'external_transaction_id' },
    idempotencyKey: { type: 'string', length: 150, unique: true, fieldName: 'idempotency_key' },
    payloadHash: { type: 'string', length: 64, fieldName: 'payload_hash' },
    walletId: { type: 'string', length: 36, fieldName: 'wallet_id' },
    playerId: { type: 'string', length: 36, fieldName: 'player_id' },
    roundId: { type: 'string', length: 100, fieldName: 'round_id' },
    gameId: { type: 'string', length: 100, fieldName: 'game_id' },
    kind: { type: 'string', length: 30 },
    money: { type: 'decimal', precision: 19, scale: 4 },
    referenceExternalTransactionId: { type: 'string', length: 100, nullable: true, fieldName: 'reference_external_transaction_id' },
    createdAt: { type: 'date', fieldName: 'created_at' },
    status: { type: 'string', length: 30, fieldName: 'status' },
    referenceTransactionId: { type: 'string', length: 36, nullable: true, fieldName: 'reference_transaction_id' },
    failureCode: { type: 'string', length: 50, nullable: true, fieldName: 'failure_code' },
    processedAt: { type: 'date', nullable: true, fieldName: 'processed_at' },
  },
});
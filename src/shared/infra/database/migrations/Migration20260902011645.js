import { Migration } from '@mikro-orm/migrations';

export class Migration20260902011645 extends Migration {
  async up() {
    this.addSql(`
      CREATE TABLE "wallets" (
        "id" VARCHAR(36) NOT NULL,
        "player_id" VARCHAR(36) NOT NULL,
        "currency" VARCHAR(3) NOT NULL,
        "balance" NUMERIC(19, 4) NOT NULL,
        "version" INT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL,
        "updated_at" TIMESTAMPTZ NOT NULL,
        CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE "wager_transactions" (
        "id" VARCHAR(36) NOT NULL,
        "provider_id" VARCHAR(50) NOT NULL,
        "external_transaction_id" VARCHAR(100) NOT NULL,
        "idempotency_key" VARCHAR(150) NOT NULL,
        "payload_hash" VARCHAR(64) NOT NULL,
        "wallet_id" VARCHAR(36) NOT NULL,
        "player_id" VARCHAR(36) NOT NULL,
        "round_id" VARCHAR(100) NOT NULL,
        "game_id" VARCHAR(100) NOT NULL,
        "kind" VARCHAR(30) NOT NULL,
        "money" NUMERIC(19, 4) NOT NULL,
        "reference_external_transaction_id" VARCHAR(100) NULL,
        "created_at" TIMESTAMPTZ NOT NULL,
        "status" VARCHAR(30) NOT NULL,
        "reference_transaction_id" VARCHAR(36) NULL,
        "failure_code" VARCHAR(50) NULL,
        "processed_at" TIMESTAMPTZ NULL,
        CONSTRAINT "wager_transactions_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "wager_transactions_idempotency_key_unique" UNIQUE ("idempotency_key")
      );

      CREATE TABLE "wallet_ledger_entries" (
        "id" VARCHAR(36) NOT NULL,
        "wallet_id" VARCHAR(36) NOT NULL,
        "transaction_id" VARCHAR(36) NOT NULL,
        "direction" VARCHAR(10) NOT NULL,
        "money" NUMERIC(19, 4) NOT NULL,
        "balance_before" NUMERIC(19, 4) NOT NULL,
        "balance_after" NUMERIC(19, 4) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL,
        CONSTRAINT "wallet_ledger_entries_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE "inbox_messages" (
        "id" VARCHAR(36) NOT NULL,
        "message_id" VARCHAR(150) NOT NULL,
        "payload_hash" VARCHAR(64) NOT NULL,
        "status" VARCHAR(20) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL,
        "processed_at" TIMESTAMPTZ NULL,
        CONSTRAINT "inbox_messages_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "inbox_messages_message_id_unique" UNIQUE ("message_id")
      );

      CREATE TABLE "outbox_messages" (
        "id" VARCHAR(36) NOT NULL,
        "aggregate_id" VARCHAR(36) NOT NULL,
        "event_type" VARCHAR(100) NOT NULL,
        "payload" JSONB NOT NULL,
        "status" VARCHAR(20) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL,
        "published_at" TIMESTAMPTZ NULL,
        CONSTRAINT "outbox_messages_pkey" PRIMARY KEY ("id")
      );
    `);
  }

  async down() {
    this.addSql(`
      DROP TABLE IF EXISTS "outbox_messages";
      DROP TABLE IF EXISTS "inbox_messages";
      DROP TABLE IF EXISTS "wallet_ledger_entries";
      DROP TABLE IF EXISTS "wager_transactions";
      DROP TABLE IF EXISTS "wallets";
    `);
  }
}
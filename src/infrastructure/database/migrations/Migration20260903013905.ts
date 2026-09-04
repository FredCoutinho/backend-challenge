import { Migration } from '@mikro-orm/migrations';

export class Migration20260903013905 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "wager_transactions" add column "transaction_kind" smallint not null, add column "amount" numeric(15, 2) not null, add column "updated_at" timestamptz not null;`);
    this.addSql(`alter table "wager_transactions" alter column "id" drop default;`);
    this.addSql(`alter table "wager_transactions" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "wager_transactions" alter column "idempotency_key" type varchar(255) using ("idempotency_key"::varchar(255));`);
    this.addSql(`alter table "wager_transactions" alter column "wallet_id" type varchar(255) using ("wallet_id"::varchar(255));`);
    this.addSql(`alter table "wager_transactions" alter column "status" type varchar(50) using ("status"::varchar(50));`);
    this.addSql(`alter table "wager_transactions" alter column "status" set default 'PENDING';`);
    this.addSql(`alter table "wager_transactions" alter column "reference_transaction_id" type varchar(255) using ("reference_transaction_id"::varchar(255));`);
    this.addSql(`alter table "wager_transactions" alter column "failure_code" type varchar(100) using ("failure_code"::varchar(100));`);
    this.addSql(`create index "wager_transactions_idempotency_key_index" on "wager_transactions" ("idempotency_key");`);
    this.addSql(`create index "wager_transactions_wallet_id_index" on "wager_transactions" ("wallet_id");`);

    this.addSql(`alter table "wallets" alter column "id" drop default;`);
    this.addSql(`alter table "wallets" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "wallets" alter column "player_id" type varchar(255) using ("player_id"::varchar(255));`);
    this.addSql(`alter table "wallets" alter column "balance" type numeric(15, 2) using ("balance"::numeric(15, 2));`);
    this.addSql(`alter table "wallets" alter column "version" type int using ("version"::int);`);
    this.addSql(`alter table "wallets" alter column "version" set default 1;`);
    this.addSql(`alter table "wallets" add constraint "wallets_player_id_unique" unique ("player_id");`);

    this.addSql(`alter table "wallet_ledger_entries" add column "amount" numeric(15, 2) not null;`);
    this.addSql(`alter table "wallet_ledger_entries" alter column "id" drop default;`);
    this.addSql(`alter table "wallet_ledger_entries" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "wallet_ledger_entries" alter column "wallet_id" drop default;`);
    this.addSql(`alter table "wallet_ledger_entries" alter column "wallet_id" type uuid using ("wallet_id"::text::uuid);`);
    this.addSql(`alter table "wallet_ledger_entries" alter column "transaction_id" drop default;`);
    this.addSql(`alter table "wallet_ledger_entries" alter column "transaction_id" type uuid using ("transaction_id"::text::uuid);`);
    this.addSql(`alter table "wallet_ledger_entries" alter column "direction" type smallint using ("direction"::smallint);`);
    this.addSql(`alter table "wallet_ledger_entries" alter column "balance_before" type numeric(15, 2) using ("balance_before"::numeric(15, 2));`);
    this.addSql(`alter table "wallet_ledger_entries" alter column "balance_after" type numeric(15, 2) using ("balance_after"::numeric(15, 2));`);
    this.addSql(`alter table "wallet_ledger_entries" add constraint "wallet_ledger_entries_wallet_id_foreign" foreign key ("wallet_id") references "wallets" ("id") on update cascade;`);
    this.addSql(`alter table "wallet_ledger_entries" add constraint "wallet_ledger_entries_transaction_id_foreign" foreign key ("transaction_id") references "wager_transactions" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table "inbox_messages" ("id" varchar(36) not null, "message_id" varchar(150) not null, "payload_hash" varchar(64) not null, "status" varchar(20) not null, "created_at" timestamptz(6) not null, "processed_at" timestamptz(6) null, constraint "inbox_messages_pkey" primary key ("id"));`);
    this.addSql(`alter table "inbox_messages" add constraint "inbox_messages_message_id_unique" unique ("message_id");`);

    this.addSql(`create table "outbox_messages" ("id" varchar(36) not null, "aggregate_id" varchar(36) not null, "event_type" varchar(100) not null, "payload" jsonb not null, "status" varchar(20) not null, "created_at" timestamptz(6) not null, "published_at" timestamptz(6) null, constraint "outbox_messages_pkey" primary key ("id"));`);

    this.addSql(`alter table "wager_transactions" alter column "id" type text using ("id"::text);`);

    this.addSql(`alter table "wallet_ledger_entries" alter column "id" type text using ("id"::text);`);
    this.addSql(`alter table "wallet_ledger_entries" alter column "wallet_id" type text using ("wallet_id"::text);`);
    this.addSql(`alter table "wallet_ledger_entries" alter column "transaction_id" type text using ("transaction_id"::text);`);

    this.addSql(`alter table "wallet_ledger_entries" drop constraint "wallet_ledger_entries_wallet_id_foreign";`);
    this.addSql(`alter table "wallet_ledger_entries" drop constraint "wallet_ledger_entries_transaction_id_foreign";`);

    this.addSql(`alter table "wallets" alter column "id" type text using ("id"::text);`);

    this.addSql(`drop index "wager_transactions_idempotency_key_index";`);
    this.addSql(`drop index "wager_transactions_wallet_id_index";`);

    this.addSql(`alter table "wager_transactions" add column "provider_id" varchar(50) not null, add column "external_transaction_id" varchar(100) not null, add column "player_id" varchar(36) not null, add column "round_id" varchar(100) not null, add column "game_id" varchar(100) not null, add column "kind" varchar(30) not null, add column "money" numeric(19,4) not null, add column "reference_external_transaction_id" varchar(100) null, add column "processed_at" timestamptz(6) null;`);
    this.addSql(`alter table "wager_transactions" alter column "id" type varchar(36) using ("id"::varchar(36));`);
    this.addSql(`alter table "wager_transactions" alter column "idempotency_key" type varchar(150) using ("idempotency_key"::varchar(150));`);
    this.addSql(`alter table "wager_transactions" alter column "wallet_id" type varchar(36) using ("wallet_id"::varchar(36));`);
    this.addSql(`alter table "wager_transactions" alter column "status" drop default;`);
    this.addSql(`alter table "wager_transactions" alter column "status" type varchar(30) using ("status"::varchar(30));`);
    this.addSql(`alter table "wager_transactions" alter column "reference_transaction_id" type varchar(36) using ("reference_transaction_id"::varchar(36));`);
    this.addSql(`alter table "wager_transactions" alter column "failure_code" type varchar(50) using ("failure_code"::varchar(50));`);

    this.addSql(`alter table "wallet_ledger_entries" add column "money" numeric(19,4) not null;`);
    this.addSql(`alter table "wallet_ledger_entries" alter column "id" type varchar(36) using ("id"::varchar(36));`);
    this.addSql(`alter table "wallet_ledger_entries" alter column "wallet_id" type varchar(36) using ("wallet_id"::varchar(36));`);
    this.addSql(`alter table "wallet_ledger_entries" alter column "transaction_id" type varchar(36) using ("transaction_id"::varchar(36));`);
    this.addSql(`alter table "wallet_ledger_entries" alter column "balance_before" type numeric(19,4) using ("balance_before"::numeric(19,4));`);
    this.addSql(`alter table "wallet_ledger_entries" alter column "balance_after" type numeric(19,4) using ("balance_after"::numeric(19,4));`);
    this.addSql(`alter table "wallet_ledger_entries" alter column "direction" type varchar(10) using ("direction"::varchar(10));`);

    this.addSql(`alter table "wallets" drop constraint "wallets_player_id_unique";`);

    this.addSql(`alter table "wallets" add column "currency" varchar(3) not null;`);
    this.addSql(`alter table "wallets" alter column "id" type varchar(36) using ("id"::varchar(36));`);
    this.addSql(`alter table "wallets" alter column "player_id" type varchar(36) using ("player_id"::varchar(36));`);
    this.addSql(`alter table "wallets" alter column "balance" type numeric(19,4) using ("balance"::numeric(19,4));`);
    this.addSql(`alter table "wallets" alter column "version" drop default;`);
    this.addSql(`alter table "wallets" alter column "version" type int4 using ("version"::int4);`);
  }

}

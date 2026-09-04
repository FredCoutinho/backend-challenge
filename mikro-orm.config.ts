import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { Wallet } from '../backend-challenge/src/domain/entities/wallet.entity.ts';
import { WagerTransaction } from '../backend-challenge/src/domain/entities/wager-transaction.entity.ts';
import { WalletLedgerEntry } from './src/domain/entities/wallet-ledger-entry.entity.ts';

export default defineConfig({
  entities: [Wallet, WagerTransaction, WalletLedgerEntry,],
  dbName: process.env.DB_NAME || 'jungle_db',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '0122',
  extensions: [Migrator],
  migrations: {
    path: './src/infrastructure/database/migrations',
    pathTs: './src/infrastructure/database/migrations',
    glob: '!(*.d).{js,ts}',
    transactional: true,
    allOrNothing: true,
    dropTables: false,
    safe: true,
  },
});
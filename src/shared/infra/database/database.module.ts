import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import config from '../../../../mikro-orm.config.ts';
import { WalletSchema } from './schemas/wallet.schema.ts';
import { WagerTransactionSchema } from './schemas/wager-transaction.schema.ts';
import { WalletLedgerEntrySchema } from './schemas/wallet-ledger-entry.schema.ts';
import { InboxMessageSchema } from './schemas/inbox-message.schema.ts';
import { OutboxMessageSchema } from './schemas/outbox-message.schema.ts';

@Module({
  imports: [
    MikroOrmModule.forRoot(config),
    MikroOrmModule.forFeature([
      WalletSchema,
      WagerTransactionSchema,
      WalletLedgerEntrySchema,
      InboxMessageSchema,
      OutboxMessageSchema,
    ]),
  ],
  exports: [MikroOrmModule],
})
export class DatabaseModule {}
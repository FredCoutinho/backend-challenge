import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.ts';
import { OutboxProcessorService } from './outbox-processor.service.ts';
import { InboxRepository } from '../database/repositories/inbox.repository.ts';

@Module({
  imports: [DatabaseModule],
  providers: [OutboxProcessorService, InboxRepository],
  exports: [OutboxProcessorService, InboxRepository],
})
export class MessagingModule {}
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.ts';
import { SqsHealthIndicator } from './sqs-health.indicator.ts';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [SqsHealthIndicator],
})
export class HealthModule {}
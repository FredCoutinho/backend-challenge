import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MikroOrmHealthIndicator,
} from '@nestjs/terminus';
import { SqsHealthIndicator } from './sqs-health.indicator.ts';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: MikroOrmHealthIndicator,
    private readonly sqs: SqsHealthIndicator,
  ) {}

  // Liveness: Indica apenas se a aplicação web está de pé
  @Get('live')
  @HealthCheck()
  checkLiveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  // Readiness: Garante que as dependências essenciais (PostgreSQL e SQS) estão saudáveis
  @Get('ready')
  @HealthCheck()
  checkReadiness() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.sqs.isHealthy('sqs'),
    ]);
  }
}
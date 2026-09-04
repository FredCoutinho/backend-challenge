import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { OutboxMessageSchema } from '../database/schemas/outbox-message.schema.ts';

@Injectable()
export class OutboxProcessorService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private intervalId: NodeJS.Timeout | null = null;

  constructor(private readonly em: EntityManager) {}

  onApplicationBootstrap() {
    this.logger.log('[Outbox] Inicializando processador de mensageria em background...');
    
    // Processa a cada 5 segundos de forma segura
    this.intervalId = setInterval(async () => {
      await this.processOutboxMessages();
    }, 5000);
  }

  onApplicationShutdown() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async processOutboxMessages() {
    try {
      const forkEm = this.em.fork();
      const pendingMessages = await forkEm.find(
        OutboxMessageSchema,
        { status: 'PENDING' },
        { limit: 50 },
      );

      if (pendingMessages.length === 0) return;

      for (const message of pendingMessages) {
        try {
          this.logger.log(`[Outbox] Dispatches event: ${message.eventType} (ID: ${message.id})`);
          
          // Integração futura com o broker (Kafka/RabbitMQ) entra aqui

          message.status = 'PROCESSED';
          message.processedAt = new Date();
        } catch (error) {
          this.logger.error(`[Outbox] Falha ao despachar mensagem ${message.id}`, error);
          message.status = 'FAILED';
        }
      }

      await forkEm.flush();
    } catch (error) {
      this.logger.error('[Outbox] Erro no ciclo de varredura da outbox', error);
    }
  }
}
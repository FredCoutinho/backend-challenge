import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { WagerService } from '../../../domain/services/wager.service.ts';
import { CreateTransactionDto } from '../dtos/create-transaction.dto.ts';
import { TransactionKind } from '../../../domain/enums/transaction.enums.ts';

@Controller('wagering')
export class WageringController {
  constructor(private readonly wagerService: WagerService) {}

  @Post('transactions')
  @HttpCode(HttpStatus.OK)
  async handleTransaction(
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() dto: CreateTransactionDto,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException('Header Idempotency-Key é obrigatório.');
    }

    // Calcula o hash determinístico do payload recebido
    const payloadHash = createHash('sha256')
      .update(JSON.stringify(dto))
      .digest('hex');

    switch (dto.kind) {
      case TransactionKind.BET:
        await this.wagerService.processBet(
          dto.playerId,
          dto.walletId,
          idempotencyKey,
          payloadHash,
          dto.amount,
          dto.currency,
        );
        break;

      case TransactionKind.REFUND:
        if (!dto.referenceTransactionId) {
          throw new BadRequestException(
            'referenceTransactionId é obrigatório para transações do tipo REFUND.',
          );
        }
        await this.wagerService.processRefund(
          dto.referenceTransactionId,
          idempotencyKey,
          payloadHash,
          dto.amount,
          dto.currency,
        );
        break;

      default:
        throw new BadRequestException(`Tipo de transação '${dto.kind}' não suportado.`);
    }

    return { status: 'SUCCESS' };
  }
}
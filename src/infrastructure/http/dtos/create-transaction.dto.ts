import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { TransactionKind } from '../../../domain/enums/transaction.enums.ts';

export class CreateTransactionDto {
  @IsEnum(TransactionKind, {
    message: 'kind deve ser um tipo válido (ex: BET, WIN, REFUND)',
  })
  @IsNotEmpty()
  kind: TransactionKind;

  @IsString()
  @IsNotEmpty()
  playerId: string;

  @IsString()
  @IsNotEmpty()
  walletId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount deve ser um valor numérico válido com até 2 casas decimais (ex: 10.50)',
  })
  amount: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsOptional()
  referenceTransactionId?: string;
}
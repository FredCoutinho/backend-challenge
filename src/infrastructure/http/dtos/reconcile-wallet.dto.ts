import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ReconcileWalletDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'expectedBalance deve ser um valor decimal válido com até duas casas',
  })
  expectedBalance!: string;

  @IsString()
  @IsNotEmpty()
  currency!: string;
}
import { Body, Controller, Get, Param, Query, Post } from '@nestjs/common';
import { WalletService } from '../../../domain/services/wallet.service.ts';
import { GetLedgerQueryDto } from '../dtos/get-ledger-query.dto.ts';
import { ReconcileWalletDto } from '../dtos/reconcile-wallet.dto.ts';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':id')
  async getWallet(@Param('id') id: string) {
    return this.walletService.getWalletById(id);
  }

  @Get(':id/ledger')
  async getLedger(
    @Param('id') id: string,
    @Query() query: GetLedgerQueryDto,
  ) {
    return this.walletService.getLedger(id, query.limit, query.starting_after);
  }

  @Post(':id/reconciliation')
    async reconcile(
      @Param('id') id: string,
      @Body() dto: ReconcileWalletDto,
    ) {
      return this.walletService.reconcile(id, dto.expectedBalance, dto.currency);
    }
}
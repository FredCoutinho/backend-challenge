import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/core';
import { WagerTransaction } from '../../domain/entities/wager-transaction.entity.ts';
import { WalletLedgerEntry } from '../../domain/entities/wallet-ledger-entry.entity.ts';
import { Wallet } from '../../domain/entities/wallet.entity.ts';
import { TransactionKind } from '../../domain/enums/transaction.enums.ts';

@Injectable()
export class PendingReferenceWorker {
  private readonly logger = new Logger(PendingReferenceWorker.name);
  private isProcessing = false;

  constructor(private readonly em: EntityManager) {}

  
  @Interval(5000)
  async processPendingReferences(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const em = this.em.fork();

    try {
      // Busca transações que estouraram ordem e estão pendentes de referência
      const pendingTxs = await em.find(WagerTransaction, {
        status: 'PENDING_REFERENCE',
      }, { limit: 50 });

      for (const pendingTx of pendingTxs) {
        try {
          await em.transactional(async (manager) => {
            // Verifica se a transação referenciada agora existe
            const originalTx = await manager.findOne(WagerTransaction, {
              id: pendingTx.referenceTransactionId,
            });

            if (!originalTx) {
              // Aposta original ainda não chegou; mantém como pendente
              return;
            }

            // Localiza o ledger e a carteira da transação original
            const originalLedger = await manager.findOne(WalletLedgerEntry, {
              transaction: originalTx,
            });

            if (!originalLedger) {
              return;
            }

            const wallet = await manager.findOne(Wallet, {
              id: originalLedger.wallet.id,
            }, { lockMode: 1 });

            if (!wallet) return;

            // Executa a compensação baseada no tipo (REFUND ou ROLLBACK)
            const targetAmount = pendingTx.amount;
            
            if (pendingTx.kind === TransactionKind.REFUND || pendingTx.kind === TransactionKind.ROLLBACK) {
              Object.assign(wallet, {
                balance: wallet.balance.add(targetAmount),
              });
            }

            // Atualiza a transação pendente para liquidada
            pendingTx.status = 'SETTLED';
            pendingTx.referenceTransactionId = originalTx.id;

            const ledger = new WalletLedgerEntry({
              wallet,
              transaction: pendingTx,
              amount: targetAmount,
              balanceAfter: wallet.balance,
            });

            manager.persist([wallet, pendingTx, ledger]);
          });
        } catch (txError) {
          this.logger.error(`Erro ao processar transação pendente ${pendingTx.id}:`, txError);
        }
      }
    } catch (error) {
      this.logger.error('Erro na varredura de referências pendentes:', error);
    } finally {
      this.isProcessing = false;
    }
  }
}
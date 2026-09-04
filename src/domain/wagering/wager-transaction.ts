import { Money, MoneyProps } from '../value-objects/money.ts';

export enum WagerTransactionKind {
  Opening = 'OPENING',   // Crédito inicial interno
  Bet = 'BET',
  Win = 'WIN',
  Loss = 'LOSS',
  Refund = 'REFUND',
  Rollback = 'ROLLBACK',
}

export enum WagerTransactionStatus {
  Pending = 'PENDING',
  PendingReference = 'PENDING_REFERENCE', // Aguardando transação referenciada chegar
  Processed = 'PROCESSED',
  Rejected = 'REJECTED',
  Failed = 'FAILED',
}

export interface WagerTransactionProps {
  id: string;
  providerId: string;
  externalTransactionId: string;
  idempotencyKey: string;
  payloadHash: string;
  walletId: string;
  playerId: string;
  roundId: string;
  gameId: string;
  kind: WagerTransactionKind;
  money: MoneyProps;
  referenceExternalTransactionId?: string;
  createdAt: Date;
  status: WagerTransactionStatus;
  referenceTransactionId?: string;
  failureCode?: string;
  processedAt?: Date;
}

export class WagerTransaction {
  private constructor(
    public readonly id: string,
    public readonly providerId: string,
    public readonly externalTransactionId: string,
    public readonly idempotencyKey: string,
    public readonly payloadHash: string,
    public readonly walletId: string,
    public readonly playerId: string,
    public readonly roundId: string,
    public readonly gameId: string,
    public readonly kind: WagerTransactionKind,
    public readonly money: Money,
    public readonly referenceExternalTransactionId: string | undefined,
    public readonly createdAt: Date,
    private _status: WagerTransactionStatus,
    private _referenceTransactionId?: string,
    private _failureCode?: string,
    private _processedAt?: Date,
  ) {}

  public static create(props: Omit<WagerTransactionProps, 'status' | 'createdAt'>): WagerTransaction {
    return new WagerTransaction(
      props.id,
      props.providerId,
      props.externalTransactionId,
      props.idempotencyKey,
      props.payloadHash,
      props.walletId,
      props.playerId,
      props.roundId,
      props.gameId,
      props.kind,
      Money.from(props.money),
      props.referenceExternalTransactionId,
      new Date(),
      WagerTransactionStatus.Pending,
    );
  }

  public static rehydrate(state: WagerTransactionProps): WagerTransaction {
    return new WagerTransaction(
      state.id,
      state.providerId,
      state.externalTransactionId,
      state.idempotencyKey,
      state.payloadHash,
      state.walletId,
      state.playerId,
      state.roundId,
      state.gameId,
      state.kind,
      Money.from(state.money),
      state.referenceExternalTransactionId,
      state.createdAt,
      state.status,
      state.referenceTransactionId,
      state.failureCode,
      state.processedAt,
    );
  }

  public get status(): WagerTransactionStatus { return this._status; }
  public get referenceTransactionId(): string | undefined { return this._referenceTransactionId; }
  public get failureCode(): string | undefined { return this._failureCode; }
  public get processedAt(): Date | undefined { return this._processedAt; }

  public markProcessed(referenceTransactionId?: string): void {
    this.assertNotTerminal();
    this._status = WagerTransactionStatus.Processed;
    this._referenceTransactionId = referenceTransactionId;
    this._processedAt = new Date();
  }

  public markPendingReference(): void {
    this.assertNotTerminal();
    this._status = WagerTransactionStatus.PendingReference;
  }

  public reject(code: string): void {
    this.assertNotTerminal();
    this._status = WagerTransactionStatus.Rejected;
    this._failureCode = code;
    this._processedAt = new Date();
  }

  public isTerminal(): boolean {
    return (
      this._status === WagerTransactionStatus.Processed ||
      this._status === WagerTransactionStatus.Rejected ||
      this._status === WagerTransactionStatus.Failed
    );
  }

  private assertNotTerminal(): void {
    if (this.isTerminal()) {
      throw new Error(`Transação ${this.id} já está em um estado terminal (${this._status}) e não pode ser alterada.`);
    }
  }
}
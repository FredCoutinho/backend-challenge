import { FailureCode } from '../enums/failure-code.enum.ts';

export class DomainException extends Error {
  constructor(
    public readonly code: FailureCode,
    message: string,
  ) {
    super(message);
    this.name = 'DomainException';
  }
}
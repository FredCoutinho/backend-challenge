import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../../../domain/exceptions/domain.exception.ts';
import { FailureCode } from '../../../domain/enums/failure-code.enum.ts';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const statusCode = this.mapFailureCodeToHttpStatus(exception.code);

    response.status(statusCode).json({
      statusCode,
      code: exception.code,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }

  private mapFailureCodeToHttpStatus(code: FailureCode): number {
    switch (code) {
      case FailureCode.INSUFFICIENT_FUNDS:
        return HttpStatus.UNPROCESSABLE_ENTITY; // 422
      case FailureCode.IDEMPOTENCY_CONFLICT:
        return HttpStatus.CONFLICT; // 409
      case FailureCode.INVALID_CURRENCY:
      case FailureCode.INVALID_AMOUNT:
        return HttpStatus.BAD_REQUEST; // 400
      default:
        return HttpStatus.BAD_REQUEST; // 400
    }
  }
}
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CorrelationIdMiddleware, CORRELATION_ID_HEADER } from './correlation-id.middleware.ts';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;
  let reqMock: any;
  let resMock: any;
  let nextMock: any;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
    reqMock = { headers: {} };
    resMock = { setHeader: jest.fn() };
    nextMock = jest.fn();
  });

  it('deve gerar um novo correlationId em UUID se o header não for enviado', () => {
    middleware.use(reqMock, resMock, nextMock);

    const generatedId = reqMock.headers[CORRELATION_ID_HEADER];
    expect(generatedId).toBeDefined();
    expect(typeof generatedId).toBe('string');
    expect(resMock.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, generatedId);
    expect(nextMock).toHaveBeenCalled();
  });

  it('deve reaproveitar o correlationId enviado na requisição', () => {
    const existingId = 'custom-correlation-123';
    reqMock.headers[CORRELATION_ID_HEADER] = existingId;

    middleware.use(reqMock, resMock, nextMock);

    expect(reqMock.headers[CORRELATION_ID_HEADER]).toBe(existingId);
    expect(resMock.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, existingId);
    expect(nextMock).toHaveBeenCalled();
  });
});
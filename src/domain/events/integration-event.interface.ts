export interface IntegrationEvent<T = any> {
  eventId: string;
  eventType: string;
  eventVersion: number;
  correlationId: string;
  occurredAt: string;
  payload: T;
}
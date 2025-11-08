/**
 * TypeScript type definitions for Google's Agent Payments Protocol (AP2)
 */

/**
 * AP2 Payment Intent - Request from AI agent to initiate a payment
 */
export interface AP2PaymentIntent {
  intent_id: string;
  amount: string;
  currency: string;
  recipient: {
    agent_id: string;
    payment_address: string;
    payment_network?: string;
    destination_currency?: string;
  };
  sender: {
    agent_id: string;
    authorization_token: string;
  };
  metadata?: Record<string, unknown>;
  callback_url?: string;
  expires_at?: string;
}

/**
 * AP2 Payment Confirmation - Response after processing payment
 */
export interface AP2PaymentConfirmation {
  confirmation_id: string;
  intent_id: string;
  status: 'completed' | 'failed' | 'pending';
  transaction_details?: {
    network: string;
    transaction_hash: string;
    ledger: number;
    timestamp: string;
    settlement_time_seconds: number;
  };
  amount?: {
    sent: string;
    received: string;
    currency_sent: string;
    currency_received: string;
  };
  fees?: {
    network_fee: string;
    conversion_fee: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * AP2 JWT Authorization Token Payload
 */
export interface AP2AuthPayload {
  agent_id: string;
  permissions: string[];
  iat: number;
  exp: number;
}

/**
 * AP2 Error Codes
 */
export enum AP2ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  STELLAR_ERROR = 'STELLAR_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  NO_PATH_FOUND = 'NO_PATH_FOUND',
  EXPIRED_INTENT = 'EXPIRED_INTENT',
}

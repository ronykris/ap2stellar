/**
 * TypeScript type definitions for API requests and responses
 */

import { Request } from 'express';
import { AP2PaymentIntent } from './ap2.types';

/**
 * Express Request with typed body for payment endpoint
 */
export interface PaymentRequest extends Request {
  body: AP2PaymentIntent;
}

/**
 * Express Request with typed params for status endpoint
 */
export interface StatusRequest extends Request {
  params: {
    intent_id: string;
  };
}

/**
 * Query parameters for quote endpoint
 */
export interface QuoteQuery {
  source_currency: string;
  destination_currency: string;
  source_amount: string;
}

/**
 * Express Request with typed query for quote endpoint
 */
export interface QuoteRequest extends Request {
  query: QuoteQuery;
}

/**
 * Generic API Response wrapper
 */
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Quote Response
 */
export interface QuoteResponse {
  source_currency: string;
  destination_currency: string;
  source_amount: string;
  estimated_destination_amount: string;
  estimated_fee: string;
  exchange_rate: string;
  path_length: number;
}

/**
 * Health Check Response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    stellar: 'connected' | 'disconnected';
    horizon: 'reachable' | 'unreachable';
  };
  version: string;
}

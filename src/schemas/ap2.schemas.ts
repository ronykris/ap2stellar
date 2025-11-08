/**
 * AJV JSON schemas for AP2 payment intent validation
 */

import { JSONSchemaType } from 'ajv';
import { AP2PaymentIntent } from '../types';

/**
 * JSON Schema for AP2 Payment Intent
 */
export const paymentIntentSchema: JSONSchemaType<AP2PaymentIntent> = {
  type: 'object',
  properties: {
    intent_id: {
      type: 'string',
      minLength: 1,
    },
    amount: {
      type: 'string',
      pattern: '^[0-9]+(\\.[0-9]{1,7})?$',
    },
    currency: {
      type: 'string',
      minLength: 3,
      maxLength: 4,
    },
    recipient: {
      type: 'object',
      properties: {
        agent_id: {
          type: 'string',
          minLength: 1,
        },
        payment_address: {
          type: 'string',
          minLength: 1,
        },
        payment_network: {
          type: 'string',
          nullable: true,
        },
        destination_currency: {
          type: 'string',
          nullable: true,
        },
      },
      required: ['agent_id', 'payment_address'],
      additionalProperties: false,
    },
    sender: {
      type: 'object',
      properties: {
        agent_id: {
          type: 'string',
          minLength: 1,
        },
        authorization_token: {
          type: 'string',
          minLength: 1,
        },
      },
      required: ['agent_id', 'authorization_token'],
      additionalProperties: false,
    },
    metadata: {
      type: 'object',
      nullable: true,
      required: [],
    },
    callback_url: {
      type: 'string',
      format: 'uri',
      nullable: true,
    },
    expires_at: {
      type: 'string',
      format: 'date-time',
      nullable: true,
    },
  },
  required: ['intent_id', 'amount', 'currency', 'recipient', 'sender'],
  additionalProperties: false,
};

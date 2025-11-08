# AP2Stellar API Documentation

Complete API reference for the AP2Stellar payment router.

## Base URL

- Development: `http://localhost:3000`

## Authentication

### API Key (Optional)

If configured, include API key in request headers:

```
X-API-Key: your-api-key
```

### AP2 JWT Token (Required for Payments)

Payment intents must include a JWT token in `sender.authorization_token`:

```json
{
  "agent_id": "your-agent-id",
  "permissions": ["payment:send"],
  "iat": 1234567890,
  "exp": 1234571490
}
```

Token must be signed with `AP2_JWT_SECRET` using HS256 algorithm.

## Endpoints

### 1. Health Check

Check service health status.

**Endpoint**: `GET /health`

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "stellar": "connected",
    "horizon": "reachable"
  },
  "version": "1.0.0"
}
```

**Response** (503 Service Unavailable):
```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "stellar": "disconnected",
    "horizon": "unreachable"
  },
  "version": "1.0.0"
}
```

---

### 2. Submit Payment

Process an AP2 payment intent and execute on Stellar Network.

**Endpoint**: `POST /api/v1/ap2/payment`

**Headers**:
```
Content-Type: application/json
X-API-Key: your-api-key (optional)
```

**Request Body**:
```json
{
  "intent_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": "100.00",
  "currency": "USD",
  "recipient": {
    "agent_id": "recipient-agent-001",
    "payment_address": "stellar:GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "payment_network": "stellar",
    "destination_currency": "EUR"
  },
  "sender": {
    "agent_id": "sender-agent-001",
    "authorization_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "metadata": {
    "purpose": "Payment for AI services",
    "invoice_id": "INV-2024-001"
  },
  "callback_url": "https://your-service.com/callback",
  "expires_at": "2024-01-15T11:00:00.000Z"
}
```

**Field Descriptions**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| intent_id | string | Yes | Unique identifier for payment intent (UUID recommended) |
| amount | string | Yes | Payment amount (decimal string, e.g., "100.00") |
| currency | string | Yes | Source currency code (USD, EUR, GBP, XLM, USDC, EURC, GBPC) |
| recipient.agent_id | string | Yes | Recipient AI agent identifier |
| recipient.payment_address | string | Yes | Stellar address (G-address, optionally prefixed with "stellar:") |
| recipient.payment_network | string | No | Payment network identifier (always "stellar") |
| recipient.destination_currency | string | No | Destination currency (defaults to source currency) |
| sender.agent_id | string | Yes | Sender AI agent identifier |
| sender.authorization_token | string | Yes | JWT token with payment:send permission |
| metadata | object | No | Additional key-value data for tracking |
| callback_url | string | No | URL to receive async payment confirmation |
| expires_at | string | No | ISO 8601 timestamp when intent expires |

**Success Response** (200 OK):
```json
{
  "confirmation_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "intent_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "transaction_details": {
    "network": "stellar",
    "transaction_hash": "3389e9f0f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889",
    "ledger": 12345678,
    "timestamp": "2024-01-15T10:30:05.000Z",
    "settlement_time_seconds": 5
  },
  "amount": {
    "sent": "100.00",
    "received": "92.50",
    "currency_sent": "USDC",
    "currency_received": "EURC"
  },
  "fees": {
    "network_fee": "0.00001",
    "conversion_fee": "0"
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "confirmation_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "intent_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Unsupported currency: JPY"
  }
}
```

**Error Codes**:

| Code | Description |
|------|-------------|
| VALIDATION_ERROR | Invalid request schema or parameters |
| AUTH_ERROR | JWT verification failed or missing permissions |
| STELLAR_ERROR | Stellar transaction failed |
| INSUFFICIENT_FUNDS | Router account has insufficient balance |
| NO_PATH_FOUND | No DEX path found for currency conversion |
| EXPIRED_INTENT | Payment intent has expired |

---

### 3. Query Payment Status

Retrieve payment status by intent ID.

**Endpoint**: `GET /api/v1/ap2/payment/:intent_id`

**URL Parameters**:
- `intent_id` - Payment intent ID from original request

**Example**: `GET /api/v1/ap2/payment/550e8400-e29b-41d4-a716-446655440000`

**Success Response** (200 OK):
```json
{
  "confirmation_id": "3389e9f0f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889",
  "intent_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "transaction_details": {
    "network": "stellar",
    "transaction_hash": "3389e9f0f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889",
    "ledger": 12345678,
    "timestamp": "2024-01-15T10:30:05.000Z",
    "settlement_time_seconds": 5
  }
}
```

**Not Found Response** (404 Not Found):
```json
{
  "status": "error",
  "error": {
    "code": "NOT_FOUND",
    "message": "Payment not found"
  }
}
```

---

### 4. Get Exchange Rate Quote

Get an exchange rate quote without executing a transaction.

**Endpoint**: `GET /api/v1/quote`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| source_currency | string | Yes | Source currency code |
| destination_currency | string | Yes | Destination currency code |
| source_amount | string | Yes | Amount to convert (decimal string) |
| destination_address | string | No | Stellar G-address (for path optimization) |

**Example**: `GET /api/v1/quote?source_currency=USD&destination_currency=EUR&source_amount=100.00`

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "source_currency": "USDC",
    "destination_currency": "EURC",
    "source_amount": "100.00",
    "estimated_destination_amount": "92.50",
    "estimated_fee": "0.00001",
    "exchange_rate": "0.9250000",
    "path_length": 2
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Unsupported source currency: JPY"
  }
}
```

**Error Response** (500 Internal Server Error):
```json
{
  "status": "error",
  "error": {
    "code": "QUOTE_ERROR",
    "message": "No payment path found from USDC to EURC"
  }
}
```

---

## Rate Limiting

### Default Limits

- **General API**: 100 requests per 15 minutes per IP
- **Payment Endpoint**: 20 requests per 15 minutes per IP

### Rate Limit Headers

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1234567890
```

### Rate Limit Exceeded Response (429)

```json
{
  "status": "error",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later"
  }
}
```

---

## Webhooks / Callbacks

If `callback_url` is provided in the payment intent, AP2Stellar will send a POST request with the payment confirmation.

**Callback Request**:

```
POST https://your-service.com/callback
Content-Type: application/json
X-AP2-Version: 1.0
User-Agent: AP2Stellar/1.0
```

**Callback Body** (same as payment response):
```json
{
  "confirmation_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "intent_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "transaction_details": {
    "network": "stellar",
    "transaction_hash": "3389e9f0f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889",
    "ledger": 12345678,
    "timestamp": "2024-01-15T10:30:05.000Z",
    "settlement_time_seconds": 5
  },
  "amount": {
    "sent": "100.00",
    "received": "92.50",
    "currency_sent": "USDC",
    "currency_received": "EURC"
  },
  "fees": {
    "network_fee": "0.00001",
    "conversion_fee": "0"
  }
}
```

**Callback Configuration**:
- Timeout: 5 seconds
- Retries: 3 attempts with 1 second delay
- Callbacks are sent asynchronously (payment confirmation returned immediately)

**Callback Response**:
Your endpoint should return 2xx status code to acknowledge receipt.

---

## Example Usage

### cURL Example

```bash
# Generate test payment intent with valid JWT
npm run generate:intent

# Submit payment
curl -X POST http://localhost:3000/api/v1/ap2/payment \
  -H "Content-Type: application/json" \
  -d '{
    "intent_id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": "10.00",
    "currency": "XLM",
    "recipient": {
      "agent_id": "test-recipient",
      "payment_address": "stellar:GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    },
    "sender": {
      "agent_id": "test-sender",
      "authorization_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }'

# Query payment status
curl http://localhost:3000/api/v1/ap2/payment/550e8400-e29b-41d4-a716-446655440000

# Get quote
curl "http://localhost:3000/api/v1/quote?source_currency=USD&destination_currency=EUR&source_amount=100"
```

### Node.js Example

```javascript
import axios from 'axios';
import jwt from 'jsonwebtoken';

// Generate JWT token
const token = jwt.sign(
  {
    agent_id: 'my-agent-001',
    permissions: ['payment:send'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  process.env.AP2_JWT_SECRET,
  { algorithm: 'HS256' }
);

// Submit payment
const response = await axios.post('http://localhost:3000/api/v1/ap2/payment', {
  intent_id: crypto.randomUUID(),
  amount: '50.00',
  currency: 'USD',
  recipient: {
    agent_id: 'recipient-agent',
    payment_address: 'stellar:GXXXXX...',
    destination_currency: 'EUR'
  },
  sender: {
    agent_id: 'my-agent-001',
    authorization_token: token
  }
});

console.log('Payment confirmation:', response.data);
```

### Python Example

```python
import requests
import jwt
import time
from uuid import uuid4

# Generate JWT token
payload = {
    'agent_id': 'my-agent-001',
    'permissions': ['payment:send'],
    'iat': int(time.time()),
    'exp': int(time.time()) + 3600
}
token = jwt.encode(payload, 'your-secret', algorithm='HS256')

# Submit payment
response = requests.post('http://localhost:3000/api/v1/ap2/payment', json={
    'intent_id': str(uuid4()),
    'amount': '50.00',
    'currency': 'USD',
    'recipient': {
        'agent_id': 'recipient-agent',
        'payment_address': 'stellar:GXXXXX...',
        'destination_currency': 'EUR'
    },
    'sender': {
        'agent_id': 'my-agent-001',
        'authorization_token': token
    }
})

print('Payment confirmation:', response.json())
```

---

## Testing

### Test Endpoints

For development/testing, use the included scripts:

```bash
# Generate test payment intent with JWT
npm run generate:intent

# Run end-to-end test flow
npm run test:flow <DESTINATION_ADDRESS>
```

### Test Accounts

For Stellar testnet:
1. Create account: `npm run setup:testnet`
2. Fund via Friendbot: https://friendbot.stellar.org
3. View on Stellar Expert: https://stellar.expert/explorer/testnet

### Test Currencies

On testnet, use:
- XLM (native)
- Testnet USDC/EURC/GBPC (limited liquidity)

On mainnet:
- All supported currencies have production liquidity

---

## Error Handling Best Practices

1. **Always check `status` field**: "completed" or "failed"
2. **Handle failed confirmations**: Check `error.code` for specific error type
3. **Implement retries**: For network errors, retry with exponential backoff
4. **Monitor callbacks**: Set up callback endpoint for async notifications
5. **Query status**: If callback fails, poll status endpoint
6. **Validate before submitting**: Use quote endpoint to check feasibility

---



## API Versioning

Current version: **v1**

API version is included in the URL path (`/api/v1/`) and response headers (`X-AP2-Version: 1.0`).

Breaking changes will result in a new version (`/api/v2/`).

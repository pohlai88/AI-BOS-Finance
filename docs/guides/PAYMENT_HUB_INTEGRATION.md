# 🔌 Payment Hub Integration Guide

**Version**: 1.0.0  
**Phase 6b Enhancement**: Integration Kit  
**Last Updated**: December 16, 2025

---

## 📋 Table of Contents

1. [Quick Start (Standalone)](#quick-start-standalone)
2. [Authentication](#authentication)
3. [Webhook Integration](#webhook-integration)
4. [Beneficiary Import](#beneficiary-import)
5. [Payment Lifecycle](#payment-lifecycle)
6. [Error Handling](#error-handling)
7. [Security Best Practices](#security-best-practices)
8. [Example Integrations](#example-integrations)

---

## 🚀 Quick Start (Standalone)

### Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- PostgreSQL client (optional, for database inspection)
- curl or Postman for API testing

### 1. Deploy Payment Hub

```bash
# Clone repository
cd AI-BOS-Finance

# Copy environment template
cp docker/.env.payment-hub.example docker/.env

# Edit configuration
nano docker/.env
# Set: POSTGRES_PASSWORD, JWT_SECRET, REDIS_PASSWORD

# Start minimal deployment (PostgreSQL + Payment Hub)
docker-compose -f docker/docker-compose.payment-hub.yml up -d

# Or start full deployment (includes Redis + webhook worker)
docker-compose -f docker/docker-compose.payment-hub.yml --profile full up -d

# Check service health
docker-compose -f docker/docker-compose.payment-hub.yml ps
```

### 2. Initialize Database

```bash
# Run migrations
docker exec payment-hub-api pnpm db:migrate

# (Optional) Seed sample data
docker exec payment-hub-api pnpm db:seed
```

### 3. Verify Deployment

```bash
# Check API health
curl http://localhost:3001/api/health

# Expected response:
# {
#   "status": "ok",
#   "version": "1.0.0",
#   "database": "connected",
#   "timestamp": "2025-12-16T10:00:00Z"
# }
```

---

## 🔐 Authentication

Payment Hub uses JWT-based authentication. You'll need to obtain an API key or JWT token.

### Option 1: Service Account API Key (Recommended)

```bash
# Create a service account API key
curl -X POST http://localhost:3001/api/auth/keys \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ERP Integration",
    "description": "API key for SAP ERP integration",
    "scopes": [
      "payments:read",
      "payments:write",
      "webhooks:manage",
      "beneficiaries:import"
    ],
    "expiresIn": "365d"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "keyId": "key_abc123...",
#     "apiKey": "sk_live_abc123...xyz789",
#     "scopes": ["payments:read", "payments:write", "webhooks:manage", "beneficiaries:import"],
#     "expiresAt": "2026-12-16T10:00:00Z"
#   }
# }

# Store the API key securely (only shown once!)
export PAYMENT_HUB_API_KEY="sk_live_abc123...xyz789"
```

### Option 2: JWT Token (User-based)

```bash
# Login to obtain JWT token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'

# Response:
# {
#   "success": true,
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "expiresIn": 3600
# }

export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Using Authentication in Requests

```bash
# With API Key (recommended for service-to-service)
curl -H "Authorization: Bearer ${PAYMENT_HUB_API_KEY}" \
  http://localhost:3001/api/payments

# With JWT Token (for user-based access)
curl -H "Authorization: Bearer ${JWT_TOKEN}" \
  http://localhost:3001/api/payments
```

---

## 🔔 Webhook Integration

Webhooks allow your system to receive real-time notifications when payment events occur.

### Step 1: Register a Webhook

```bash
# Register webhook for payment events
curl -X POST http://localhost:3001/api/webhooks \
  -H "Authorization: Bearer ${PAYMENT_HUB_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "finance.ap.payment.completed",
    "targetUrl": "https://your-erp.com/webhooks/payments",
    "secret": "your_webhook_secret_min_32_chars_long",
    "filters": [
      {
        "field": "amount",
        "operator": "gt",
        "value": 10000
      }
    ]
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "id": "wh_abc123...",
#     "eventType": "finance.ap.payment.completed",
#     "targetUrl": "https://your-erp.com/webhooks/payments",
#     "status": "active",
#     "createdAt": "2025-12-16T10:00:00Z"
#   }
# }
```

### Step 2: Handle Webhook Events

```javascript
// Node.js/Express example
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Webhook endpoint
app.post('/webhooks/payments', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;
  
  // Verify signature
  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process event
  const event = req.body;
  console.log(`Received event: ${event.type}`);
  
  switch (event.type) {
    case 'finance.ap.payment.completed':
      handlePaymentCompleted(event.data);
      break;
    case 'finance.ap.payment.failed':
      handlePaymentFailed(event.data);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  // Acknowledge receipt
  res.status(200).json({ received: true });
});

// Signature verification (HMAC-SHA256)
function verifyWebhookSignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex')
  );
}

function handlePaymentCompleted(payment) {
  console.log(`Payment ${payment.paymentId} completed`);
  // Update your ERP system
  // Send confirmation email
  // Generate accounting entries
}

function handlePaymentFailed(payment) {
  console.error(`Payment ${payment.paymentId} failed: ${payment.failureReason}`);
  // Alert finance team
  // Retry logic
}

app.listen(3000, () => console.log('Webhook handler running on port 3000'));
```

### Available Webhook Events

| Event | Trigger | Payload Structure |
|-------|---------|-------------------|
| `finance.ap.payment.created` | New payment created | `{paymentId, amount, vendor, status}` |
| `finance.ap.payment.submitted` | Payment submitted for approval | `{paymentId, submittedBy, submittedAt}` |
| `finance.ap.payment.approved` | Payment approved | `{paymentId, approvedBy, approvedAt}` |
| `finance.ap.payment.rejected` | Payment rejected | `{paymentId, rejectedBy, reason}` |
| `finance.ap.payment.executed` | Payment sent to bank | `{paymentId, beneficiary, executedAt}` |
| `finance.ap.payment.completed` | Bank confirmed | `{paymentId, confirmationRef, completedAt}` |
| `finance.ap.payment.failed` | Bank failed | `{paymentId, failureReason, errorCode}` |

### Managing Webhooks

```bash
# List all webhooks
curl -H "Authorization: Bearer ${PAYMENT_HUB_API_KEY}" \
  http://localhost:3001/api/webhooks

# Get webhook details
curl -H "Authorization: Bearer ${PAYMENT_HUB_API_KEY}" \
  http://localhost:3001/api/webhooks/wh_abc123

# Pause webhook
curl -X PATCH http://localhost:3001/api/webhooks/wh_abc123 \
  -H "Authorization: Bearer ${PAYMENT_HUB_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"status": "paused"}'

# Delete webhook
curl -X DELETE http://localhost:3001/api/webhooks/wh_abc123 \
  -H "Authorization: Bearer ${PAYMENT_HUB_API_KEY}"
```

---

## 👥 Beneficiary Import

Import vendor bank details from your external systems (ERP, accounting software, etc.).

### Bulk Import

```bash
curl -X POST http://localhost:3001/api/payments/import/beneficiaries \
  -H "Authorization: Bearer ${PAYMENT_HUB_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaries": [
      {
        "externalId": "VENDOR-001",
        "vendorId": "V001",
        "vendorName": "Acme Corporation",
        "bankDetails": {
          "accountNumber": "123456789",
          "accountName": "Acme Corp",
          "routingNumber": "021000021",
          "bankName": "Chase Bank",
          "bankCode": "CHASUS33",
          "country": "US"
        }
      },
      {
        "externalId": "VENDOR-002",
        "vendorId": "V002",
        "vendorName": "Global Supplies Ltd",
        "bankDetails": {
          "iban": "GB82WEST12345698765432",
          "accountName": "Global Supplies Ltd",
          "swiftCode": "ABCDGB2L",
          "bankName": "HSBC UK",
          "country": "GB"
        }
      }
    ]
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "imported": 2,
#     "skipped": 0,
#     "errors": [],
#     "beneficiaries": [
#       {
#         "id": "ben_abc123",
#         "externalId": "VENDOR-001",
#         "status": "active"
#       },
#       {
#         "id": "ben_xyz789",
#         "externalId": "VENDOR-002",
#         "status": "active"
#       }
#     ]
#   }
# }
```

### Update Existing Beneficiary

```bash
curl -X PUT http://localhost:3001/api/payments/import/beneficiaries/VENDOR-001 \
  -H "Authorization: Bearer ${PAYMENT_HUB_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "bankDetails": {
      "accountNumber": "987654321",
      "accountName": "Acme Corp - New Account",
      "routingNumber": "021000021",
      "bankName": "Chase Bank",
      "country": "US"
    }
  }'
```

### Query Beneficiaries

```bash
# List all beneficiaries
curl -H "Authorization: Bearer ${PAYMENT_HUB_API_KEY}" \
  "http://localhost:3001/api/payments/import/beneficiaries?page=1&limit=50"

# Get specific beneficiary
curl -H "Authorization: Bearer ${PAYMENT_HUB_API_KEY}" \
  "http://localhost:3001/api/payments/import/beneficiaries/VENDOR-001"

# Search by vendor
curl -H "Authorization: Bearer ${PAYMENT_HUB_API_KEY}" \
  "http://localhost:3001/api/payments/import/beneficiaries?vendorId=V001"
```

---

## 💰 Payment Lifecycle

### Create Payment

```bash
curl -X POST http://localhost:3001/api/payments \
  -H "Authorization: Bearer ${PAYMENT_HUB_API_KEY}" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -d '{
    "vendorId": "VENDOR-001",
    "vendorName": "Acme Corporation",
    "amount": "15000.00",
    "currency": "USD",
    "paymentDate": "2025-12-20",
    "sourceDocumentId": "INV-2024-12-001",
    "sourceDocumentType": "invoice",
    "description": "Q4 2024 Consulting Services",
    "metadata": {
      "costCenter": "CC-001",
      "glAccount": "60100",
      "projectCode": "PROJ-2024-Q4"
    }
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "id": "pay_abc123",
#     "paymentNumber": "PAY-2024-12-0001",
#     "status": "draft",
#     "amount": "15000.00",
#     "currency": "USD",
#     "createdAt": "2025-12-16T10:00:00Z",
#     "version": 1
#   }
# }
```

### Submit for Approval

```bash
curl -X POST http://localhost:3001/api/payments/pay_abc123/submit \
  -H "Authorization: Bearer ${PAYMENT_HUB_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Approved by project manager"
  }'
```

### Approve Payment

```bash
curl -X POST http://localhost:3001/api/payments/pay_abc123/approve \
  -H "Authorization: Bearer ${PAYMENT_HUB_API_KEY}" \
  -H "Content-Type: application/json" \
  -H "X-Version: 2" \
  -d '{
    "approverComments": "Verified against contract",
    "approvalCode": "APR-2024-12-001"
  }'
```

### Query Payments

```bash
# List payments with filters
curl -H "Authorization: Bearer ${PAYMENT_HUB_API_KEY}" \
  "http://localhost:3001/api/payments?status=pending_approval&limit=20&offset=0"

# Get payment details
curl -H "Authorization: Bearer ${PAYMENT_HUB_API_KEY}" \
  "http://localhost:3001/api/payments/pay_abc123"

# Get payment audit trail
curl -H "Authorization: Bearer ${PAYMENT_HUB_API_KEY}" \
  "http://localhost:3001/api/payments/pay_abc123/audit"
```

---

## ⚠️ Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Continue |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Check request payload |
| 401 | Unauthorized | Check API key/token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate or version mismatch |
| 429 | Too Many Requests | Implement backoff |
| 500 | Server Error | Retry with exponential backoff |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_NOT_FOUND",
    "message": "Payment with ID pay_abc123 not found",
    "details": {
      "paymentId": "pay_abc123",
      "timestamp": "2025-12-16T10:00:00Z"
    }
  }
}
```

### Retry Strategy

```javascript
async function callPaymentHub(url, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return await response.json();
      }
      
      // Don't retry 4xx errors (except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new Error(`Client error: ${response.status}`);
      }
      
      // Retry 5xx and 429
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Exponential backoff, max 30s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw new Error(`Server error after ${maxRetries} attempts`);
      
    } catch (error) {
      if (attempt === maxRetries) throw error;
    }
  }
}
```

---

## 🔒 Security Best Practices

### 1. API Key Management

- ✅ **Store securely**: Use environment variables or secret managers
- ✅ **Rotate regularly**: Rotate API keys every 90 days
- ✅ **Least privilege**: Request only required scopes
- ❌ **Never commit**: Don't commit API keys to version control
- ❌ **Never log**: Don't log API keys in plaintext

### 2. Webhook Security

```javascript
// ✅ Always verify webhook signatures
function verifyWebhookSignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex')
  );
}

// ✅ Use HTTPS for webhook endpoints
// ✅ Implement request timeout (< 5s)
// ✅ Return 200 quickly, process async
```

### 3. Idempotency

```bash
# Always use idempotency keys for payment creation
curl -X POST http://localhost:3001/api/payments \
  -H "X-Idempotency-Key: unique-key-per-request" \
  ...
```

### 4. Version Control

```bash
# Include version header for updates
curl -X POST http://localhost:3001/api/payments/pay_abc123/approve \
  -H "X-Version: 2" \
  ...
```

---

## 🔧 Example Integrations

### SAP ERP Integration

```javascript
// sap-payment-sync.js
const axios = require('axios');

class SAPPaymentSync {
  constructor(paymentHubUrl, apiKey) {
    this.client = axios.create({
      baseURL: paymentHubUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  async syncVendors() {
    // 1. Fetch vendors from SAP
    const vendors = await this.fetchSAPVendors();
    
    // 2. Transform to Payment Hub format
    const beneficiaries = vendors.map(v => ({
      externalId: v.LIFNR, // SAP vendor number
      vendorId: v.LIFNR,
      vendorName: v.NAME1,
      bankDetails: {
        accountNumber: v.BANKN,
        accountName: v.KOINH,
        bankCode: v.BANKL,
        country: v.BANKS
      }
    }));
    
    // 3. Bulk import
    const result = await this.client.post('/payments/import/beneficiaries', {
      beneficiaries
    });
    
    console.log(`Synced ${result.data.data.imported} vendors`);
  }
  
  async syncInvoices() {
    // Similar pattern for invoice-driven payments
  }
}
```

### Python Integration

```python
import requests
import hmac
import hashlib
from typing import Dict, Any

class PaymentHubClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })
    
    def create_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new payment"""
        response = self.session.post(
            f'{self.base_url}/payments',
            json=payment_data,
            headers={'X-Idempotency-Key': self._generate_idempotency_key()}
        )
        response.raise_for_status()
        return response.json()
    
    def verify_webhook(self, payload: str, signature: str, secret: str) -> bool:
        """Verify webhook signature"""
        expected = hmac.new(
            secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(signature, expected)
    
    @staticmethod
    def _generate_idempotency_key():
        import uuid
        return str(uuid.uuid4())
```

---

## 📞 Support

- **Documentation**: https://docs.ai-bos.finance/payment-hub
- **API Reference**: https://api.ai-bos.finance/docs
- **GitHub Issues**: https://github.com/AI-BOS/AI-BOS-Finance/issues
- **Email**: support@ai-bos.finance

---

## 📋 Appendix

### Environment URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| Local | http://localhost:3001 | Development |
| Staging | https://staging-payment-hub.ai-bos.finance | Testing |
| Production | https://payment-hub.ai-bos.finance | Live |

### Rate Limits

| Endpoint Pattern | Limit | Window |
|------------------|-------|--------|
| `/api/payments` | 100 req | 1 minute |
| `/api/webhooks` | 50 req | 1 minute |
| `/api/payments/import/*` | 10 req | 1 minute |

### Supported Currencies

USD, EUR, GBP, AUD, CAD, CHF, JPY, SGD, HKD, NZD

### Supported Countries

All ISO 3166-1 alpha-2 codes. Special handling for:
- US: Routing number required
- EU: IBAN required
- UK: Sort code + account number
- International: SWIFT/BIC code

---

**Last Updated**: December 16, 2025  
**Version**: 1.0.0  
**License**: Proprietary - AI-BOS Finance

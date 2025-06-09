# WesternBid Payment Gateway Integration

## Overview

This document describes the enhanced WesternBid payment gateway integration for the Vobvorot Next.js e-commerce store. The integration provides a complete, production-ready payment processing system with security, logging, monitoring, and refund capabilities.

## Features

### ✅ Core Payment Processing
- **Payment Creation**: Create secure payment sessions with WesternBid
- **Payment Verification**: Verify payment status and completion
- **Webhook Processing**: Automatic order status updates via webhooks
- **Mock Mode**: Development mode with simulated payments

### ✅ Security & Compliance
- **Signature Verification**: HMAC-SHA256 webhook signature verification
- **Rate Limiting**: Protection against API abuse
- **IP Whitelisting**: Restrict webhook access to trusted IPs
- **Payload Validation**: Secure payload size and content validation
- **Request Fingerprinting**: Fraud detection capabilities

### ✅ Monitoring & Logging
- **Comprehensive Logging**: Detailed payment, webhook, and security event logs
- **Configurable Log Levels**: DEBUG, INFO, WARN, ERROR, CRITICAL
- **Sensitive Data Masking**: Automatic masking of sensitive information
- **File & Console Logging**: Flexible logging output options

### ✅ Refund Management
- **Full Refunds**: Complete order refunds with inventory restoration
- **Partial Refunds**: Partial amount refunds
- **Admin API**: Administrative refund processing interface
- **Audit Trail**: Complete refund history and logging

### ✅ Environment Management
- **Multi-Environment**: Development, staging, and production configurations
- **Feature Flags**: Granular feature enabling/disabling
- **Configuration Validation**: Automatic configuration validation

## Architecture

### Core Components

```
src/lib/
├── westernbid.ts              # Main WesternBid API client
├── payment-config.ts          # Environment configuration management
├── payment-logger.ts          # Comprehensive payment logging
└── payment-security.ts        # Security middleware and utilities

src/app/api/
├── orders/create/route.ts     # Enhanced order creation with logging
├── webhooks/westernbid/route.ts # Secure webhook handler
└── admin/refunds/route.ts     # Administrative refund API
```

### Data Flow

```
1. Customer initiates checkout
   ↓
2. Order created in database
   ↓
3. Payment session created with WesternBid
   ↓
4. Customer redirected to payment gateway
   ↓
5. Payment processed by WesternBid
   ↓
6. Webhook notification received
   ↓
7. Security validation & signature verification
   ↓
8. Order status updated automatically
   ↓
9. Notifications sent (email, Telegram)
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

#### WesternBid Settings
```bash
# Required
WESTERNBID_MERCHANT_ID=your-merchant-id
WESTERNBID_SECRET_KEY=your-secret-key
WESTERNBID_WEBHOOK_SECRET=your-webhook-secret

# Optional
WESTERNBID_API_URL=https://api.westernbid.com
WESTERNBID_ENVIRONMENT=sandbox # or production
WESTERNBID_ENABLED=true
WESTERNBID_TIMEOUT=30000
WESTERNBID_RETRY_ATTEMPTS=3
```

#### Development Mode
```bash
WESTERNBID_MOCK_MODE=true
WESTERNBID_MOCK_SUCCESS_RATE=80 # 80% success rate for testing
```

#### Security Settings
```bash
PAYMENT_SIGNATURE_VERIFICATION=true # Enable in production
PAYMENT_RATE_LIMITING=true
PAYMENT_ALLOWED_IPS=52.89.214.238,52.89.214.239 # WesternBid IPs
```

#### Logging Configuration
```bash
PAYMENT_LOG_LEVEL=INFO
PAYMENT_LOG_FILE=true
PAYMENT_LOG_CONSOLE=true
PAYMENT_LOG_DIR=./logs/payments
PAYMENT_LOG_MASK_SENSITIVE=true
```

### Multi-Environment Configuration

The system supports three environments with different default configurations:

#### Development
- Mock mode enabled
- Relaxed security settings
- Verbose console logging
- No signature verification required

#### Staging
- Real API integration
- Moderate security settings
- File and console logging
- Signature verification enabled

#### Production
- Strict security settings
- File logging only
- IP whitelisting enabled
- All security features enabled

## API Reference

### WesternBid Client

```typescript
import { westernbid, PaymentRequest } from '@/lib/westernbid'

// Create payment
const paymentRequest: PaymentRequest = {
  orderId: 'ORDER-123',
  amount: 99.99,
  currency: 'USD',
  description: 'Order payment',
  customerEmail: 'customer@example.com',
  customerName: 'John Doe',
  customerPhone: '+1234567890',
  returnUrl: 'https://yoursite.com/payment/success',
  cancelUrl: 'https://yoursite.com/payment/cancel',
  webhookUrl: 'https://yoursite.com/api/webhooks/westernbid',
  metadata: {
    userId: 'user-456',
    customField: 'value'
  }
}

const result = await westernbid.createPayment(paymentRequest)
```

### Payment Status

```typescript
// Get payment status
const status = await westernbid.getPaymentStatus('payment-id')

// Verify payment (legacy method)
const verification = await westernbid.verifyPayment('payment-id')
```

### Refund Processing

```typescript
import { westernbid, RefundRequest } from '@/lib/westernbid'

const refundRequest: RefundRequest = {
  paymentId: 'payment-id',
  amount: 49.99, // Partial refund (optional)
  reason: 'Customer request',
  metadata: {
    adminUserId: 'admin-123'
  }
}

const refund = await westernbid.refundPayment(refundRequest)
```

### Webhook Verification

```typescript
import { verifyWebhookSignature } from '@/lib/payment-security'

const isValid = verifyWebhookSignature(
  payload,
  receivedSignature,
  webhookSecret
)
```

## Security Best Practices

### Production Security Checklist

- [ ] **Webhook Secret**: Configure strong webhook secret
- [ ] **Signature Verification**: Enable signature verification
- [ ] **IP Whitelisting**: Restrict to WesternBid IPs only
- [ ] **Rate Limiting**: Enable rate limiting
- [ ] **HTTPS Only**: Ensure all endpoints use HTTPS
- [ ] **Sensitive Data Masking**: Enable in logs
- [ ] **Environment Variables**: Use secure environment variable management

### WesternBid IP Addresses

Add these IPs to your whitelist (update with actual WesternBid IPs):
```
52.89.214.238
52.89.214.239
52.89.214.240
```

### Webhook Endpoint Security

The webhook endpoint `/api/webhooks/westernbid` includes:
- Payload size validation
- Signature verification
- Rate limiting
- IP whitelisting
- Suspicious pattern detection
- Request fingerprinting

## Error Handling

### Payment Errors

The system handles various error scenarios:

```typescript
// Payment creation errors
{
  success: false,
  error: "Payment creation failed",
  errorCode: "INVALID_AMOUNT"
}

// Webhook verification errors
{
  error: "Invalid signature",
  statusCode: 401
}

// Rate limiting
{
  error: "Rate limit exceeded",
  statusCode: 429,
  headers: {
    "Retry-After": "60"
  }
}
```

### Error Categories

1. **Configuration Errors**: Missing or invalid configuration
2. **API Errors**: WesternBid API communication failures
3. **Security Errors**: Signature verification, rate limiting
4. **Validation Errors**: Invalid request data
5. **Network Errors**: Timeout, connection issues

## Logging & Monitoring

### Log Levels

- **DEBUG**: Detailed debugging information
- **INFO**: General information (payment success, webhook received)
- **WARN**: Warning conditions (suspicious requests)
- **ERROR**: Error conditions (payment failures)
- **CRITICAL**: Critical errors (system failures)

### Log Categories

- **PAYMENT**: Payment creation, completion, failures
- **WEBHOOK**: Webhook events and processing
- **REFUND**: Refund operations
- **SECURITY**: Security events and violations
- **API**: External API calls and responses

### Log Structure

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "category": "PAYMENT",
  "message": "Payment completed successfully",
  "orderId": "ORDER-123",
  "paymentId": "pay_456",
  "userId": "user_789",
  "amount": 99.99,
  "currency": "USD",
  "gateway": "WESTERNBID",
  "duration": 1250,
  "metadata": {
    "transactionId": "txn_abc123"
  }
}
```

## Testing

### Development Testing

1. **Enable Mock Mode**:
   ```bash
   WESTERNBID_MOCK_MODE=true
   WESTERNBID_MOCK_SUCCESS_RATE=80
   ```

2. **Test Payment Flow**:
   - Create order via checkout
   - Process mock payment
   - Verify webhook handling
   - Check order status updates

3. **Test Security Features**:
   - Rate limiting
   - Invalid signatures
   - Payload validation

### Staging Testing

1. **Use WesternBid Sandbox**:
   ```bash
   WESTERNBID_ENVIRONMENT=sandbox
   WESTERNBID_MOCK_MODE=false
   ```

2. **Test Real API Integration**:
   - Create test payments
   - Process webhooks
   - Test refund functionality

### Production Checklist

- [ ] Valid production credentials configured
- [ ] Webhook endpoint accessible from WesternBid
- [ ] SSL certificate valid and trusted
- [ ] Security features enabled
- [ ] Monitoring and alerting configured
- [ ] Log retention policy implemented

## Troubleshooting

### Common Issues

#### Payment Creation Fails
```bash
# Check configuration
WESTERNBID_ENABLED=true
WESTERNBID_MERCHANT_ID=your-merchant-id
WESTERNBID_SECRET_KEY=your-secret-key

# Check logs
tail -f logs/payments/payment-$(date +%Y-%m-%d).log
```

#### Webhook Signature Verification Fails
```bash
# Verify webhook secret
echo $WESTERNBID_WEBHOOK_SECRET

# Check IP whitelisting
PAYMENT_ALLOWED_IPS=52.89.214.238,52.89.214.239

# Test signature generation
curl -X POST https://yoursite.com/api/webhooks/westernbid \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=your-signature" \
  -d '{"test": "payload"}'
```

#### Rate Limiting Issues
```bash
# Adjust rate limits
PAYMENT_RATE_LIMIT_MINUTE=20
PAYMENT_RATE_LIMIT_HOUR=200

# Check rate limit store
# (Implement admin endpoint to view current limits)
```

### Debug Mode

Enable debug logging for detailed troubleshooting:

```bash
PAYMENT_LOG_LEVEL=DEBUG
PAYMENT_LOG_CONSOLE=true
```

## Performance Considerations

### Optimization Tips

1. **Database Connections**: Use connection pooling
2. **Webhook Processing**: Process webhooks asynchronously
3. **Logging**: Use structured logging with log rotation
4. **Caching**: Cache payment configurations
5. **Monitoring**: Implement health checks and metrics

### Scaling Considerations

1. **Rate Limiting**: Use Redis for distributed rate limiting
2. **Logging**: Use centralized logging (ELK stack)
3. **Security**: Use WAF for additional protection
4. **Monitoring**: Implement APM tools

## Support & Maintenance

### Regular Maintenance

- Monitor log files for errors
- Review security events
- Update IP whitelists as needed
- Rotate webhook secrets periodically
- Monitor payment success rates

### Monitoring Alerts

Set up alerts for:
- Payment failure rate > 5%
- Webhook signature verification failures
- Rate limit violations
- API timeout errors
- Security events

## License & Compliance

This integration is designed to be:
- **PCI DSS Compliant**: No sensitive card data stored
- **GDPR Compliant**: Personal data handling guidelines
- **SOC 2 Compliant**: Security and availability controls

## Changelog

### Version 2.0.0 (Current)
- Enhanced security with signature verification
- Comprehensive logging system
- Multi-environment configuration
- Refund management API
- Rate limiting and IP whitelisting
- Mock mode for development

### Version 1.0.0 (Legacy)
- Basic payment processing
- Simple webhook handling
- Mock payment URLs

---

For additional support or questions, please refer to the WesternBid API documentation or contact the development team.
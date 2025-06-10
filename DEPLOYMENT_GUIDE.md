# 🚀 VobVorot Store - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying VobVorot Store to production on Vercel.

## Pre-deployment Checklist

- [ ] Database setup and accessible
- [ ] Environment variables configured
- [ ] WesternBid credentials (or mock mode enabled)
- [ ] Domain configured (vobvorot.com)
- [ ] Vercel CLI installed and authenticated

## Quick Deployment

```bash
# One-command deployment
npm run deploy:full

# Or step by step
npm run production:ready
npm run migrate:production
npm run deploy
```

## Detailed Deployment Steps

### 1. Environment Setup

Ensure `.env.production` is configured with all required variables:

```bash
# Copy from template
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

### 2. Database Migration

```bash
# With backup (recommended)
npm run migrate:production:backup

# Without backup
npm run migrate:production
```

### 3. Build Optimization

```bash
# Standard optimization
npm run build:optimize

# With bundle analysis
npm run build:analyze
```

### 4. Vercel Deployment

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
npm run deploy
```

### 5. Post-deployment Setup

#### Telegram Bot Webhook

Set your bot webhook URL:
```
https://vobvorot.com/api/telegram/webhook
```

#### Domain Configuration

1. Configure domain in Vercel dashboard
2. Add DNS records for vobvorot.com
3. SSL will be configured automatically

## Environment Variables

### Required Variables

```env
# Database
DATABASE_URL="your_postgres_url"
DIRECT_DATABASE_URL="your_direct_postgres_url"

# Authentication
NEXTAUTH_URL="https://vobvorot.com"
NEXTAUTH_SECRET="your_secure_secret"

# Telegram
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_BOT_USERNAME="VobvorotecomAdminBot"
OWNER_TELEGRAM_ID="your_telegram_id"

# Email
RESEND_API_KEY="your_resend_key"
FROM_EMAIL="noreply@vobvorot.com"

# Images
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### WesternBid Payment (Mock Mode)

For initial deployment, mock mode is enabled:

```env
WESTERNBID_MOCK_MODE=true
WESTERNBID_MOCK_SUCCESS_RATE=95
WESTERNBID_MERCHANT_ID="mock_merchant_vobvorot_2024"
WESTERNBID_SECRET_KEY="mock_secret_key_vobvorot_ultra_secure_2024_placeholder_32chars"
```

### Production Configuration

```env
NODE_ENV=production
VERCEL_ENV=production
NEXT_PUBLIC_SITE_URL=https://vobvorot.com
```

## Vercel Configuration

### Project Settings

1. **Framework Preset**: Next.js
2. **Build Command**: `npm run build`
3. **Output Directory**: `.next`
4. **Install Command**: `npm install`

### Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from `.env.production`
3. Set environment to "Production"

### Function Configuration

- API routes: 30s timeout
- Webhook endpoints: 30s timeout
- Database operations: 30s timeout

## Monitoring & Maintenance

### Health Check Endpoints

```bash
# Site health
curl https://vobvorot.com/api/health

# Database health
curl https://vobvorot.com/api/health/database
```

### Production Scripts

```bash
# Check production readiness
npm run production:ready

# Run integrity check
npm run integrity:check

# Monitor performance
npm run performance:monitor
```

### Backup Operations

```bash
# Create backup
npm run backup:create

# List backups
npm run backup:list

# Restore backup
npm run backup:restore
```

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build:optimize
```

#### Database Connection Issues

```bash
# Test database connection
npx prisma db pull

# Check migration status
npx prisma migrate status
```

#### Environment Variable Issues

```bash
# Validate environment
npm run production:ready

# Check Vercel environment
vercel env ls
```

### Error Recovery

#### Failed Deployment

1. Check build logs in Vercel dashboard
2. Verify environment variables
3. Test locally: `npm run build`
4. Redeploy: `vercel --prod`

#### Database Migration Failures

```bash
# Reset and redeploy migrations
npx prisma migrate reset --force
npm run migrate:production:backup
```

#### Payment System Issues

1. Check WesternBid configuration
2. Verify webhook endpoints
3. Test with mock mode first

## Security Checklist

- [ ] All secrets in environment variables
- [ ] No hardcoded credentials in code
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CSRF protection enabled
- [ ] Input validation on all endpoints

## Performance Optimization

### Monitoring

- [ ] Vercel Analytics enabled
- [ ] Error reporting configured
- [ ] Performance monitoring active

### Optimization

- [ ] Image optimization (Cloudinary)
- [ ] Bundle optimization
- [ ] Database indexing
- [ ] API response caching

## Success Indicators

✅ **Deployment Successful When:**

- Site loads at https://vobvorot.com
- Admin dashboard accessible
- Telegram bot responding
- Database operations working
- Email notifications sending
- Payment flow functional (mock mode)
- All health checks passing

## Next Steps After Deployment

1. **Test Full Order Flow**
   ```bash
   node test-full-order-cycle.js
   ```

2. **Configure Real Payment Credentials**
   - Update WesternBid credentials when available
   - Set `WESTERNBID_MOCK_MODE=false`

3. **Monitor and Optimize**
   - Watch Vercel Analytics
   - Monitor error rates
   - Optimize performance

4. **Scale and Enhance**
   - Add Instagram integration
   - Implement CRM integration
   - Enhance analytics

---

**Congratulations!** 🎉 Your VobVorot Store is now live and ready for business!

For support, check the logs or contact the development team.
# Telegram Webhook 401 Fix Guide

## Current Status

We've identified the issue with the Telegram webhook returning 401. Here's what we found:

### Key Findings

1. **Environment Variables Are Set**: TELEGRAM_WEBHOOK_SECRET is confirmed to be in Vercel's environment variables
2. **Deployment Timing Issue**: The current deployment was created BEFORE the environment variables were set
3. **Mysterious Response**: The webhook returns lowercase "unauthorized" instead of "Unauthorized" (capital U) that's in our code
4. **DNS Issue**: vobvorot.shop domain has no DNS configuration (NXDOMAIN)

### Root Cause

The main issue is that the currently deployed version doesn't have access to the TELEGRAM_WEBHOOK_SECRET environment variable because it was deployed before the variables were set.

## Solution Steps

### Step 1: Force New Deployment

Since the GitHub webhook doesn't seem to be triggering automatically, you need to manually deploy:

```bash
# Option 1: Using Vercel CLI (if you have access)
vercel --prod

# Option 2: Through Vercel Dashboard
# 1. Go to https://vercel.com/m3tmgmt-gmailcoms-projects/vobvorot-nextjs
# 2. Click "Redeploy" on the latest deployment
# 3. Make sure "Use existing Build Cache" is UNCHECKED
```

### Step 2: Test the Webhook

Once the new deployment is ready, test using the Vercel URL (not vobvorot.shop):

```bash
# Test with correct token
curl -X POST "https://vobvorot-nextjs.vercel.app/api/telegram/ai-assistant" \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: vobvorot_webhook_secret_2025" \
  -d '{
    "update_id": 123456789,
    "message": {
      "message_id": 1,
      "from": {
        "id": 316593422,
        "is_bot": false,
        "first_name": "Test",
        "username": "testuser"
      },
      "chat": {
        "id": 316593422,
        "first_name": "Test",
        "username": "testuser", 
        "type": "private"
      },
      "date": 1753793000,
      "text": "/start"
    }
  }'
```

### Step 3: Update Telegram Webhook URL

Once confirmed working, update the webhook in Telegram to use the Vercel URL:

```bash
curl -X POST "https://api.telegram.org/bot7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://vobvorot-nextjs.vercel.app/api/telegram/ai-assistant",
    "secret_token": "vobvorot_webhook_secret_2025"
  }'
```

### Step 4: Fix DNS (Optional)

To use vobvorot.shop domain, you need to configure DNS:

1. Add an A record pointing to Vercel's IP
2. Or add a CNAME record pointing to `cname.vercel-dns.com`
3. Configure the domain in Vercel project settings

## Debugging Tools Created

We've created several debugging tools:

1. **Test Simple Endpoint**: `/api/test-webhook-simple` - Shows environment variables
2. **Test Scripts**:
   - `test-webhook-vercel.sh` - Tests webhook with proper authentication
   - `test-webhook-headers.sh` - Shows full response headers
   - `test-webhook-detailed.sh` - Tests multiple authentication scenarios

## Important Notes

1. **Always use lowercase header**: `x-telegram-bot-api-secret-token` (not uppercase)
2. **The mysterious lowercase "unauthorized"** might be from Vercel's infrastructure layer
3. **Environment variables only apply to NEW deployments** after they're set

## Quick Test Commands

```bash
# Test if env vars are visible (after new deployment)
curl https://vobvorot-nextjs.vercel.app/api/test-webhook-simple

# Test webhook with authentication
./test-webhook-vercel.sh

# Check Telegram webhook status
curl https://api.telegram.org/bot7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI/getWebhookInfo
```

## Next Steps

1. Deploy a new version to apply environment variables
2. Test the webhook with the scripts provided
3. Update Telegram webhook URL to Vercel URL
4. (Optional) Configure DNS for custom domain
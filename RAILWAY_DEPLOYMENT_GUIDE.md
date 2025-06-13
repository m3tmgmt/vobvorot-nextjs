# Railway Deployment Guide for vobvorot-nextjs

## Project Overview
- **Repository**: https://github.com/m3tmgmt/vobvorot-nextjs
- **Branch**: main
- **Framework**: Next.js 15.3.3
- **Database**: Prisma with PostgreSQL (via Prisma Accelerate)
- **Current Railway Project**: quixotic-liquid
- **Target Domain**: vobvorot.com

## Prerequisites ✅
- [x] Railway CLI installed and authenticated (m3t.mgmt@gmail.com)
- [x] GitHub repository ready and up-to-date
- [x] Railway project linked (quixotic-liquid)
- [x] Nixpacks configuration ready
- [x] Environment variables prepared

## Deployment Steps

### 1. Railway Dashboard Setup
Visit: https://railway.app/dashboard

1. Navigate to **quixotic-liquid** project
2. Click **"Add Service"**
3. Select **"GitHub Repository"**
4. Choose **"m3tmgmt/vobvorot-nextjs"**
5. Set branch to **"main"**
6. Railway will auto-detect Next.js framework

### 2. Build Configuration
Railway will automatically use the included configuration files:

**nixpacks.toml**:
```toml
[phases.setup]
nixPkgs = ['nodejs_20']

[phases.build]
cmd = 'npm ci && npx prisma generate && npm run build'

[phases.start]
cmd = 'npm start'

[variables]
NODE_ENV = 'production'
```

**railway.json**:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 3. Environment Variables
Add these environment variables in Railway dashboard:

```env
NODE_ENV=production
NEXTAUTH_URL=https://vobvorot.com
NEXTAUTH_SECRET=vobvorot_super_secret_key_2024_production_ultra_secure_32_chars_minimum
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiMDFKWEI3R1JQOEFBQTZUODk4REFOTlI4QVgiLCJ0ZW5hbnRfaWQiOiI5NjAwOGM1MDMyZTg0ZTE3NjUzNWM2MzlmOTQ4ODkxZGMzZTU2YmFjYTJiZWNlOGRkNWI0ZGViOTFlMjcyNGYxIiwiaW50ZXJuYWxfc2VjcmV0IjoiNzgwMDFkNjgtNWI1Zi00ZmQzLWFkMTMtYmRkMDRlN2U3MDU2In0.MaCYMs1qji8lEoIuwP5sjrR7SdpjBqK_RUbd3nOD3Rs
DIRECT_DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiMDFKWEI3R1JQOEFBQTZUODk4REFOTlI4QVgiLCJ0ZW5hbnRfaWQiOiI5NjAwOGM1MDMyZTg0ZTE3NjUzNWM2MzlmOTQ4ODkxZGMzZTU2YmFjYTJiZWNlOGRkNWI0ZGViOTFlMjcyNGYxIiwiaW50ZXJuYWxfc2VjcmV0IjoiNzgwMDFkNjgtNWI1Zi00ZmQzLWFkMTMtYmRkMDRlN2U3MDU2In0.MaCYMs1qji8lEoIuwP5sjrR7SdpjBqK_RUbd3nOD3Rs
TELEGRAM_BOT_TOKEN=7274106590:AAEu0baVLztVQO9YdnCjvo9fcb3SnMFQNe8
TELEGRAM_BOT_USERNAME=VobvorotComAdminBot
OWNER_TELEGRAM_ID=316593422
RESEND_API_KEY=re_f1NakBBs_5pEfQ81rP2RMK4t3wLfcuGhH
FROM_EMAIL=noreply@vobvorot.com
ADMIN_EMAIL=admin@vobvorot.com
CLOUDINARY_CLOUD_NAME=dqi4iuyo1
CLOUDINARY_API_KEY=576232937933712
CLOUDINARY_API_SECRET=51NC1qSag-XbWCsRPi2-Lr0iW1E
GOOGLE_ANALYTICS_ID=G-964RJ1KRRZ
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-964RJ1KRRZ
NEXT_PUBLIC_SITE_URL=https://vobvorot.com
WESTERNBID_MERCHANT_ID=mock_merchant_vobvorot_2024
WESTERNBID_SECRET_KEY=mock_secret_key_vobvorot_ultra_secure_2024_placeholder_32chars
WESTERNBID_API_URL=https://api.westernbid.com
WESTERNBID_ENVIRONMENT=production
WESTERNBID_ENABLED=true
WESTERNBID_MOCK_MODE=true
WESTERNBID_WEBHOOK_SECRET=mock_webhook_secret_vobvorot_2024_secure_key
WESTERNBID_TIMEOUT=30000
WESTERNBID_RETRY_ATTEMPTS=3
WESTERNBID_MOCK_SUCCESS_RATE=95
PAYMENT_ENVIRONMENT=production
PAYMENT_SIGNATURE_VERIFICATION=true
PAYMENT_RATE_LIMITING=true
PAYMENT_ENABLE_REFUNDS=true
PAYMENT_MAX_REFUND_DAYS=30
PAYMENT_LOG_LEVEL=INFO
PAYMENT_LOG_FILE=true
PAYMENT_LOG_CONSOLE=false
PAYMENT_RATE_LIMIT_MINUTE=10
PAYMENT_RATE_LIMIT_HOUR=100
PAYMENT_MAX_PAYLOAD_SIZE=1048576
PAYMENT_NOTIFY_TELEGRAM=true
PAYMENT_NOTIFY_EMAIL=true
PAYMENT_NOTIFY_SLACK=false
TELEGRAM_WEBHOOK_SECRET=TG_vobvorot_webhook_secret_2024_secure_key_xyz789
ADMIN_API_KEY=ADMIN_vobvorot_api_key_2024_ultra_secure_access_token_abc123xyz
NEXT_PUBLIC_SENTRY_DSN=https://cd5360e1ca7ed31b6c92065e3838835e@o4509481370451968.ingest.us.sentry.io/4509481372876800
SENTRY_AUTH_TOKEN=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
TELEGRAM_OWNER_CHAT_ID=316593422,1837334996
SESSION_SECRET=your-session-secret-32-chars-minimum
CSRF_SECRET=your-csrf-secret-32-chars-minimum
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
ENABLE_LOGGING=true
ERROR_REPORTING=true
ENABLE_CACHING=true
CACHE_TTL=3600
```

### 4. Domain Configuration
After successful deployment:

1. **Railway Domain**: Copy the Railway-provided URL for testing
2. **Custom Domain**: Add `vobvorot.com` as a custom domain
3. **DNS Setup**: Point domain to Railway's provided CNAME/A records

### 5. Post-Deployment Verification

Check these endpoints after deployment:
- `/api/health` - Health check
- `/api/products` - Products API
- `/` - Home page
- `/admin` - Admin panel (if applicable)

### 6. WesternBid Payment Gateway
The configuration includes mock WesternBid setup:
- Mock mode enabled for testing
- 95% success rate configured
- Webhook endpoints ready
- All security configurations in place

### 7. Monitoring & Analytics
- **Sentry**: Error tracking configured
- **Google Analytics**: GA4 tracking setup
- **Railway Metrics**: Built-in monitoring available

## CLI Commands
If you need to use Railway CLI after service is created:

```bash
# Check status
railway status

# View logs
railway logs

# Set additional variables
railway variables set KEY=value

# Open project dashboard
railway open

# Redeploy
railway redeploy
```

## Expected Deployment URL
Once deployed, the application will be available at:
- **Railway URL**: `https://[service-name]-[project-hash].up.railway.app`
- **Custom Domain**: `https://vobvorot.com` (after DNS configuration)

## Troubleshooting
If deployment fails:
1. Check build logs in Railway dashboard
2. Verify all environment variables are set
3. Ensure Prisma database connection is working
4. Check nixpacks.toml configuration
5. Verify GitHub repository permissions

## Success Criteria
- ✅ Application builds successfully
- ✅ All environment variables configured
- ✅ Database connection established
- ✅ Custom domain configured
- ✅ WesternBid payment system ready
- ✅ Telegram bot integration working
- ✅ Email service operational

---

**Next Steps**: Visit https://railway.app/dashboard to complete the deployment process.
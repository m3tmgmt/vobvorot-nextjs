# VobVorot Store - Next.js E-commerce Platform

🛍️ Modern e-commerce platform with Y2K aesthetic and comprehensive admin management via Telegram bot.

## 🌟 Features

### 🛒 **E-commerce Core**
- **Full Product Catalog** - Categories, variants, inventory management
- **Shopping Cart & Wishlist** - Persistent across sessions
- **Secure Checkout** - WesternBid payment integration
- **Order Management** - Real-time status tracking
- **User Accounts** - Registration, profiles, order history
- **Product Reviews** - Customer feedback system

### 🎨 **Y2K Aesthetic Design**
- **Retro Visual Effects** - Matrix rain, glitch effects, neon glow
- **Interactive Elements** - Custom cursor, floating animations
- **Responsive Design** - Mobile-first approach
- **Dark/Light Themes** - Dynamic theme switching

### 🤖 **Telegram Bot Integration**
- **Admin CRM** - Complete store management via Telegram
- **Order Notifications** - Real-time order alerts
- **Inventory Management** - Stock tracking and alerts
- **Customer Support** - Direct communication tools
- **Analytics Dashboard** - Sales statistics and reports

### 🔐 **Security & Performance**
- **NextAuth.js** - Secure authentication
- **API Protection** - Rate limiting, validation, CSRF protection
- **Image Optimization** - Cloudinary integration with fallbacks
- **SEO Optimized** - Server-side rendering, meta tags, sitemaps
- **Production Ready** - Comprehensive error handling and logging

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17+ and npm
- PostgreSQL database (SQLite for development)
- Cloudinary account (for image management)
- Resend account (for email notifications)
- Telegram Bot (for admin management)
- WesternBid account (for payments)

### 1. Installation

```bash
# Clone the repository
git clone [repository-url]
cd vobvorot-nextjs

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Set up database
npx prisma db push
```

### 2. Environment Configuration

Create `.env.local` file:

```bash
# Database
DATABASE_URL="file:./dev.db"  # SQLite for development
# DATABASE_URL="postgresql://..." # PostgreSQL for production

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@yourdomain.com"
ADMIN_EMAIL="admin@yourdomain.com"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_BOT_USERNAME="your-bot-username"
OWNER_TELEGRAM_ID="your-telegram-user-id"
ADMIN_API_KEY="your-secure-admin-api-key"

# Payment (WesternBid)
WESTERNBID_MERCHANT_ID="your-merchant-id"
WESTERNBID_SECRET_KEY="your-secret-key"
WESTERNBID_MOCK_MODE="true"  # Set to false for production

# Google Analytics (Optional)
NEXT_PUBLIC_GA_ID="your-ga-id"

# Cloudflare API (For DNS automation)
CLOUDFLARE_API_TOKEN="your-cloudflare-token"
```

### 3. Database Setup

```bash
# Development (SQLite)
npx prisma db push
npx prisma db seed  # Optional: Add sample data

# Production (PostgreSQL)
npx prisma migrate deploy
npm run seed:production
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the store.

## 📖 Documentation

### 🏗️ **Project Structure**
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes
│   ├── checkout/          # Checkout flow
│   ├── products/          # Product pages
│   └── account/           # User account pages
├── components/            # React components
│   ├── cart/              # Cart components
│   ├── product/           # Product components
│   ├── ui/                # UI components
│   └── effects/           # Visual effects
├── lib/                   # Utility libraries
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Database client
│   ├── email.ts           # Email service
│   ├── telegram-bot.ts    # Telegram bot logic
│   └── westernbid.ts      # Payment integration
└── styles/                # Global styles
```

### 🔧 **Configuration Files**
- `next.config.ts` - Next.js configuration with security headers
- `prisma/schema.prisma` - Database schema
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration

## 🤖 Telegram Bot Setup

### 1. Create Bot
```bash
# Message @BotFather in Telegram
/newbot
# Follow instructions and save the token
```

### 2. Get Your Telegram ID
```bash
# Message @userinfobot to get your user ID
```

### 3. Configure Environment
```bash
TELEGRAM_BOT_TOKEN="your-bot-token"
OWNER_TELEGRAM_ID="your-user-id"
```

### 4. Available Commands
- `/start` - Access admin panel
- `/products` - Manage products
- `/orders` - View and manage orders
- `/stats` - View store statistics
- Photo upload - Upload images to Cloudinary

## 💳 Payment Integration

### WesternBid Setup
1. Register at WesternBid
2. Get merchant credentials
3. Configure webhook URL: `https://yourdomain.com/api/webhooks/westernbid`
4. Set environment variables

### Mock Mode (Development)
Set `WESTERNBID_MOCK_MODE="true"` to simulate payments without real transactions.

## 📧 Email Configuration

### Resend Setup
1. Create account at [Resend](https://resend.com)
2. Add and verify your domain
3. Get API key and configure environment variables

### Email Templates
- Order confirmations
- Password reset
- Order status updates
- Low stock alerts

## 🖼️ Image Management

### Cloudinary Integration
- Automatic optimization and resizing
- WebP format conversion
- CDN delivery
- Fallback image system

### Upload Methods
- Admin dashboard upload
- Telegram bot upload
- Bulk upload via API

## 🔒 Security Features

### API Security
- Rate limiting on all endpoints
- Request validation with Zod schemas
- CSRF protection
- Secure headers configuration

### Payment Security
- Webhook signature verification
- PCI DSS compliance considerations
- Secure payment data handling

### Data Protection
- Password hashing with bcryptjs
- Sensitive data sanitization in logs
- Environment variable validation

## 📊 Analytics & Monitoring

### Built-in Analytics
- Sales statistics
- Customer analytics
- Product performance
- Order tracking

### Google Analytics Integration
- Page views tracking
- E-commerce events
- Conversion tracking

### Logging System
- Structured JSON logging
- Sensitive data redaction
- Production-ready error handling

## 🚀 Deployment

### Prerequisites
- PostgreSQL database
- Domain name
- SSL certificate
- Environment variables configured

### Production Checklist
- [ ] Update `DATABASE_URL` to PostgreSQL
- [ ] Set `WESTERNBID_MOCK_MODE="false"`
- [ ] Configure domain in Resend
- [ ] Set up Cloudflare DNS (optional)
- [ ] Configure analytics
- [ ] Test all payment flows
- [ ] Verify email delivery
- [ ] Test Telegram bot

### Environment Variables for Production
```bash
NODE_ENV="production"
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://yourdomain.com"
WESTERNBID_MOCK_MODE="false"
# ... other production settings
```

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database
npm run db:seed      # Seed database with sample data
```

### Database Commands
```bash
npx prisma studio                    # Database GUI
npx prisma db push                   # Push schema changes
npx prisma migrate dev               # Create migration
npx prisma generate                  # Generate client
```

### Testing
```bash
# Test email functionality
node test-resend.js your-email@example.com

# Test Telegram bot
node telegram-bot.js

# Test payment webhook
curl -X POST localhost:3000/api/webhooks/westernbid \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 🎯 Features Roadmap

### Implemented ✅
- Complete e-commerce functionality
- Telegram bot admin system
- Email notifications
- Payment processing
- User authentication
- Product reviews
- Inventory management
- Y2K aesthetic design
- Security features
- Performance optimizations

### Future Enhancements 🔮
- Instagram integration
- Western Bid advanced features
- Multi-language support
- Advanced analytics
- Mobile app
- Subscription products
- Inventory automation
- Advanced search & filters

## 🤝 Contributing

### Code Style
- Use TypeScript for all new code
- Follow existing code patterns
- Add JSDoc comments for functions
- Use proper error handling
- Include tests for new features

### Commit Guidelines
- Use conventional commit format
- Include clear descriptions
- Test changes before committing

## 📞 Support

### Documentation
- **Setup Guide**: `/docs/setup.md`
- **API Documentation**: `/docs/api.md`
- **Telegram Bot Guide**: `/TELEGRAM_BOT_GUIDE.md`
- **Deployment Guide**: `/docs/deployment.md`

### Troubleshooting
- Check environment variables
- Verify database connections
- Test API endpoints
- Review logs for errors

## 📄 License

This project is proprietary software. All rights reserved.

---

**VobVorot Store** - Built with Next.js, powered by modern web technologies, managed through Telegram.

*For technical support or feature requests, contact the development team.*
#!/bin/bash

# Autonomous Resend Setup - Entry Point
echo "🤖 Autonomous Resend Setup for vobvorot.com"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if API keys are configured
if grep -q "GODADDY_API_KEY.*YOUR_GODADDY_API_KEY" .env.local 2>/dev/null || ! grep -q "GODADDY_API_KEY" .env.local 2>/dev/null; then
    echo "🔑 GoDaddy API keys not configured"
    echo "📋 Starting interactive setup..."
    node setup-api-keys.js
else
    echo "✅ API keys found, starting autonomous setup..."
    node autonomous-resend-setup.js
fi
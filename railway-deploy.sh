#!/bin/bash

# Railway deployment script for vobvorot-nextjs
set -e

echo "Setting up Railway deployment for vobvorot-nextjs..."

# Check if we're logged in
if ! railway whoami > /dev/null 2>&1; then
    echo "Please log in to Railway first: railway login"
    exit 1
fi

# Check current project status
echo "Current Railway status:"
railway status

# Try to add a service (requires manual intervention)
echo ""
echo "To complete deployment, please manually:"
echo "1. Visit https://railway.app/dashboard"
echo "2. Go to the quixotic-liquid project"
echo "3. Add a new service"
echo "4. Connect it to GitHub repository: m3tmgmt/vobvorot-nextjs"
echo "5. Set the branch to 'main'"
echo "6. Railway will automatically detect Next.js and use the nixpacks.toml configuration"

# Set environment variables
echo ""
echo "Setting up environment variables..."

# Key environment variables for Railway
railway variables set NODE_ENV=production
railway variables set DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiMDFKWEI3R1JQOEFBQTZUODk4REFOTlI4QVgiLCJ0ZW5hbnRfaWQiOiI5NjAwOGM1MDMyZTg0ZTE3NjUzNWM2MzlmOTQ4ODkxZGMzZTU2YmFjYTJiZWNlOGRkNWI0ZGViOTFlMjcyNGYxIiwiaW50ZXJuYWxfc2VjcmV0IjoiNzgwMDFkNjgtNWI1Zi00ZmQzLWFkMTMtYmRkMDRlN2U3MDU2In0.MaCYMs1qji8lEoIuwP5sjrR7SdpjBqK_RUbd3nOD3Rs"
railway variables set NEXTAUTH_URL=https://vobvorot.com
railway variables set NEXTAUTH_SECRET=vobvorot_super_secret_key_2024_production_ultra_secure_32_chars_minimum

echo ""
echo "Base environment variables set. You'll need to set the remaining variables manually in the Railway dashboard."
echo "Deployment script preparation complete!"
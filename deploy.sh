#!/bin/bash

# Manual deployment script for Vercel
echo "Building project locally..."
npm run build

echo "Project built successfully!"
echo "Please manually deploy to Vercel:"
echo "1. Go to your Vercel dashboard"
echo "2. Import or redeploy your project"
echo "3. The changes should be live after deployment"
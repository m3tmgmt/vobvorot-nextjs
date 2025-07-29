#!/bin/bash

echo "=== Force Vercel Redeploy ==="
echo ""

# Создаем пустой коммит для форсирования redeploy
echo "Creating empty commit to force redeploy..."
git commit --allow-empty -m "chore: Force redeploy to apply updated environment variables"

# Пушим изменения
echo "Pushing to GitHub..."
git push

echo ""
echo "✅ Empty commit pushed to force new deployment"
echo ""
echo "Check deployment status at:"
echo "https://vercel.com/m3tmgmt-gmailcoms-projects/vobvorot-nextjs"
echo ""
echo "New deployment should pick up the updated TELEGRAM_WEBHOOK_SECRET environment variable"
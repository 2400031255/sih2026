#!/bin/bash
# ── AgriSync OS — Auto Deploy Script ──────────────────────

FIREBASE="$HOME/.npm-global/bin/firebase"
PROJECT="sih2026-1a32c"

echo ""
echo "🌾 AgriSync OS — Auto Deploy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Login check
echo ""
echo "📋 Step 1: Checking Firebase login..."
$FIREBASE projects:list --project $PROJECT > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "🔐 Not logged in. Opening browser for login..."
  $FIREBASE login
else
  echo "✅ Already logged in."
fi

# Step 2: Deploy hosting
echo ""
echo "🚀 Step 2: Deploying to Firebase Hosting..."
$FIREBASE deploy --only hosting --project $PROJECT

# Step 3: Deploy Firestore rules
echo ""
echo "🔒 Step 3: Deploying Firestore rules..."
$FIREBASE deploy --only firestore:rules --project $PROJECT

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deploy complete!"
echo "🌐 Live at: https://$PROJECT.web.app"
echo ""

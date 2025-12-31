#!/bin/bash
# FrozenShield Production Database Fix Script
# Run this on your production server after deployment

echo "🔍 Finding FrozenShield container..."
echo ""

# Find the container
CONTAINER=$(docker ps --filter "name=x0w0ck4sg8sg4sk08skogkog" --format "{{.Names}}" | head -n 1)

if [ -z "$CONTAINER" ]; then
    echo "❌ Error: Could not find FrozenShield container"
    echo ""
    echo "Available containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
    exit 1
fi

echo "✓ Found container: $CONTAINER"
echo ""

# Check if db-diagnostic.js exists in container
echo "🔍 Checking if diagnostic script exists..."
docker exec $CONTAINER ls -la db-diagnostic.js 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Error: db-diagnostic.js not found in container"
    echo "   The new deployment may not have completed yet."
    echo "   Wait for Coolify to finish deploying, then try again."
    exit 1
fi

echo "✓ Diagnostic script found"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Running database diagnostic and cleanup..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run the diagnostic with clean and create-admin flags
docker exec $CONTAINER node db-diagnostic.js --clean --create-admin

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Done! You can now login at:"
echo "https://frozenshield.ca/admin/login.html"
echo ""
echo "Credentials:"
echo "  Email:    admin@frozenshield.ca"
echo "  Password: AdminPass123!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

#!/usr/bin/env bash
# Build the web app and upload it to the production server.
# Caddy (ticketoff-backend deploy/Caddyfile) serves /opt/ticketoff/web on ticketoff.store.
#
# Usage: scripts/deploy.sh
# Env:   DEPLOY_HOST (default ubuntu@84.235.162.78), DEPLOY_KEY (default ~/.ssh/ticketoff_ed25519),
#        DEPLOY_PATH (default /opt/ticketoff/web), VITE_API_BASE_URL (default https://api.ticketoff.store)
set -euo pipefail

cd "$(dirname "$0")/.."

DEPLOY_HOST="${DEPLOY_HOST:-ubuntu@84.235.162.78}"
DEPLOY_KEY="${DEPLOY_KEY:-$HOME/.ssh/ticketoff_ed25519}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/ticketoff/web}"
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://api.ticketoff.store}"

# The exported VITE_API_BASE_URL wins over .env.local (dev proxy settings).
npm ci
npm run build
test -f dist/index.html

SSH="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes"
$SSH "$DEPLOY_HOST" "mkdir -p '$DEPLOY_PATH'"
# --delay-updates: files are swapped in at the end, so visitors do not get a half-uploaded app.
rsync -az --delete --delay-updates -e "$SSH" dist/ "$DEPLOY_HOST:$DEPLOY_PATH/"

echo "Deployed $(git rev-parse --short HEAD) to https://ticketoff.store"

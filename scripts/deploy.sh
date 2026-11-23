#!/usr/bin/env bash
# Build the web app and upload it to the production server.
# Caddy (ticketoff-backend deploy/Caddyfile) serves /opt/ticketoff/web on ticketoff.store.
#
# Usage: scripts/deploy.sh
# Env:   DEPLOY_HOST (default ubuntu@84.235.162.78), DEPLOY_KEY (default ~/.ssh/ticketoff_ed25519),
#        DEPLOY_PATH (default /opt/ticketoff/web), VITE_API_BASE_URL (default https://api.ticketoff.store),
#        VITE_GA4_ID (default G-C41HW7NWVK, the GA4 measurement ID; not a secret)
set -euo pipefail

cd "$(dirname "$0")/.."

# Deploy only committed code, so the site always matches a commit.
# CLAUDE.md is a local, untracked helper file and does not affect the build.
if [ -n "$(git status --porcelain -- . ':(exclude)CLAUDE.md')" ]; then
  echo "Working tree not clean; commit or stash first." >&2
  exit 1
fi
git fetch -q origin main || echo "Warning: could not fetch origin/main." >&2
if ! git merge-base --is-ancestor HEAD origin/main 2>/dev/null; then
  echo "Warning: HEAD $(git rev-parse --short HEAD) is not in origin/main (deploying an unmerged branch)." >&2
fi

DEPLOY_HOST="${DEPLOY_HOST:-ubuntu@84.235.162.78}"
DEPLOY_KEY="${DEPLOY_KEY:-$HOME/.ssh/ticketoff_ed25519}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/ticketoff/web}"
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://api.ticketoff.store}"
export VITE_GA4_ID="${VITE_GA4_ID:-G-C41HW7NWVK}"

# The exported VITE_API_BASE_URL and VITE_GA4_ID win over .env.local (dev proxy settings).
npm ci
npm run build
test -f dist/index.html

SSH="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes"
$SSH "$DEPLOY_HOST" "mkdir -p '$DEPLOY_PATH'"
# --delay-updates: files are swapped in at the end, so visitors do not get a half-uploaded app.
# 'P /assets/**': old hashed chunks are kept, so tabs opened before this deploy can still load them.
rsync -az --delete --filter='P /assets/**' --delay-updates -e "$SSH" dist/ "$DEPLOY_HOST:$DEPLOY_PATH/"

echo "Deployed $(git rev-parse --short HEAD) to https://ticketoff.store"

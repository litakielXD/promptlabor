#!/usr/bin/env bash
set -euo pipefail

REMOTE_USER_HOST="${REMOTE_USER_HOST:-lita@mondschule.de}"
REMOTE_PATH="${REMOTE_PATH:-/var/www/mondschule.de/public_html/promptlabor}"

DELETE_FLAG=""
if [[ "${1:-}" == "--delete" ]]; then
  DELETE_FLAG="--delete"
fi

export NEXTAUTH_URL="${NEXTAUTH_URL:-https://mondschule.de/promptlabor}"
export NEXT_PUBLIC_BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-/promptlabor}"

npm run build

rsync -az ${DELETE_FLAG} \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='node_modules/' \
  --exclude='.next/cache/' \
  --exclude='dev.db' \
  --exclude='prisma/dev.db' \
  --exclude='public/uploads/' \
  --exclude='.git/' \
  --exclude='*.log' \
  ./ "${REMOTE_USER_HOST}:${REMOTE_PATH}/"

echo "Deployment abgeschlossen: https://mondschule.de/promptlabor/"
echo "Auf dem Server danach bei Code-/Dependency-Aenderungen ausfuehren:"
echo "  cd ${REMOTE_PATH}"
echo "  npm ci --omit=dev"
echo "  pm2 restart promptlabor --update-env"

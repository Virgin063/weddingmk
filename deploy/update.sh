#!/usr/bin/env bash
set -euo pipefail

cd /var/www/weddingmk
git pull origin main
npm install --production
pm2 restart weddingmk
echo "Готово: $(date)"

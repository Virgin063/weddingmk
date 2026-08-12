#!/bin/bash
# Запуск на VPS: сайт приглашения 24/7 через PM2
set -e

APP_DIR="${1:-/var/www/weddingmk}"
cd "$APP_DIR"

mkdir -p logs data

if [ ! -f .env ]; then
  echo "Создайте .env из .env.example и задайте ADMIN_CODE, SESSION_SECRET"
  exit 1
fi

npm install --production

pm2 delete weddingmk 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "Чтобы сайт поднимался после перезагрузки сервера, выполните команду, которую выведет:"
echo "  pm2 startup"
echo ""
pm2 startup || true

pm2 status
echo ""
echo "Ссылки (24/7 после настройки nginx на порт 8080):"
echo "  http://193.233.91.241/          — приглашение"
echo "  http://193.233.91.241/admin      — админка"
echo "  http://193.233.91.241/stats      — статистика"
echo "  http://193.233.91.241/hatidja/   — открытка"

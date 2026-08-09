#!/usr/bin/env bash
# Автоустановка на Ubuntu VPS
# Использование: sudo bash deploy/install.sh ваш-домен.ru

set -euo pipefail

DOMAIN="${1:-}"
APP_DIR="/var/www/weddingmk"
REPO="https://github.com/Virgin063/weddingmk.git"

if [[ $EUID -ne 0 ]]; then
  echo "Запустите от root: sudo bash deploy/install.sh ваш-домен.ru"
  exit 1
fi

if [[ -z "$DOMAIN" ]]; then
  echo "Укажите домен: sudo bash deploy/install.sh wedding-mk.ru"
  exit 1
fi

echo "==> Обновление системы..."
apt update && apt upgrade -y

echo "==> Установка пакетов..."
apt install -y curl git nginx certbot python3-certbot-nginx

if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi

echo "==> Клонирование репозитория..."
mkdir -p /var/www
if [[ -d "$APP_DIR/.git" ]]; then
  cd "$APP_DIR" && git pull origin main
else
  git clone "$REPO" "$APP_DIR"
fi

cd "$APP_DIR"
npm install --production

# Продакшен .env для HTTPS
if ! grep -q "COOKIE_SECURE=true" .env 2>/dev/null; then
  cat >> .env <<'EOF'
NODE_ENV=production
COOKIE_SECURE=true
EOF
fi

echo "==> Запуск PM2..."
pm2 delete weddingmk 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup

echo "==> Настройка Nginx..."
sed "s/ваш-домен.ru/${DOMAIN}/g; s/www.ваш-домен.ru/www.${DOMAIN}/g" \
  deploy/nginx.conf.example > /etc/nginx/sites-available/weddingmk

ln -sf /etc/nginx/sites-available/weddingmk /etc/nginx/sites-enabled/weddingmk
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx

echo "==> SSL-сертификат..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "admin@${DOMAIN}" || {
  echo "SSL не выдан (проверьте DNS). Сайт доступен по http://${DOMAIN}"
}

pm2 restart weddingmk

echo ""
echo "============================================"
echo "  Готово!"
echo "  Сайт:   https://${DOMAIN}"
echo "  Админ:  https://${DOMAIN}/admin"
echo "  Пароль: 260626MK"
echo "============================================"

#!/usr/bin/env bash
# Установка без домена — только по IP
# Использование: sudo bash deploy/install-ip.sh

set -euo pipefail

APP_DIR="/var/www/weddingmk"
REPO="https://github.com/Virgin063/weddingmk.git"

if [[ $EUID -ne 0 ]]; then
  echo "Запустите от root: sudo bash deploy/install-ip.sh"
  exit 1
fi

echo "==> Обновление системы..."
apt update && apt upgrade -y

echo "==> Установка пакетов..."
apt install -y curl git nginx

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

echo "==> Настройка .env для HTTP (без домена)..."
cat > .env <<'EOF'
PORT=8080
SESSION_SECRET=weddingmk-session-virgin063-2026
ADMIN_CODE=260626MK
EOF

echo "==> Запуск PM2..."
pm2 delete weddingmk 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup

echo "==> Настройка Nginx..."
cp deploy/nginx-ip.conf /etc/nginx/sites-available/weddingmk
ln -sf /etc/nginx/sites-available/weddingmk /etc/nginx/sites-enabled/weddingmk
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx

# Открыть порты если ufw включён
if command -v ufw &>/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp
  ufw allow 22/tcp
fi

IP=$(curl -4 -s ifconfig.me || hostname -I | awk '{print $1}')

echo ""
echo "============================================"
echo "  Готово!"
echo "  Сайт:   http://${IP}"
echo "  Админ:  http://${IP}/admin"
echo "  Пароль: 260626MK"
echo "============================================"

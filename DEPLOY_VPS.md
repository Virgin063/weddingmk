# Публикация на своём сервере (VPS)

Пошаговая инструкция для Ubuntu 22.04 / 24.04 (Timeweb, Selectel, DigitalOcean, Hetzner и т.д.).

## Что получится

| | |
|---|---|
| Сайт | `https://ваш-домен.ru` |
| Админка | `https://ваш-домен.ru/admin` |
| Пароль | `260626MK` |

---

## Что нужно заранее

1. **VPS** с Ubuntu (от 512 MB RAM, лучше 1 GB)
2. **Домен** (например `wedding-mk.ru`) — A-запись на IP сервера
3. **SSH-доступ** к серверу (логин + пароль или ключ)

---

## Шаг 1. Подключитесь к серверу

На Mac в терминале:

```bash
ssh root@ВАШ_IP_СЕРВЕРА
```

(или `ssh ubuntu@...` — как дал хостинг)

---

## Шаг 2. Установите Node.js, Nginx, Git

```bash
apt update && apt upgrade -y
apt install -y curl git nginx

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

node -v   # должно быть v20.x
npm -v
```

---

## Шаг 3. Скачайте сайт с GitHub

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/Virgin063/weddingmk.git
cd weddingmk
npm install --production
```

Файл `.env` уже в репозитории — менять ничего не нужно.

Проверка (сервер должен запуститься):

```bash
npm start
```

Откройте в браузере `http://ВАШ_IP:8080` — если сайт открылся, нажмите `Ctrl+C` и идём дальше.

---

## Шаг 4. Запуск через PM2 (чтобы работал всегда)

```bash
npm install -g pm2
cd /var/www/weddingmk
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

Последняя команда выдаст строку — скопируйте и выполните её (для автозапуска после перезагрузки).

---

## Шаг 5. Nginx (домен без порта :8080)

Замените `ваш-домен.ru` на свой домен:

```bash
nano /etc/nginx/sites-available/weddingmk
```

Вставьте содержимое из файла `deploy/nginx.conf.example` (замените домен).

```bash
ln -sf /etc/nginx/sites-available/weddingmk /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Сайт откроется по `http://ваш-домен.ru`

---

## Шаг 6. HTTPS (бесплатный сертификат)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d ваш-домен.ru -d www.ваш-домен.ru
```

Следуйте подсказкам. Certbot сам настроит HTTPS.

**Важно:** в `.env` на сервере должно быть `COOKIE_SECURE=true` (уже есть в репозитории для продакшена — проверьте):

```bash
nano /var/www/weddingmk/.env
```

```env
PORT=8080
NODE_ENV=production
COOKIE_SECURE=true
SESSION_SECRET=weddingmk-session-virgin063-2026
ADMIN_CODE=260626MK
```

```bash
pm2 restart weddingmk
```

---

## Шаг 7. Проверка

- Сайт: `https://ваш-домен.ru`
- Админка: `https://ваш-домен.ru/admin`
- Пароль: **260626MK**

---

## Обновление сайта после правок

На сервере:

```bash
cd /var/www/weddingmk
bash deploy/update.sh
```

Или вручную:

```bash
git pull
npm install --production
pm2 restart weddingmk
```

---

## Полезные команды

```bash
pm2 status              # статус
pm2 logs weddingmk        # логи
pm2 restart weddingmk     # перезапуск
systemctl status nginx   # nginx
```

---

## Если админка не пускает

1. Убедитесь, что открываете **свой домен**, а не `github.io`
2. Проверьте `.env`: `ADMIN_CODE=260626MK`, `COOKIE_SECURE=true`
3. Перезапустите: `pm2 restart weddingmk`
4. Смотрите логи: `pm2 logs weddingmk`

---

## Быстрая установка одним скриптом (опционально)

Если домен уже указывает на сервер:

```bash
curl -fsSL https://raw.githubusercontent.com/Virgin063/weddingmk/main/deploy/install.sh | sudo bash -s -- ваш-домен.ru
```

Скрипт установит всё автоматически. После — проверьте сайт и админку.

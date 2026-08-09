# Публикация на своём сервере (VPS)

## Без домена — только IP (ваш случай)

Сервер: **193.233.91.241** · Ubuntu 22.04

### 1. Дождитесь активации VPS

В панели статус должен стать **«работает»**, не «активация».

### 2. Подключитесь по SSH

На Mac в терминале (пароль — из панели хостинга, кнопка «скопировать»):

```bash
ssh root@193.233.91.241
```

При первом подключении напишите `yes`.

### 3. Установите сайт одной командой

На сервере:

```bash
git clone https://github.com/Virgin063/weddingmk.git /var/www/weddingmk
cd /var/www/weddingmk
bash deploy/install-ip.sh
```

Если `git clone` уже делали раньше:

```bash
cd /var/www/weddingmk
git pull
bash deploy/install-ip.sh
```

### 4. Откройте в браузере

| | |
|---|---|
| Сайт | **http://193.233.91.241** |
| Открытка для невесты | **http://193.233.91.241/hatidja** |
| Админка | **http://193.233.91.241/admin** |
| Пароль | **260626MK** |

> Без домена сайт работает по **HTTP** (не HTTPS). Для свадебного приглашения это нормально.

---

## С доменом (позже, если захотите)

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

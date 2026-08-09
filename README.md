# Сайт-приглашение на свадьбу

## Публикация на своём сервере (рекомендуется)

Полная инструкция: **[DEPLOY_VPS.md](DEPLOY_VPS.md)**

Кратко:

1. Арендуете VPS (Ubuntu) + домен
2. Подключаетесь по SSH
3. Клонируете репозиторий и запускаете

```bash
git clone https://github.com/Virgin063/weddingmk.git /var/www/weddingmk
cd /var/www/weddingmk
npm install --production
npm install -g pm2
pm2 start deploy/ecosystem.config.cjs
pm2 save && pm2 startup
```

4. Настраиваете Nginx + SSL (см. DEPLOY_VPS.md)

| | |
|---|---|
| Сайт | `https://ваш-домен.ru` |
| Админка | `https://ваш-домен.ru/admin` |
| Пароль | `260626MK` |

## Локально на Mac

```bash
npm install
npm start
```

http://localhost:8080 · админ: http://localhost:8080/admin

## GitHub Pages

[virgin063.github.io/weddingmk](https://virgin063.github.io/weddingmk) — только просмотр сайта. **Админка там не работает** (нет сервера).

# Сайт-приглашение на свадьбу

Готово к публикации: клонируйте репозиторий, запустите — всё уже настроено.

## Админ-панель

| | |
|---|---|
| URL | `/admin` |
| Пароль | `260626MK` |

## Локальный запуск

```bash
npm install
npm start
```

Сайт: http://localhost:8080

## Деплой на Render (бесплатно, без настроек)

1. Зайдите на [render.com](https://render.com) → **New** → **Blueprint**
2. Подключите репозиторий `Virgin063/weddingmk`
3. Render подхватит `render.yaml` автоматически
4. Нажмите **Apply** — через 2–3 минуты сайт будет онлайн

Переменные окружения уже в `.env` внутри репозитория — ничего дописывать не нужно.

## Деплой на VPS

```bash
git clone https://github.com/Virgin063/weddingmk.git
cd weddingmk
npm install --production
npm start
```

Для постоянной работы:

```bash
npm install -g pm2
pm2 start server.js --name weddingmk
pm2 save
pm2 startup
```

## Обновление на GitHub

```bash
git add .
git commit -m "обновление"
git push
```

На Render после push сайт обновится сам.

## Важно

- Фото в галерее — по ссылкам (URL), загружайте на imgur / Google Drive / хостинг и вставляйте в админке
- На бесплатном Render изменения в админке могут сброситься после перезапуска сервера (диск временный). Тексты и фото лучше один раз настроить локально и закоммитить `data/config.json`

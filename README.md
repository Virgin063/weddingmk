# Сайт-приглашение на свадьбу

## Два способа публикации

| | GitHub Pages | Render (нужен для админки) |
|---|---|---|
| Сайт для гостей | ✅ [virgin063.github.io/weddingmk](https://virgin063.github.io/weddingmk) | ✅ |
| Админ-панель `/admin` | ❌ не работает | ✅ работает |
| Пароль админки | — | `260626MK` |

**GitHub Pages** — только статика (HTML/CSS). Вход в админку там **никогда не заработает**, это ограничение GitHub, не баг.

## Админка онлайн (Render, 5 минут)

1. [render.com](https://render.com) → войти через GitHub
2. **New** → **Blueprint**
3. Репозиторий `Virgin063/weddingmk` → **Apply**
4. Дождаться деплоя → открыть ссылку вида `https://weddingmk-xxxx.onrender.com/admin`
5. Пароль: **260626MK**

Изменения в админке на Render сохраняются на сервере. Чтобы они появились на GitHub Pages — скопируйте `data/config.json` и сделайте `git push`.

## Локально

```bash
npm install
npm start
```

Сайт: http://localhost:8080 · Админ: http://localhost:8080/admin

## Обновление GitHub Pages

После правок в `data/config.json`:

```bash
git add data/config.json
git commit -m "Обновить контент"
git push
```

Сайт на GitHub Pages обновится через 1–2 минуты.

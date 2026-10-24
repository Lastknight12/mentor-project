# CineScope

Кіносайт із каталогом фільмів, пошуком, фільтрами, трейлерами, обраним і рецензіями.

Frontend звертається лише до власного backend. Backend проксіює TMDB API, кешує відповіді та зображення, зберігає користувачів, обране й рецензії та повертає фронтенду один готовий обʼєкт фільму.

## Стек

- Frontend: React 19, Vite, React Router
- Backend: Node.js, Express
- Авторизація: JWT, bcrypt
- Дані користувачів: JSON-сховище `backend/data/store.json`
- TMDB: API-проксі, TTL-кеш у памʼяті, дискове кешування зображень
- Без ключа TMDB сайт працює на вбудованому демо-каталозі

## Запуск

Потрібен Node.js 20+.

```bash
npm run install:all
```

Створіть `backend/.env` на основі `backend/.env.example`:

```env
PORT=3001
JWT_SECRET=your-long-random-secret
TMDB_API_KEY=your-v3-api-key
TMDB_ACCESS_TOKEN=your-v4-read-access-token
CACHE_TTL_SECONDS=600
CORS_ORIGIN=http://localhost:5173
```

Достатньо заповнити або `TMDB_API_KEY`, або `TMDB_ACCESS_TOKEN`. Без них backend автоматично використовує демо-каталог.

Запуск у режимі розробки:

```bash
npm run dev
```

- Сайт: `http://localhost:5173`
- API: `http://localhost:3001/api`

Збірка та запуск однією командою:

```bash
npm run build
npm start
```

Після збірки Express віддає frontend і API на `http://localhost:3001`.

## Основні можливості

- Головна сторінка з hero-блоком, каталогом, пагінацією, хедером і футером
- Пошук за назвою
- Фільтри за жанром, роком і рейтингом
- Сортування за популярністю, рейтингом, роком і назвою
- Сторінка фільму: постер, опис, жанри, рік, рейтинг, тривалість, трейлер, актори
- Обране для авторизованих користувачів
- Рецензії, середня оцінка глядачів і форма відгуку
- Реєстрація, вхід і JWT-сесія
- Адаптивний інтерфейс

## API

| Метод | Маршрут | Опис |
| --- | --- | --- |
| GET | `/api/health` | Стан API та режим даних |
| POST | `/api/auth/register` | Реєстрація |
| POST | `/api/auth/login` | Вхід |
| GET | `/api/auth/me` | Поточний користувач |
| GET | `/api/movies` | Каталог із фільтрами та пагінацією |
| GET | `/api/movies/search` | Пошук фільмів |
| GET | `/api/movies/genres` | Список жанрів |
| GET | `/api/movies/:id` | Деталі фільму, трейлер, рецензії та обране |
| GET | `/api/movies/:id/reviews` | Рецензії фільму |
| POST | `/api/movies/:id/reviews` | Створити або оновити рецензію |
| GET | `/api/favorites` | Обране користувача |
| POST | `/api/favorites/:movieId` | Додати в обране |
| DELETE | `/api/favorites/:movieId` | Прибрати з обраного |

## Структура

```text
backend/
  src/
    server.js
    catalogue.js
    tmdb.js
    cache.js
    store.js
    media.js
    routes/
frontend/
  src/
    pages/
    components/
    api.js
    auth.jsx
```

## Примітка TMDB

Дані про фільми надає TMDB. Цей продукт використовує TMDB API, але не схвалений і не сертифікований TMDB.

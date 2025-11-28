# Daily Buddies

Daily Buddies is a playful parent/child chore companion. The backend is an Express API with Prisma + SQLite, and the mobile app is built with Expo Router + React Native.

![Daily Buddies Screenshot](https://i.imgur.com/fmpwb6Y.jpeg)

## Features

- Parent dashboard to manage kids, assign one-off tasks, and build reusable routines
- Kid-friendly task list with streak rewards, points, and completion tracking
- Starter routines, daily streak rewards, and tone-based avatars for quick personalization

## Requirements

- Node.js 22+

## Project Structure

```
.
├── api/                 # Express API (entry: api/src/server.ts)
│   ├── src/             # Routes, middleware, services
│   ├── prisma/          # Prisma schema, migrations, seed data
│   └── tests/           # Backend unit tests (Vitest)
└── mobile/             # Expo Router app
    ├── app/(auth)/     # Login/register screens
    ├── app/(app)/      # Main parent/child screens (home, profile, tasks, family hub, etc.)
    └── src/            # Shared auth context, API client, config
```

Backend entry point: `api/src/server.ts`  
Mobile entry point: `mobile/app/_layout.tsx`

## Getting Started

```bash
git clone https://github.com/eimg/daily-buddies.git
```

```bash
# API
cd daily-buddies/api
cp .env.example .env   # includes DATABASE_URL for Prisma + default JWT secret
# (edit .env if you want a different DB location or secret)
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev         # starts the API on http://localhost:4000
```

```bash
# Mobile App
cd daily-buddies/mobile
npm install
npm start           # run Expo dev build (press i for iOS simulator, a for Android)
```

> Note: The app now requires an Expo Dev Client build (Expo Go is no longer sufficient). If you don't have one installed on your device/simulator, run `expo run:ios --device` or `expo run:android --device` once to install the dev client, then use `npm start` and press `i`/`a` to launch it.

## API Tests

```bash
npm test
```

## Environment Variables

- `api/.env.example` ships with sane defaults (`DATABASE_URL="file:./dev.db"`, `PORT=4000`, `JWT_SECRET="change-me"`).
- Copy it to `api/.env` before running any Prisma commands so migrations can create the SQLite database.  
  Customize those values if you plan to use a different database or secret in your own environment.

## Test Accounts (seed data)

| Role   | Username | Email            | Password    |
|--------|----------|------------------|-------------|
| Parent | maya     | maya@example.com | parentpass  |
| Child  | luna     | luna@example.com | lunapass    |
| Child  | theo     | (none)           | theopass    |

Use these after running `npx prisma db seed`.

## License

MIT – see [LICENSE.md](LICENSE.md).

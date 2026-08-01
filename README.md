# CampusDesk

CampusDesk is a campus resource booking app. Students sign in with email OTP, browse available resources, book time slots, and manage their bookings. Admins can manage resources and review bookings from a separate dashboard. The server also sends booking reminders and marks finished approved bookings as completed.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios
- Backend: Node.js, Express, TypeScript, Prisma
- Database: PostgreSQL
- Email and background jobs: Nodemailer, node-cron
- Auth: JWT

## Features

- Email OTP login
- Resource search and booking
- Booking schedule view
- Booking reminders sent one hour before start time
- Automatic completion of expired approved bookings
- Admin resource management
- Admin booking management

## Installation

1. Install dependencies in both apps:

	```bash
	cd server
	npm install

	cd ../client
	npm install
	```

2. Start PostgreSQL locally or point `DATABASE_URL` at a running database, then configure the server `.env` file.

## Environment Variables

Server `.env`:

- `DATABASE_URL`
- `PORT`
- `JWT_SECRET`

The client currently uses the API URL directly in the source, so it does not require a separate environment file.

## Run Locally

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend:

```bash
cd client
npm run dev
```

## Database Migration

Run Prisma migrations from the server folder:

```bash
cd server
npx prisma migrate dev
```

This command needs a running PostgreSQL database. If `localhost:5432` is not available, start Postgres first or update `DATABASE_URL` to a reachable host.

If you only need to apply existing migrations during deployment, use:

```bash
npx prisma migrate deploy
```

## Seed Data

No seed script is included yet. If you add one, place it under `server/prisma` and run it with Prisma's seed command.

## Deployment

- Deploy the server to a Node host such as Render, Railway, or Fly.io.
- Set `DATABASE_URL`, `PORT`, and `JWT_SECRET` in the server environment.
- Run Prisma migrations during deploy with `npx prisma migrate deploy`.
- Deploy the client to Vercel or Netlify and point it at the deployed API.
- Make sure the API URL in the client matches the deployed backend.

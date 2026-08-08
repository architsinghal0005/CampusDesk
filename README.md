# CampusDesk

CampusDesk is a full-stack campus resource booking system that allows students to reserve campus facilities such as seminar halls, labs, conference rooms, auditoriums, and sports facilities. It includes role-based authentication, booking conflict detection, and an admin dashboard for resource and booking management.

---

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM

### Database

- PostgreSQL (Neon or Local PostgreSQL)

### Authentication

- Email OTP (Console mode for development)
- JWT

### Deployment

- Frontend: Vercel
- Backend: Render

---

## Features

### Student

- Login using Email OTP
- Browse available campus resources
- Search and filter resources
- View resource schedules
- Book available time slots
- Prevent overlapping bookings
- View and cancel personal bookings

### Admin

- Separate Admin Login
- Add resources
- Edit resources
- Delete resources
- View all bookings
- Cancel bookings
- Filter bookings by resource, status, and date

### System

- Role-based authentication
- Booking conflict detection
- Automatic booking reminders
- Automatic completion of expired approved bookings

---

# Project Structure

```
CampusDesk
│
├── client
│   ├── src
│   └── ...
│
├── server
│   ├── prisma
│   ├── src
│   └── ...
│
└── README.md
```

---

# Installation

Clone the repository

```bash
git clone https://github.com/architsinghal0005/CampusDesk.git

cd CampusDesk
```

---

## Install Dependencies

### Backend

```bash
cd server

npm install
```

### Frontend

```bash
cd ../client

npm install
```

---

# Environment Variables

Create a `.env` file inside the **server** folder.

Example:

```env
DATABASE_URL=your_postgresql_database_url

PORT=5000

JWT_SECRET=your_jwt_secret

CLIENT_URL=http://localhost:5173

OTP_MODE=console
```

### Environment Variables

| Variable     | Description                        |
| ------------ | ---------------------------------- |
| DATABASE_URL | PostgreSQL connection string       |
| PORT         | Backend port                       |
| JWT_SECRET   | Secret used for JWT authentication |
| CLIENT_URL   | Frontend URL                       |
| OTP_MODE     | Use `console` during development   |

> **Note**
>
> OTP is printed in the backend console during development.
> For production, configure an email provider such as Resend or SMTP.

---

# Database Setup

Run Prisma migrations

```bash
cd server

npx prisma migrate dev
```

---

# Seed Database

Populate the database with sample resources.

```bash
npm run seed
```

---

# Run the Project

## Start Backend

```bash
cd server

npm run dev
```

Backend runs at

```
http://localhost:5000
```

---

## Start Frontend

```bash
cd client

npm run dev
```

Frontend runs at

```
http://localhost:5173
```

---

# Production Deployment

## Backend

Deploy to Render.

Environment Variables:

```
DATABASE_URL

JWT_SECRET

CLIENT_URL

OTP_MODE=console
```

Run migrations during deployment:

```bash
npx prisma migrate deploy
```

---

## Frontend

Deploy to Vercel.

Update the frontend API URL to point to the deployed backend.

---

# Live Demo

Frontend

```
https://campus-desk-sand.vercel.app
```

Backend

```
https://campusdesk-api.onrender.com
```

---

# Authentication

The application uses Email OTP authentication.

Development mode uses:

```
OTP_MODE=console
```

The generated OTP is printed in the backend console.

For production deployments, configure an email provider to send OTP emails.

---

# Design Document

Please refer to **[DESIGN.md](./DESIGN.md)** for:

- Overlap-check logic
- Double-booking race condition discussion
- Authentication persistence after refresh
- Debugging experience

---
#How you can get otp
 Steps:
 1. Open project locally in your code editor.Installation steps given above.
 2. ## Start Backend

```bash
cd server

npm install

npm run dev
```
3. ## Start Frontend

```bash
cd client
npm install
npm run dev
```
4. Now when you login by email you will get otp in cd server terminal.
5. After that you can sign in.

#Demo video link: https://drive.google.com/file/d/1OaMmswb6moncf5fI7OTiwVdrBDadnhlP/view?usp=sharing

# License

This project was created for educational purposes and hackathon submissions.

# LMS 2

Full-stack Learning Management System built with React, Tailwind CSS, Node.js, Express, MongoDB, Mongoose, JWT auth, and Socket.io.

## Structure

- `client` - React frontend
- `server` - Express backend with MongoDB models, APIs, uploads, and sockets

## Quick Start

1. Copy `.env.example` to `.env`
2. Install dependencies:
   - `npm run install:all`
3. Seed the database:
   - `npm run seed`
4. Start both apps:
   - `npm run dev`

## Default URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:7001`
- Live class provider: `https://localhost:3000`

## Seed Credentials

- Admin: `admin@lms.com / admin123`
- Instructor: `ava@lms.com / password123`
- Learner: `learner1@lms.com / password123`

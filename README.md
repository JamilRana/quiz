# Quiz & Exam Management SaaS

A production-ready Exam & Quiz Management platform built with Next.js 14, Prisma, PostgreSQL, and NextAuth.

## Features

- **Quiz Template System**: Create quizzes with multiple batches, each with independent settings
- **Question Types**: Single choice, Multiple choice, and Text answers
- **Exam Mode**: Strict mode with anti-cheating features
- **Anti-Cheating System**: IP locking, device fingerprinting, suspicious behavior detection
- **Leaderboard**: Real-time ranking with 5-second auto-refresh
- **Excel Import**: Bulk import questions from Excel files
- **Analytics Dashboard**: Live statistics with charts
- **Admin Authentication**: Secure admin panel with NextAuth

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, ShadCN UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Neon)
- **Authentication**: NextAuth.js
- **Charts**: Recharts
- **Validation**: Zod
- **Excel**: xlsx library

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon or local)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd quiz-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database URL and other settings:
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-chars
```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Run database migrations:
```bash
npx prisma db push
# or for production:
npx prisma migrate deploy
```

6. Seed the database (optional):
```bash
npm run db:seed
```

7. Build and run:
```bash
npm run build
npm start
```

### Development Mode

```bash
npm run dev
```

## Default Admin Credentials

After seeding:
- Email: `admin@example.com`
- Password: `admin123`

## Excel Import Format

Create an Excel file with these columns:

| question | type | marks | optionA | optionB | optionC | optionD | correctAnswers |
| -------- | ---- | ----- | ------- | ------- | ------- | ------- | -------------- |

- **type**: SINGLE, MULTIPLE, or TEXT
- **correctAnswers**: 
  - For SINGLE: A, B, C, or D
  - For MULTIPLE: A,B,C (comma-separated)
  - For TEXT: expected answer (optional)

## API Endpoints

### Public
- `GET /api/batches/slug/[slug]` - Get batch by slug
- `POST /api/responses/start` - Start a quiz
- `GET /api/responses/[id]` - Get exam questions
- `POST /api/responses/answer` - Save answer
- `POST /api/responses/[id]/submit` - Submit exam
- `GET /api/leaderboard/[batchId]` - Get leaderboard

### Admin (requires auth)
- `GET/POST /api/quizzes` - List/create quizzes
- `GET/PUT/DELETE /api/batches/[id]` - Manage batches
- `GET/POST /api/questions` - Manage questions
- `GET /api/responses` - List responses
- `POST /api/import` - Import from Excel
- `GET /api/dashboard/stats` - Dashboard stats

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Environment Variables for Vercel

```
DATABASE_URL=postgresql://neondb_owner:password@host/neondb?sslmode=require
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-generated-secret
```

### Neon Database

1. Create a Neon project
2. Get the connection string from Neon dashboard
3. Use the Pooler connection string for better performance

## Project Structure

```
app/
├── (admin)/              # Admin pages
│   ├── admin/
│   │   ├── dashboard/    # Main dashboard
│   │   ├── quizzes/      # Quiz management
│   │   ├── batches/      # Batch results
│   │   └── import/       # Excel import
│   └── login/            # Admin login
├── (public)/             # Public pages
│   └── quiz/[batchSlug]/ # Quiz pages
│       ├── start/        # Start exam
│       ├── exam/         # Take exam
│       └── submit/       # Submit confirmation
├── api/                  # API routes
│   ├── auth/            # NextAuth
│   ├── quizzes/         # Quiz CRUD
│   ├── batches/         # Batch CRUD
│   ├── responses/       # Response handling
│   ├── leaderboard/     # Leaderboard
│   └── import/          # Excel import
components/             # React components
lib/                    # Utilities
prisma/                 # Database schema
```

## License

MIT

# Trackit — AI-Powered Student Deadline Tracker

Trackit is a full-stack web application that helps university students manage assignments, track exams, and plan study sessions using AI. Upload your timetable, chat with an AI that knows your workload, and never miss a deadline again.

**Live Demo:** [trackit-app.vercel.app](https://trackit-2i0yr5y6d-ohm-kels-projects.vercel.app)

---

## Features

- **Task Management** — Create, edit, and track assignments with due dates, grade weights, effort estimates, and subtasks
- **Exam Countdown** — Monitor upcoming exams with confidence levels, preparation progress, and revision subtasks
- **AI Study Assistant** — Chat with Claude AI that sees your tasks, exams, and deadlines to give personalised advice
- **Timetable Upload** — Upload a PDF or image of your class schedule/exam timetable — AI parses and imports it automatically
- **Focus Plan** — Schedule-aware daily planner that assigns tasks to your free time windows between classes
- **Analytics** — Completion trends, workload distribution, and grade weight analysis
- **Export** — Download tasks and exams as CSV or PDF
- **Notifications** — Browser and in-app reminders for upcoming deadlines
- **Dark Mode** — Full dark theme with accent colour customisation
- **Onboarding Tour** — Guided walkthrough for new users

---

## Tech Stack

### Frontend
- **React 19** with Vite 7
- **Tailwind CSS v4** — utility-first styling
- **TanStack React Query v5** — data fetching and caching
- **React Router v7** — client-side routing with code splitting
- **Recharts** — analytics charts
- **Lucide React** — icon library
- **Vercel Analytics** — performance monitoring

### Backend
- **Node.js** with Express 5
- **Anthropic SDK** — Claude AI integration (chat + vision/document parsing)
- **Zod v4** — request validation
- **Supabase JS** — database and auth client

### Infrastructure
- **Supabase** — PostgreSQL database with Row Level Security + Auth
- **Vercel** — frontend hosting + serverless API functions

---

## Project Structure

```
deadline-tracker/
├── frontend/
│   └── src/
│       ├── pages/          # 14 page components (Dashboard, Tasks, Exams, Chat, etc.)
│       ├── components/     # Shared components (Layout, Sidebar, Toast, SubtaskList, etc.)
│       ├── hooks/          # React Query hooks (useTasks, useExams, useSubtasks, useProfile)
│       ├── api/            # API client functions
│       ├── context/        # Auth and Theme providers
│       ├── utils/          # Date helpers, export utilities
│       └── lib/            # Supabase client
├── backend/
│   ├── controllers/        # Business logic (tasks, exams, chat, subtasks, upload)
│   ├── routes/             # Express route definitions
│   ├── middleware/          # JWT auth middleware
│   └── index.js            # Express server entry point
├── supabase_schema.sql     # Initial database schema
├── supabase_migrations.sql # Additional tables (subtasks, chat_history)
└── vercel.json             # Deployment configuration
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [Anthropic API key](https://console.anthropic.com)

### 1. Clone the repo
```bash
git clone https://github.com/Ohm-Kel/trackit.git
cd trackit/deadline-tracker
```

### 2. Set up the database
Run both SQL files in your Supabase SQL Editor:
1. `supabase_schema.sql` — creates users, tasks, exams tables with RLS
2. `supabase_migrations.sql` — creates subtasks, chat_history tables

### 3. Configure environment variables

**Backend** — create `backend/.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-your-key
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Frontend** — create `frontend/.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

### 4. Install dependencies and run
```bash
# Backend
cd backend && npm install && npm start

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/tasks` | List / create tasks |
| GET/PATCH/DELETE | `/api/tasks/:id` | Get / update / delete task |
| GET/POST | `/api/exams` | List / create exams |
| GET/PATCH/DELETE | `/api/exams/:id` | Get / update / delete exam |
| GET/POST | `/api/subtasks` | List / create subtasks |
| PATCH/DELETE | `/api/subtasks/:id` | Update / delete subtask |
| POST | `/api/chat` | Send message to AI |
| GET/DELETE | `/api/chat/history` | Load / clear chat history |
| POST | `/api/upload/parse` | Parse document with AI vision |
| POST | `/api/upload/import-exams` | Bulk import parsed exams |
| POST | `/api/upload/save-schedule` | Save parsed weekly schedule |

All endpoints (except auth) require a Bearer token in the Authorization header.

---

## Deployment

The project is configured for Vercel:

1. Connect your GitHub repo to Vercel
2. Set the root directory to `deadline-tracker`
3. Add all environment variables in Vercel project settings
4. Deploy — Vercel handles the build and serverless functions automatically

---

## License

MIT

---

Built by [Ohm-Kel](https://github.com/Ohm-Kel)

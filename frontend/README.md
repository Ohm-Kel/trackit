# Trackit frontend

React 19 single-page app built with Vite. See the [project README](../README.md) for the full setup.

```bash
cp .env.example .env   # Supabase URL and anon key
npm ci
npm run dev            # http://localhost:5173
npm run lint
npm run build          # production build in dist/
```

| Folder | Contents |
|---|---|
| `src/pages` | Route-level pages, lazily loaded |
| `src/components` | Layout, notifications, toasts, onboarding |
| `src/hooks` | React Query hooks for tasks, exams, subtasks and profile |
| `src/api` | Fetch wrappers for the backend API |
| `src/context` | Auth and theme providers |
| `src/utils` | Date and export helpers |

In production the app calls the API at `/api` on the same origin (a Vercel rewrite, or the nginx proxy in Docker).

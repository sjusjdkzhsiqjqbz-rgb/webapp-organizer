# AGENTS.md — WebApp Organizer

## Project Overview

Personal organizer web application — monorepo with a React frontend and Express backend.

- **Client:** React 18 + TypeScript + Vite + Tailwind CSS
- **Server:** Express 4 + TypeScript + SQLite (better-sqlite3) + OpenAI SDK
- **Package manager:** npm (all packages)

---

## Directory Structure

```
webapp/
├── package.json           # Root orchestrator (concurrently to run client+server)
├── run.sh                 # Shell script: start/stop/restart/status
├── client/
│   ├── package.json
│   ├── vite.config.ts     # Vite config — dev on :5173, proxy /api → :3001
│   ├── tsconfig.json      # TS strict, bundler resolution, path alias @/* → src/*
│   ├── tsconfig.node.json # For vite.config.ts
│   ├── tailwind.config.js # Dark mode: class, custom primary palette (sky-blue)
│   ├── postcss.config.js  # tailwindcss + autoprefixer
│   ├── index.html
│   └── src/
│       ├── main.tsx           # Entry point (BrowserRouter, StrictMode)
│       ├── App.tsx            # Routes: /calendar, /diary, /chat, /settings
│       ├── index.css          # Tailwind directives + dark mode overrides
│       ├── components/
│       │   ├── Layout.tsx     # Sidebar nav (NavLink + Outlet), theme toggle
│       │   ├── CalendarView.tsx
│       │   ├── DiaryView.tsx
│       │   ├── ChatView.tsx
│       │   └── SettingsView.tsx
│       └── store/
│           └── useStore.ts    # Zustand global state
├── server/
│   ├── package.json
│   ├── tsconfig.json      # TS strict, CommonJS, output to ./dist
│   ├── data/              # SQLite database (gitignored)
│   └── src/
│       ├── index.ts       # Express entry (port 3001)
│       ├── db.ts          # SQLite init + schema
│       └── routes/
│           ├── events.ts  # CRUD /api/events
│           ├── diary.ts   # CRUD /api/diary
│           ├── settings.ts # GET+POST /api/settings
│           └── chat.ts    # POST /api/chat (OpenAI function calling)
```

---

## Commands

### Root

```bash
npm run dev            # Start both client and server concurrently
npm run dev:server     # Start server only (ts-node, :3001)
npm run dev:client     # Start client only (Vite, :5173)
npm run install:all    # Install deps in root, server, and client
```

### Client (`client/`)

```bash
npm run dev            # Vite dev server with HMR
npm run build          # tsc && vite build (type-check + production bundle)
npm run preview        # Vite preview of production build
```

### Server (`server/`)

```bash
npm run dev            # ts-node src/index.ts (no compilation)
npm run build          # tsc → dist/
npm run start          # node dist/index.js (production)
```

### Shell script (`./run.sh`)

```bash
./run.sh start         # Start app in background (nohup + PID file)
./run.sh stop          # Graceful stop (kill + pkill children)
./run.sh restart       # Stop then start
./run.sh status        # Check if running
```

---

## TypeScript Configuration

### Client (`client/tsconfig.json`)
- **Target:** ES2020
- **Module:** ESNext, bundler resolution
- **Strict:** `true` with `noUnusedLocals`, `noUnusedParameters`
- **JSX:** `react-jsx`
- **Path alias:** `@/*` → `src/*`
- **No emit:** `noEmit: true` (Vite handles bundling; tsc only type-checks)

### Server (`server/tsconfig.json`)
- **Target:** ES2022
- **Module:** CommonJS
- **Output:** `./dist`
- **Root:** `./src`
- **Strict:** `true`

---

## Tailwind Theme

Custom `primary` color palette (sky-blue). Dark mode uses the `class` strategy.

```js
darkMode: 'class'
colors: { primary: { 50: '#f0f9ff', 100: '#e0f2fe', ..., 900: '#0c4a6e' } }
```

Apply dark mode by toggling the `dark` class on `document.documentElement`. Every component uses `dark:` variants in its Tailwind classes.

---

## Frontend Architecture

### Routing (React Router v6)

All routes are children of `Layout` (sidebar + `<Outlet />`):

| Path | Component | Description |
|------|-----------|-------------|
| `/` | — | Redirects to `/calendar` |
| `/calendar` | `CalendarView` | FullCalendar-based calendar |
| `/diary` | `DiaryView` | Rich text diary (react-quill) |
| `/chat` | `ChatView` | OpenAI-powered AI assistant |
| `/settings` | `SettingsView` | API keys, theme, preferences |

### State Management (Zustand)

Single store at `client/src/store/useStore.ts`. See the file for exact interface.

```ts
interface AppState {
  theme: 'light' | 'dark' | 'system';
  settings: Settings;
  refreshKey: number;               // Increment to trigger data re-fetch
  setTheme: (t) => void;
  applySystemTheme: () => void;
  setSettings: (partial) => void;
  triggerRefresh: () => void;
}
```

Key patterns:
- Settings are loaded from API on app mount (`useEffect` in `App.tsx`).
- Components watch `refreshKey` to know when to re-fetch data from the server (e.g. after a mutation).
- `triggerRefresh()` is a simple `refreshKey++` — components that depend on it will re-render and re-fetch.

### API Calls

Components use `axios` directly (no wrapper/abstraction layer). Base URL is omitted — requests go to `/api/*` which Vite proxies to `localhost:3001`.

### Component Patterns

- Default exports for components.
- All styling via Tailwind classes, no CSS modules or styled-components.
- Dark mode: use `dark:` prefix on Tailwind classes (e.g. `dark:bg-gray-950`, `dark:text-gray-400`).
- Icons from `lucide-react`, imported individually.
- Use `clsx` + `tailwind-merge` for conditional classNames (pattern already present in Layout.tsx).

---

## Backend Architecture

### Express Server (`server/src/index.ts`)

- Port 3001 (configurable via `PORT` env var).
- Middleware: `cors()`, `bodyParser.json()`.
- Route prefix: `/api/*`.
- Health check: `GET /api/health` → `{ status: "ok" }`.

### Database (`server/src/db.ts`)

SQLite via `better-sqlite3` (synchronous API). File: `server/data/organizer.db` (gitignored). WAL mode enabled.

#### Schema

```sql
events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  start TEXT NOT NULL,          -- ISO 8601 datetime
  end TEXT,                     -- ISO 8601 datetime (nullable)
  all_day INTEGER DEFAULT 0,
  color TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)

diary_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,                 -- HTML from react-quill
  date TEXT NOT NULL,           -- YYYY-MM-DD
  mood TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)

settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)
```

### API Endpoints

#### Events (`server/src/routes/events.ts`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/events` | List all events ordered by `start` |
| POST | `/api/events` | Create event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |

**Convention:** snake_case in DB (`all_day`), camelCase in API response (`allDay`). Manual mapping in each route handler.

#### Diary (`server/src/routes/diary.ts`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/diary?date=YYYY-MM-DD` | List entries (optional date filter) |
| POST | `/api/diary` | Create entry |
| PUT | `/api/diary/:id` | Update entry |
| DELETE | `/api/diary/:id` | Delete entry |

#### Settings (`server/src/routes/settings.ts`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/settings` | Get all settings with defaults |
| POST | `/api/settings` | Upsert settings (INSERT OR REPLACE) |

Settings keys: `openaiUrl`, `openaiKey`, `model`, `theme`, `calendarView`, `timeFormat`.

#### Chat (`server/src/routes/chat.ts`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | Send messages to OpenAI with function calling |

The chat route supports two OpenAI function-calling tools:
- `create_calendar_event(title, description, start, end, allDay, color)`
- `create_diary_entry(title, content, date, mood)`

The flow:
1. Receive `{ messages }` from client.
2. Send to OpenAI with tools enabled.
3. If the model calls tools, execute them against the database, return results to the model for a final response.
4. Response includes `{ message, toolCallResults }`.

Error handling distinguishes 401/403 (API key), 429 (rate limit), and generic 500 errors.

### Route Pattern (How to Add a New Route)

1. Create a new `server/src/routes/yourthing.ts`:
   ```ts
   import { Router } from 'express';
   import db from '../db';

   const router = Router();

   router.get('/', (_req, res) => {
     const rows = db.prepare('SELECT ...').all();
     res.json(rows);
   });

   router.post('/', (req, res) => {
     const { field } = req.body;
     const result = db.prepare('INSERT INTO ... VALUES (?)').run(field);
     res.json({ id: result.lastInsertRowid });
   });

   export default router;
   ```
2. Register in `server/src/index.ts`:
   ```ts
   import yourthingRouter from './routes/yourthing';
   app.use('/api/yourthing', yourthingRouter);
   ```
3. Use `db.prepare(sql).run(...)` for mutations and `db.prepare(sql).all()` for queries.
4. Map snake_case DB columns to camelCase in API responses (as done in existing routes).

---

## Database Column Naming Convention

| Database (SQLite) | API Response (JSON) |
|-------------------|---------------------|
| `all_day` | `allDay` |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |

When writing INSERT/UPDATE statements, use snake_case parameter names (matching DB columns). When returning JSON, manually map to camelCase.

---

## How to Add a New Frontend Page

1. Create a new component in `client/src/components/YourView.tsx`:
   ```tsx
   export default function YourView() {
     return <div>Your content</div>;
   }
   ```
2. Add the route in `client/src/App.tsx`:
   ```tsx
   import YourView from './components/YourView';
   // ... inside <Routes>
   <Route path="yourpath" element={<YourView />} />
   ```
3. Add a navigation link in `client/src/components/Layout.tsx` using `<NavLink>` with a `lucide-react` icon.
4. Use `axios` for API calls. Import `useStore` from `../store/useStore` for global state.
5. All styling via Tailwind utility classes. Use `dark:` for dark mode variants.

---

## State Refresh Pattern

When a mutation occurs (create, update, delete), call `useStore.getState().triggerRefresh()`. Components watching `refreshKey` will re-render and re-fetch data:

```tsx
const { refreshKey } = useStore();

useEffect(() => {
  loadData();
}, [refreshKey]);

const handleSave = async () => {
  await axios.post('/api/events', { ... });
  useStore.getState().triggerRefresh();
};
```

---

## Git Conventions

- SQLite DB file (`server/data/`) is gitignored.
- `node_modules/`, `dist/`, `.env`, `.env.local`, `*.log`, `.DS_Store` are gitignored.
- No CI/CD configured. No testing framework, linter, or formatter configured.

---

## Important Notes

- Both client and server run in strict TypeScript mode. All new code must pass `tsc` type-checking.
- The client TS config has `noUnusedLocals` and `noUnusedParameters` — unused imports/variables will fail the build.
- The server uses `ts-node` for development (no watch mode — restart manually or via `run.sh`).
- Vite proxies `/api` to `http://localhost:3001` — in development, API calls from the client should use relative paths like `/api/events`.
- The OpenAI API key is stored in the SQLite database, set via the Settings UI (`/settings`). The chat endpoint reads it from the DB on each request.
- No authentication/authorization layer. This is a personal/offline tool.
- Settings use `INSERT OR REPLACE` — upsert semantics. Provide all fields in POST body even for partial updates (fields not provided are left unchanged).

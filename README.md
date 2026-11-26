# University Academic Hub

A full-stack unified academic gateway connecting students with Indian universities, official B.Tech CSE (IoT) Section B rosters, 2nd Year / 3rd Semester syllabi, weekly timetables, campus events, and the **Gider AI** campus assistant.

## Features

- **University Directory & Gateway (`/university`):** Search and filter 8 Indian universities by name, state, and type; validate student profiles via `POST /api/student/identify`; routes active **UEM (B.Tech CSE)** sessions directly into `/uem-home` and loads a 5-tab Student Academic Dashboard for other active institutions.
- **IEM/UEM Student Hub (`/uem-home`):** Features the **Campus Events & Academic Calendar** (`#events`, with month/grid toggle, saved bookmarks, and live **`+ Add Event`** modal persisted via `POST /api/universities/:id/events`) and the official **60-student B.Tech CSE (IoT) Section B Roster** (`#students-roster`).
- **Courses & Sem 3 Syllabus (`/courses`):** Includes the official 26-credit 3rd Semester curriculum matrix (`PCC301`, `ESC301`, `ESC302`, `PCCCS302`, `BSM301`, `HSMCS301`, `ESP301`) with interactive module-wise syllabus breakdowns.
- **IoT 2B Weekly Timetable (`/timetable`):** Full Monday–Friday (`9:30 AM – 5:00 PM`) routine with theory rooms, labs, and print view.
- **Gider AI Chatbot:** Live backend-connected assistant embedded across all pages with quick-action chips and intelligent `/university` gateway form auto-fill.

## Tech Stack

- **Frontend:** HTML5, CSS3, modular Vanilla JavaScript (`fetch()` API integration)
- **Backend:** Node.js, Express (`^4.21.2`), CORS, `dotenv`
- **Data Store:** Seeded JSON datasets in `server/data/` with in-memory caching & disk persistence for dynamic events
- **Deployment / Tunneling:** Ready for Render (`render.yaml`) or local Windows live preview (`start-live.ps1`)

## Getting Started Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional — defaults to PORT=3000)
cp .env.example .env

# 3. Start backend + static frontend server
npm start

# 4. Run automated API integration tests
npm test
```

Open `http://localhost:3000` in your browser (health endpoint: `http://localhost:3000/api/health`).

## API Endpoints

- `GET /api/health` — Service health status
- `GET /api/universities` — Filter universities (`?search=`, `?state=`, `?type=`, `?status=`)
- `GET /api/universities/:id` — Single university details
- `POST /api/student/identify` — Validate student credentials & generate session token
- `GET /api/universities/:id/academic-data` — Department & semester courses, timetable, and resources
- `GET /api/universities/:id/students` — Searchable UEM Section B student roster
- `GET /api/universities/:id/events` — Chronologically sorted campus events
- `POST /api/universities/:id/events` — Create & persist a new campus event
- `DELETE /api/universities/:id/events/:eventId` — Delete an event by ID

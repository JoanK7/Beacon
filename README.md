# Beacon

**A web-based training and support platform for university peer supporters.**
BSc. Software Engineering capstone · African Leadership University · Joan Kariza · Supervisor: Hubert Apana

🔗 **Repository:** https://github.com/JoanK7/Beacon

[![CI](https://github.com/JoanK7/Beacon/actions/workflows/ci.yml/badge.svg)](https://github.com/JoanK7/Beacon/actions/workflows/ci.yml)

---

## Description

Peer supporters at Rwandan universities get one-off, face-to-face training
with no way to refresh their skills, and no quick way to find the right
service when a student needs professional help. **Beacon** is a mobile-first
Progressive Web App that gives them:

| Feature | Requirement |
|---|---|
| Pseudonymous sign-up and secure session-based login | FR1 |
| Six training modules following the Solid Minds *PEERS Circles of Care* curriculum (the PEERS model, mental health literacy, psychological first aid, boundaries & confidentiality, referral, self-care), with a **Listen** button that reads any section aloud | FR2 |
| Visual, interactive lessons: bold key terms, callouts (Bea's tips, *Remember*, *Watch out*), step lists, tap-to-flip cards, *Check yourself* questions and *Think, then reveal* prompts. Practice only: nothing is graded or blocks moving on | FR2 |
| Section-by-section progress tracking; modules can be taken in any order | FR3 |
| **Practice conversations** (the gamification centrepiece): branching role-plays with a simulated peer. Every response shows how it lands and Bea explains why; unhelpful choices can be retried, so nobody can fail | FR4 |
| **Skill check** (placement + pre/post knowledge measure for RQ3) that suggests which modules to focus on and then reviews every answer (correct answer plus explanation), and **test-out**: pass a module's quiz without reading it to earn the badge | FR4 |
| Low-pressure gamification: quizzes with unlimited retries, a learning journey path, badge stickers, points and levels, gentle celebrations, and Bea the mascot (no leaderboards or streaks) | FR4 |
| A searchable, filterable referral directory of campus and local services, with tap-to-call | FR5 |
| Support-session log with optional referral to a directory service (notes encrypted) | FR6 |
| Self-care check-ins with a mood rating and private reflection (encrypted) | FR7 |
| Anonymous System Usability Scale (SUS) feedback | FR8 |
| Content Administrator workspace: create, edit, publish and archive modules, quizzes and providers; publish or hide scenarios | FR9 |
| Programme Coordinator cohort dashboard: aggregates only (incl. skill-check before/after and practice completions), small groups suppressed | FR10 |

> **Pilot content notice.** The modules and scenarios are **adapted from the
> training materials Solid Minds Counselling Clinic used to train ALU peer
> counsellors**, and are pending Solid Minds' final review. Unverified modules
> show a *"Pending expert review"* banner naming the source, and unverified
> services a *"Pending verification"* tag; contact details not yet confirmed say
> *"To be confirmed"*. The one scenario that involves risk to life is marked
> **sensitive**, opens with a care note, and can be hidden by an admin until it
> is reviewed. Admins tick **Content verified** once approved; no code changes
> are needed. Beacon is a training tool, **not** a clinical or crisis service.

### Screenshots

| Mobile: home | Mobile: learning journey | Mobile: module | Desktop: badge collection |
|---|---|---|---|
| ![Home](docs/screenshots/mobile-03-dashboard.png) | ![Journey](docs/screenshots/mobile-04-modules.png) | ![Module](docs/screenshots/mobile-05-module.png) | ![Progress](docs/screenshots/desktop-12-progress.png) |

| Mobile: interactive lesson | Desktop: interactive lesson | Desktop: admin editor with preview | |
|---|---|---|---|
| ![Lesson blocks](docs/screenshots/mobile-22-lesson-blocks.png) | ![Lesson blocks](docs/screenshots/desktop-22-lesson-blocks.png) | ![Editor](docs/screenshots/desktop-15-admin-editor.png) | |

| Mobile: practice conversations | Mobile: scenario player | Mobile: skill check results | Desktop: scenario ending |
|---|---|---|---|
| ![Practice](docs/screenshots/mobile-16-practice.png) | ![Scenario](docs/screenshots/mobile-17-scenario.png) | ![Skill check](docs/screenshots/mobile-20-skill-results.png) | ![Ending](docs/screenshots/desktop-18-scenario-end.png) |

More in [`docs/screenshots`](docs/screenshots).

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Language | **TypeScript 6** (strict) on both client and server | See [Why TypeScript](#why-typescript) |
| Frontend | **Next.js 16** (App Router), **React 19**, **Tailwind CSS v4**, Lucide icons | Mobile-first, fast, deploys natively to Vercel |
| PWA | Web App Manifest + hand-written service worker | Installable; already loaded modules work offline. Lighter than `next-pwa`, which is unmaintained for Next 16 |
| Backend | **Node.js 22**, **Express 5** REST API, **zod** validation, `tsx` in development | Simple, well documented, async error handling built in |
| Database | **PostgreSQL 16** via `pg` with versioned SQL migrations | Relational integrity for progress, referrals and roles |
| Security | bcrypt, httpOnly session cookies, AES-256-GCM field encryption, helmet, rate limiting | Privacy-by-design, Rwanda Law No. 058/2021 |
| Testing | **Jest** (`ts-jest`) + **Supertest** (unit + API integration), **Playwright** (end-to-end, mobile + desktop) | Matches proposal §3.5 |
| CI/CD | **GitHub Actions** → **Vercel** (web) + **Render** (API + DB) | Free tiers suitable for a student pilot |

### Why TypeScript

The proposal named JavaScript. The project moved to TypeScript before the pilot
because the new features (branching scenarios, the skill check and the
coordinator's research aggregates) pass structured data between the database,
the API and the screens:

- **Fewer silent bugs.** One shared shape per API response means a renamed or
  missing field becomes a compile error instead of a blank screen during the pilot.
- **Safer content.** Scenario scripts and modules are typed, so a broken link
  between conversation steps is caught by the compiler and by a unit test before
  it reaches peers.
- **Same tools, same runtime.** TypeScript compiles to the same JavaScript that
  runs on Node and in the browser; Next.js, Express, Jest and Playwright support
  it directly. Switching before the pilot was cheaper than switching after,
  when the codebase would be larger and pilot data would depend on it.

**Why version 6, not 7:** TypeScript 7 (the new native compiler) does not yet
offer the JavaScript compiler API that Next.js' type checking, `typescript-eslint`
and `ts-jest` rely on. Version 6 is the stable choice the whole toolchain supports.

## Project structure

```
Beacon/
├── client/                    # Next.js frontend (deploys to Vercel)
│   ├── app/
│   │   ├── page.tsx           # Public landing page
│   │   ├── login/ register/ privacy/
│   │   ├── (app)/             # Authenticated area (shared nav shell + auth guard)
│   │   │   ├── dashboard/ learn/[slug]/quiz/ directory/ sessions/new/
│   │   │   ├── practice/[slug]/   # Scenario list + chat-style player
│   │   │   ├── skill-check/       # Placement / pre-post check
│   │   │   ├── reflect/ progress/ feedback/ account/
│   │   │   ├── admin/         # Content administrator: modules, scenarios, directory (FR9)
│   │   │   └── coordinator/   # Cohort dashboard (FR10)
│   │   ├── manifest.ts        # PWA manifest
│   │   └── icons/[size]/      # Generated PWA icons
│   ├── components/            # UI kit, app shell, journey path, mascot, listen button, safety notices
│   ├── lib/                   # Typed API client and response types, auth context, data hooks, constants
│   ├── public/sw.js           # Service worker (offline support)
│   └── e2e/                   # Playwright end-to-end tests
├── server/                    # Express REST API (deploys to Render)
│   ├── src/
│   │   ├── app.ts             # App factory: middleware + route mounting
│   │   ├── index.ts           # HTTP server entry point
│   │   ├── config.ts          # Validated environment configuration
│   │   ├── schemas.ts         # zod request schemas
│   │   ├── types.ts           # Shared types (roles, Express request augmentation)
│   │   ├── content/           # Training content: modules, scenarios, providers (adapted from Solid Minds)
│   │   ├── routes/            # HTTP layer, one file per service
│   │   ├── services/          # Business logic + SQL (the services of Fig 3.3, plus scenarios and skill check)
│   │   ├── middleware/        # auth / roles, validation, errors
│   │   ├── utils/             # crypto, scoring (quiz, SUS, levels), scenario replay + validation
│   │   └── db/                # pool, migration runner, seed
│   ├── migrations/            # Versioned SQL migrations
│   ├── dist/                  # Compiled JavaScript (npm run build; not committed)
│   └── tests/                 # unit/ and integration/ (Jest + Supertest)
├── docs/                      # Design, architecture, API, schema, deployment
├── docker-compose.yml         # Local PostgreSQL
├── render.yaml                # Render Blueprint (API + database)
└── .github/workflows/ci.yml   # CI pipeline
```

---

## Setting up the environment and the project

### Prerequisites

| Tool | Version | Check |
|---|---|---|
| [Node.js](https://nodejs.org) | **20.9+** (22 LTS recommended, see `.nvmrc`) | `node -v` |
| npm | 10+ | `npm -v` |
| Git | any recent | `git --version` |
| **One of:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) *(recommended)* **or** a local [PostgreSQL 14+](https://www.postgresql.org/download/) | | `docker -v` / `psql --version` |

### 1. Clone and install

```bash
git clone https://github.com/JoanK7/Beacon.git
cd Beacon
npm run install:all        # installs root, server and client dependencies
```

### 2. Start PostgreSQL

**Option A: Docker (recommended).** This creates the `beacon` and `beacon_test` databases on host port **5433**, so it won't clash with a locally installed PostgreSQL.

```bash
npm run db:up              # = docker compose up -d
```

**Option B: an existing local PostgreSQL.** Create a user and databases, then use port 5432 in the next step:

```sql
-- in psql as a superuser
CREATE USER beacon WITH PASSWORD 'beacon';
CREATE DATABASE beacon OWNER beacon;
CREATE DATABASE beacon_test OWNER beacon;
```

### 3. Configure environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

The defaults work as-is with Docker. With Option B, change the port in
`server/.env` to `5432`, e.g. `DATABASE_URL=postgres://beacon:beacon@localhost:5432/beacon`.
Each variable is documented in the `.env.example` files. In development,
`ENCRYPTION_KEY` and the seed passwords fall back to safe local defaults; in
production they are **required**.

### 4. Create the schema and seed data

```bash
npm run db:setup           # runs migrations, then seeds accounts, 6 modules, 5 scenarios and directory entries
```

Both steps are idempotent, so you can re-run them safely.

> **Updating an existing install?** After pulling new code, run `npm run install:all`
> and then `npm run db:setup` again. It applies any new migrations, adds new content
> and archives the old placeholder modules, without touching accounts or user data.

### 5. Run the app

```bash
npm run dev                # API on http://localhost:4000 and web on http://localhost:3000
```

Open **http://localhost:3000**. The browser only talks to the Next.js server,
which proxies `/api/*` to the API (see `client/next.config.ts`).

### Demo accounts (development seed)

| Role | Username | Password |
|---|---|---|
| Peer supporter | `demo_peer` | `BeaconPeer#2026` |
| Content administrator | `admin` | `BeaconAdmin#2026` |
| Programme coordinator | `coordinator` | `BeaconCoord#2026` |

You can also register a new peer-supporter account from the landing page.
**Never** use these passwords in production: set `SEED_*_PASSWORD` instead.

### Useful scripts

| Where | Command | What it does |
|---|---|---|
| root | `npm run dev` | Run API and web together |
| root | `npm run db:up` / `db:down` | Start / stop the Docker database |
| root | `npm run db:setup` | Migrate and seed |
| root | `npm run typecheck` | Type-check server and client |
| server | `npm run dev` | API with auto-reload (`tsx watch`, runs TypeScript directly) |
| server | `npm run typecheck` | Type-check without emitting files |
| server | `npm run build` / `npm start` | Compile to `dist/` / run the compiled API |
| server | `npm run start:prod` | Migrate, seed and start from `dist/` (used in production and CI) |
| server | `npm test` | Unit tests, plus integration tests when `TEST_DATABASE_URL` is set ( that database is wiped) |
| server | `npm run test:coverage` | Tests with a coverage report (fails below 60% lines, per NFR6) |
| client | `npm run typecheck` | Generate Next.js route types, then type-check |
| client | `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| client | `npm run build && npm start` | Production build and serve |
| client | `npm run test:e2e` | Playwright end-to-end tests against the running stack (set `PW_CHANNEL=msedge` or `chrome` to use an installed browser, or run `npx playwright install chromium` once) |

### Troubleshooting

| Symptom | Cause and fix |
|---|---|
| "Something went wrong on our side" when registering or signing in (HTTP 500) | The API can't use the database. Check the `[api]` lines in the `npm run dev` terminal. Usually the database isn't running (`npm run db:up`) or the tables were never created (`npm run db:setup`). |
| API error `ENOTFOUND` or a connection to an unexpected host | A system-wide `DATABASE_URL` from another project exists. `server/.env` now takes priority over it (dotenv `override`), so restart `npm run dev`. To check: `echo $env:DATABASE_URL` in PowerShell. |
| `password authentication failed` | `DATABASE_URL` in `server/.env` doesn't match your database user, password or port (5433 for Docker, 5432 for a native install). |
| `401` errors for `/api/auth/me` in the browser console | Normal. It is the "is anyone signed in?" check before you log in. |
| Opening `http://localhost:4000` shows a JSON message | That's the API. The web app is at `http://localhost:3000`. |

### Testing

```bash
# API: 79 unit and integration tests (93% line coverage) against the test database
cd server && npm test

# End-to-end: start the stack first (API + `npm run build && npm start` in client), then
cd client && npm run test:e2e
```

The integration tests cover every functional requirement: auth and roles,
module completion, test-out and answer secrecy, badges awarded once, scenario
completion (including retries and rejecting impossible play-throughs), the skill
check, directory search, encrypted notes at rest, per-user privacy,
aggregate-only dashboard data and account deletion. Unit tests also check that
every scenario script is complete (no broken links between steps). The
end-to-end tests walk the proposal's Figure 3.7 flow, a practice conversation,
the skill check and test-out, and the admin and coordinator views, on mobile
and desktop viewports.

---

## Deployment plan

| Component | Platform | Notes |
|---|---|---|
| Frontend (Next.js) | **Vercel** | Root directory `client`; env `API_URL` = Render API URL |
| API (Express) | **Render Web Service** | Defined in `render.yaml`; compiles TypeScript at build, runs migrations and seed on start; health check `/api/health` |
| Database | **Render PostgreSQL** | Provisioned by the same Blueprint |
| CI | **GitHub Actions** | Type checks, tests, lint, build and e2e on every push/PR; `main` auto-deploys |

**Quick version:**
1. **Render** → New → Blueprint → select this repo → set `ENCRYPTION_KEY`, `SEED_*_PASSWORD`, `CORS_ORIGINS`.
2. **Vercel** → Import project → Root Directory `client` → set `API_URL=https://<your-api>.onrender.com`.
3. Check `https://<your-site>/api/health`, then sign in as `admin`, review the content and hide any scenario not yet approved.

Free-tier limits (Render's cold starts and 30-day free Postgres), environments,
rollback, backups and monitoring are covered in **[docs/deployment.md](docs/deployment.md)**.

---

## Documentation

| Document | Contents |
|---|---|
| [docs/design/wireframes.md](docs/design/wireframes.md) | Design drivers, sitemap, navigation rules, wireframes for every key screen |
| [docs/design/style-guide.md](docs/design/style-guide.md) | Colour tokens, typography, components, accessibility, voice and tone |
| [docs/architecture.md](docs/architecture.md) | Three-layer architecture, service→code map, sequence diagram, security controls |
| [docs/database-schema.md](docs/database-schema.md) | ERD (Mermaid), tables, changes from the proposal ERD |
| [docs/api.md](docs/api.md) | REST endpoints and payloads |
| [docs/deployment.md](docs/deployment.md) | Full deployment plan and operations |

## Privacy & ethics by design

- Pseudonymous accounts with **no** email, phone or real name. Consent is recorded at registration.
- Session notes and reflections are **encrypted at rest** (AES-256-GCM); session tokens are stored hashed.
- Feedback is stored **without** a user reference.
- Coordinators see **aggregates only**; averages from fewer than 3 people are hidden.
- Users can delete individual records or their **entire account** (right to erasure).
- Logging sessions earns **no points**, so there is no incentive to inflate activity.
- "Peer support is not therapy" notices and an always-visible **Urgent help** link.

## Roadmap (beyond the pilot)

Safe self-disclosure module (with Solid Minds) · confidence scale (co-designed
in workshops) · recorded audio and video from the clinical partner ·
Kinyarwanda localisation (next-i18next) · supervisor messaging · email
notifications · LMS integration · multi-university tenancy.

## License

MIT. See [LICENSE](LICENSE).

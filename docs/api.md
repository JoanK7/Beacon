# REST API Reference

Base path `/api`. JSON in and out. Authenticated routes need the `beacon_session`
cookie set by login/register (a `Authorization: Bearer <token>` header is also
accepted for API clients). Errors have the shape:

```json
{ "error": "Some fields need attention.", "details": [{ "field": "password", "message": "Password must be at least 8 characters." }] }
```

| Status | Meaning |
|---|---|
| 400 | Validation failed (`details` lists fields) |
| 401 | Not signed in / session expired |
| 403 | Signed in but not allowed (wrong role) |
| 404 | Not found |
| 409 | Conflict (username or slug taken) |
| 429 | Rate limited |

## Health
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | – | Liveness + DB check |

## Authentication (FR1)
| Method | Path | Auth | Body / notes |
|---|---|---|---|
| POST | `/auth/register` | – | `{ username, password, university?, consent: true }` → 201 `{ user }` + cookie |
| POST | `/auth/login` | – | `{ username, password }` → `{ user }` + cookie |
| POST | `/auth/logout` | ✓ | Revokes the session → 204 |
| GET | `/auth/me` | ✓ | Current user |
| DELETE | `/auth/me` | ✓ | Delete account and all personal data → 204 |

## Training & gamification (FR2–FR4)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/modules` | ✓ | Published modules with my progress |
| GET | `/modules/:slug` | ✓ | Module, sections (with `viewed`), quiz meta, badge, `sourceNote`, linked `scenarios` |
| POST | `/modules/:slug/sections/:sectionId/view` | ✓ | Mark section read → `{ sectionsViewed, sectionCount, status }` |
| GET | `/quiz/:slug` | ✓ | Questions **without answers**. Open at any time; `testOut: true` when the module has not been read yet |
| POST | `/quiz/:slug/submit` | ✓ | `{ answers: [optionIndex…] }` → `{ result: { score, passed, testedOut, results[], badge } }` |
| GET | `/scenarios` | ✓ | Published practice conversations with my `completed` and `bestInsight` |
| GET | `/scenarios/:slug` | ✓ | Full branching script (practice, not assessment, so feedback is included) |
| POST | `/scenarios/:slug/complete` | ✓ | `{ path: [{ nodeId, choice }…] }`. The server replays the path, rejects impossible ones (400) → 201 `{ result: { insightScore, retries, firstCompletion } }` |
| GET | `/skill-check` | ✓ | Questions (2 per published module, **without answers**) and my latest `pre` / `post` results |
| POST | `/skill-check` | ✓ | `{ kind: pre \| post, answers: [{ questionId, answer }…] }` → 201 `{ result: { score, results[] } }`. Per module: `strong` or `practise`, plus `questions[]` reviewing each answer (`chosen`, `correctIndex`, `correct`, `explanation`). The review is stored with the attempt and returned in `latest` |
| GET | `/progress` | ✓ | Points, level, badges, activity counts |

## Directory, sessions, self-care, feedback (FR5–FR8)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/providers?q=&category=&onCampus=` | ✓ | Search the directory (emergency first) |
| GET | `/providers/:id` | ✓ | One provider |
| GET | `/sessions` | ✓ | My sessions (notes decrypted for me only) |
| POST | `/sessions` | ✓ | `{ category, outcome, notes?, providerId? }` → 201 |
| DELETE | `/sessions/:id` | ✓ | Delete one of my sessions |
| GET | `/reflections` | ✓ | My check-ins |
| POST | `/reflections` | ✓ | `{ moodRating: 1-5, freeText? }` → 201 |
| DELETE | `/reflections/:id` | ✓ | Delete one of my check-ins |
| POST | `/feedback` | ✓ | `{ susAnswers: [10 × 1-5], comment? }` → `{ susScore }` (stored anonymously) |

Enums: `category` ∈ academic, social, personal, wellbeing, financial, other ·
`outcome` ∈ listened, resolved, referred, follow_up, escalated ·
`service_type` ∈ counselling, medical, academic, financial, emergency, wellbeing, other.

## Admin (FR9): role `admin`
| Method | Path | Description |
|---|---|---|
| GET | `/admin/modules` | All modules (any status) |
| GET | `/admin/modules/:id` | Module with sections and quiz incl. answers |
| POST | `/admin/modules` | Create module + sections + quiz |
| PUT | `/admin/modules/:id` | Replace module, upserting sections (keeps view history) |
| PATCH | `/admin/modules/:id/status` | `{ status: draft \| published \| archived }` |
| GET | `/admin/scenarios` | All scenarios with status, `sensitive` flag and total completions |
| PATCH | `/admin/scenarios/:id/status` | `{ status }`: publish or hide a scenario (scripts are authored in code) |
| GET | `/admin/providers` | All providers incl. archived |
| POST | `/admin/providers` | Create provider |
| PUT | `/admin/providers/:id` | Update provider |
| PATCH | `/admin/providers/:id/archive` | `{ archived: boolean }` |

## Cohort dashboard (FR10): role `coordinator` or `admin`
| Method | Path | Description |
|---|---|---|
| GET | `/dashboard` | Aggregates: overview counts, per-module completion, sessions by topic/outcome/week, referrals by type, mood and SUS averages, skill-check pre/post averages, scenario completions (averages suppressed below 3 people) |

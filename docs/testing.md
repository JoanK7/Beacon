# Testing

How Beacon is tested, how to run each kind of test, and where the results are.

## Summary

| Strategy | Tool | What it checks | Size | Latest result |
|---|---|---|---|---|
| Static analysis | TypeScript (strict), ESLint | Type errors and code problems in both apps | Whole codebase | Clean |
| Unit tests | Jest | Pure logic: scoring, encryption, scenario replay, input validation, content, question selection, reading pace, streak, crisis detection | 109 tests in 6 files | 109 / 109 pass |
| Integration tests | Jest + Supertest + real PostgreSQL | Every API area through real HTTP requests and a real database | 51 tests | 51 / 51 pass |
| Code coverage | Jest (Istanbul) | How much of the API code the tests run | | 97.0% lines, 94.5% statements, 94.2% functions, 75.5% branches |
| End-to-end tests | Playwright | 10 complete user journeys in a real browser against the running app | 10 journeys | See section 4 |
| Compatibility | Playwright on 3 browser engines | The same journeys on phones, a tablet and desktops | 7 profiles | 49 / 49 pass (7 journeys, 29 Oct); re-run with 10 journeys on the next push |
| Performance (front end) | Lighthouse 12.6 | Load speed and accessibility on a simulated mid-range phone on slow 4G | 5 key pages | Performance 72–100, accessibility 100 |
| Performance (API) | autocannon 8 | Throughput and response times under 200 simultaneous connections | 3 endpoints | 0 errors; 99% of requests under 240 ms |
| Upgrade test | Integration test + manual run | Content updates on a live database keep learners' progress | 2 tests + 1 manual run | Pass |
| Usability | System Usability Scale form in the app, plus peer counsellor and supervisor feedback | How easy and engaging peers find Beacon | Ongoing | Feedback led to the lesson blocks, question banks, streak, stories and community wall |

Every push to `main` runs the CI and compatibility workflows on GitHub, so these results are re-checked automatically.

## Where the results are

| Result | Where to find it |
|---|---|
| Unit, integration and coverage (every push) | GitHub → **Actions** → **CI** → job *API type check + tests* (log) and the **api-coverage** artifact (open `lcov-report/index.html`) |
| Type check, lint and build (every push) | GitHub → **Actions** → **CI** → job *Web type check + lint + build* |
| End-to-end on 7 devices and browsers (every push) | GitHub → **Actions** → **Compatibility & performance** → one job per device (green tick = all journeys passed); **e2e-report-&lt;device&gt;** artifacts hold the Playwright HTML reports |
| Lighthouse and load-test numbers (every push) | Same run → **Summary** page (tables), annotations, and the **performance-reports** artifact (Lighthouse HTML reports and raw JSON) |
| Local runs | `server/coverage/lcov-report/index.html` (coverage) and `client/playwright-report/index.html` (end-to-end); both are git-ignored |

Artifacts are kept for 7 days (coverage) and 30 days (compatibility and performance reports). Re-run the workflow from the Actions tab (**Run workflow**) to regenerate them.

## How to run the tests

All commands run from the repository root unless stated otherwise.

```bash
# Static analysis
npm run typecheck          # TypeScript, server and client
npm run lint               # ESLint, client

# Unit tests only (no database needed, about 10 seconds)
npm --prefix server run test:unit

# Unit + integration tests with coverage (needs a test database)
# TEST_DATABASE_URL must point at a database whose name contains "test":
# it is wiped at the start of the run.
npm --prefix server run test:coverage

# End-to-end tests (needs the app running: npm run build, then start the API and web app)
npm run test:e2e                                   # Chromium: Pixel 7 phone + desktop
E2E_ALL_BROWSERS=1 npm run test:e2e                # all 7 profiles (first: npx playwright install firefox webkit)
npx --prefix client playwright show-report client/playwright-report   # open the HTML report
```

Running all seven browser profiles at once needs plenty of memory; on a laptop with little free memory, run one at a time with `--project=<name> --workers=1`, or use the GitHub workflow.

## 1. Unit tests (`server/tests/unit`)

Fast tests of pure functions, with normal inputs, boundaries and invalid inputs.

| File | What it covers | Edge cases included |
|---|---|---|
| `scoring.test.ts` | Quiz scoring, SUS score, points and levels | Missing answers count as wrong; empty quiz rejected; SUS best (100), worst (0) and neutral (50); wrong number of answers or out-of-range values rejected; level cap; top level reachable by finishing all modules |
| `crypto.test.ts` | AES-256-GCM encryption of notes, session tokens | Round trip; a fresh random IV each time (same text never encrypts the same way); empty stays empty; **tampered ciphertext is detected**; tokens unique and URL-safe; hashing is deterministic |
| `scenario.test.ts` | Practice-conversation replay and scoring | All-helpful path scores 100; retry after an unhelpful choice only scores the first try; "okay" gets half credit; **paths that skip steps, use missing choices or stop early are rejected**; broken scripts detected |
| `schemas.test.ts` | Input validation rules | Consent required; short passwords and unsafe usernames rejected; answer index outside the options rejected; a quiz showing more questions than its bank rejected; provider websites must be https (`http:` and `javascript:` rejected) and emails valid; community replies only from the fixed set, notes up to 280 characters; non-URL-friendly slugs rejected; only known categories and outcomes accepted |
| `content.test.ts` | The authored training content itself | Unique slugs; every module passes the admin rules; every lesson uses valid formatting; **10 quiz and 2 skill-check questions per module, unique ids, and no skill-check question ever used in a quiz**; quiz answers are not always in the same position; directory has no placeholders, valid emails and https links, and no hours for ALU services; stories link to real modules; every scenario can be completed; malformed lesson blocks are flagged (8 cases) |
| `domain.test.ts` | Question selection, pace checks, learning gain, streak, crisis detection | Draws never exceed the bank; **least-seen questions always come first (20 random seeds)**; reproducible with a seed; option orders are true permutations; fair shuffle; a repeat drops questions removed from the bank; reading faster than a quarter of the expected time (min 8 s) is rushed, exactly at the threshold is not; quiz under 6 s per question is rushed; learning gain with pre = 100 is undefined; streak: no activity, today not yet active, one rest day forgiven, two in a row or two in a week break it, duplicates and unordered dates, month and year boundaries; crisis phrases flagged (including curly apostrophes) and everyday phrases like "exams are killing me" not flagged |

## 2. Integration tests (`server/tests/integration/api.test.ts`)

The whole Express app is exercised through HTTP (Supertest) against a real PostgreSQL database that is wiped, migrated and seeded first, exactly as in production.

| Area | Behaviour proven (including failure cases) |
|---|---|
| Authentication (FR1) | Register sets an **httpOnly** cookie; duplicate usernames rejected case-insensitively; registration without consent rejected; wrong password gets a generic message (no hint whether the username exists); protected routes return 401; logout ends the session |
| Training and quizzes (FR2–FR4) | Six modules in order; module completes only when every section is read; an attempt draws 5 distinct questions from the bank; **correct answers are never sent before submission**; a second submission of the same attempt is refused (409), another user's attempt is not found (404), missing answers are rejected (400); **a repeated quiz never awards the badge**; a new quiz prefers unseen questions and awards the badge once; test-out works |
| Learning integrity | Sections clicked through instantly are flagged as rushed and earn no points; after a realistic reading time the same flow earns points; re-marking a section changes nothing; a quiz answered instantly is flagged as rushed; first-try average is reported |
| Practice conversations | Ideal path scores 100 and gives points only the first time; retries score only first tries; **an impossible path is rejected (400)** |
| Skill check | Two questions per module without answers, **none of them used in any quiz**; every question must be answered; per-module strengths and a review (right or wrong, and why) are returned and saved; **the correct option never appears in the response, even for older saved attempts** |
| Directory, sessions, referrals (FR5–FR6) | Search by keyword and category; **`%` and `_` in a search are treated literally** (no SQL wildcard tricks); session notes are **encrypted in the database** |
| Self-care and feedback (FR7–FR8) | Reflections stored; SUS feedback stored anonymously |
| Stories and streak | Everyone sees the same story on the same day; reading earns 15 points once, never twice; unknown stories are 404; the streak counts today once there is activity and is zero for a new account |
| Community wall | **Responses contain no usernames or user ids**, times are rounded to the hour; a note mentioning risk is flagged but still posted; kind messages toggle on and off and only the fixed set is accepted; you cannot report your own post; three reports hide a post and an admin can restore it; posts older than 7 days leave the wall; only the author can delete; at most 5 posts a day |
| Roles (FR9–FR10) | Peers blocked from admin and dashboard (403); admin create, publish, archive and hide; **coordinator sees aggregates only, with groups under 3 people hidden**, and no usernames or note text leak |
| Content refresh | Older lesson text and quizzes update in place keeping section ids and reading progress; a module edited by an admin is never overwritten; older directory entries are renamed in place (no duplicates), retired ones archived, and an entry an admin edited is left alone |
| Privacy | Deleting an account removes the user and all linked records |
| Errors | Unknown routes return JSON 404s |

## 3. End-to-end tests (`client/e2e/peer-journey.spec.ts`)

Real browser, real app, real database. Each journey is a complete task a user would do.

1. **Core flow** (proposal Figure 3.7): register → read a module → pass its quiz → earn a badge → find a service → log a session with a referral → self-care check-in → progress page.
2. **Interactive lessons**: bold terms, callouts, step list, reveal prompt, flip card, a wrong then right *Check yourself* answer, and moving on without answering.
3. **Practice conversation**: an unhelpful choice shows feedback and can be retried; the ending shows a 75% insight score.
4. **Skill check and test-out**: answer every question, see the review with correct answers, then pass a quiz without reading the module.
5. **Coordinator**: sees only aggregate data.
6. **Admin**: opens the module editor and the scenario list.
7. **Reduced motion**: with the device set to reduce motion, celebrations appear without confetti and flip cards still work.
8. **Repeat vs new quiz**: a repeat shows the same questions as a "practice round" and gives no badge; a new quiz shows none of the questions seen before.
9. **Daily story and streak**: reading today's story earns 15 points and the dashboard shows a 1-day streak.
10. **Community wall**: a mood and note are shared without the username, marked "your post", and can be deleted.

Journeys 1, 2 and 4 were also updated: the lesson test now checks Bea's "That was quick!" nudge, the directory test checks ALU Student Success with its email link and that nothing says "pending", and the skill-check test checks that the review shows the reason but no correct answer.

## 4. Compatibility (`.github/workflows/compatibility.yml`)

The same 7 journeys run on each profile (screen size, touch, user agent and browser engine emulated by Playwright).

| Profile | Browser engine | Screen | Represents | Result |
|---|---|---|---|---|
| `mobile` (Pixel 7) | Chromium | 412 × 839, touch | A typical Android phone | 7 / 7 pass |
| `small-android` (Galaxy S8) | Chromium | 360 × 740, touch | Small, older Android phones | 7 / 7 pass |
| `iphone-13` | WebKit (Safari) | 390 × 664, touch | iPhone | 7 / 7 pass |
| `ipad` (gen 7) | WebKit (Safari) | 810 × 1080, touch | Tablet | 7 / 7 pass |
| `desktop` | Chromium (Chrome, Edge) | 1280 × 720 | Laptop, Chrome or Edge | 7 / 7 pass |
| `firefox` | Gecko (Firefox) | 1280 × 720 | Laptop, Firefox | 7 / 7 pass |
| `webkit-safari` | WebKit (Safari) | 1280 × 720 | Mac, Safari | 7 / 7 pass |

**Findings from compatibility testing**

- On the first run, `small-android` and `webkit-safari` failed. The cause was test data: their longer device names made test usernames 31 characters, and the app **correctly rejected** them (the limit is 30). The tests now generate shorter usernames.
- On desktop WebKit, the tests typed into the register form before the page had finished loading its interactive code, and the field was cleared. The tests now wait for the page to settle. **This could also affect real users on very slow connections who start typing immediately**; making the sign-in and register forms keep early typing is a planned improvement.
- Limits: Playwright emulates devices on desktop engines; it does not run on physical phones. Testing with peer counsellors on their own phones complements this.

## 5. Performance

Run on GitHub's standard Linux machines against production builds.

**Lighthouse** (mobile form factor, simulated slow 4G and a 4× slower CPU, signed in as a peer):

Two runs on 29 October 2026 (shared CI machines vary from run to run, so both are shown):

| Page | Performance (run 1 / run 2) | Accessibility | Largest contentful paint (run 1 / run 2) |
|---|---|---|---|
| `/` (landing) | 77 / 72 | 100 | 3.0 s / 2.7 s |
| `/login` | 97 / 100 | 100 | 2.6 s / 1.8 s |
| `/dashboard` | 94 / 94 | 100 | 2.9 s / 3.1 s |
| `/learn/peers-model` (a lesson) | 94 / 96 | 100 | 2.9 s / 2.7 s |
| `/directory` | 96 / 97 | 100 | 2.6 s / 2.6 s |

All five pages score 100 for accessibility (NFR3). The main content of every page appears in about 3 seconds or less on slow 4G with a slower phone CPU (NFR2's 3-second target); the dashboard sits right at the limit (2.9–3.1 s). The public landing page scores lowest (77); it is seen once, before sign-in, and is the first candidate for optimisation (the Lighthouse report in the artifacts lists the specific opportunities).

**API load test** (autocannon, 200 concurrent connections for 20 seconds each, matching the 200 concurrent users in NFR5):

| Endpoint | Requests per second (run 1 / run 2) | Median response | 99th percentile | Errors |
|---|---|---|---|---|
| `/api/health` (includes a database query) | 2,558 / 3,632 | 74 / 53 ms | 129 / 91 ms | 0 |
| `/api/modules` (signed in; modules with the user's progress) | 987 / 1,272 | 199 / 155 ms | 238 / 191 ms | 0 |
| `/api/providers?q=counselling` (signed in; directory search) | 1,465 / 1,900 | 134 / 104 ms | 170 / 125 ms | 0 |

Even the slowest endpoint answers 99% of requests within a quarter of a second with 200 people using it at once, and nothing failed. The production server (Render) will differ from GitHub's machines, so these numbers show capacity and stability rather than exact live timings; the uptime monitor on `/api/health` tracks the live service.

## 6. Upgrade test

Content updates must never erase learners' progress. Besides the integration tests, a database is built with the previous release, given a learner with progress, and then upgraded with the current code.

**Lesson blocks release (29 October):** all six modules updated, all 29 section ids and the learner's 5 "sections read" records were kept, and running it again changed nothing.

**Final release (2 November):** the database was built from the previous release (commit `5474cd1`), and the learner was given reading progress, a passed quiz attempt and a session with a referral to "ALU Academic Advising (placeholder)". After upgrading:

- migration 004 applied; all six modules moved to content version 3 and are marked verified; each quiz now has 10 questions plus 2 skill-check questions;
- all 29 section ids and all 6 "sections read" records were kept, and the old quiz attempt still counts as submitted;
- the directory entries were **renamed in place**: the old referral now points to "ALU Student Success", with no duplicate entries; the ALU Emergency Line was added and Campus Health Services archived;
- the 10 daily stories were added;
- running the upgrade a second time changed nothing.

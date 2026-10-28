# Beacon Style Guide: "Calm Lagoon"

Beacon should feel like a **calm, friendly space to learn**, not another
assignment portal. The original navy palette resembled the LMS students use
for coursework, so the UI was redesigned around soft teal, airy backgrounds,
rounded shapes and a kind mascot. Tokens live in
[`client/app/globals.css`](../../client/app/globals.css) (Tailwind v4 `@theme`);
reusable components live in [`client/components`](../../client/components).

## 1. Low-pressure gamification principles

Game elements are there to **encourage, never to pressure**. These rules apply to every feature:

| Principle | In practice |
|---|---|
| **No comparison with others** | No leaderboards, rankings or "top %" figures. Points, levels and badges are personal only. |
| **Nothing is ever lost** | No streaks to break, no timers, no expiring rewards. Missing a day has no consequence. |
| **Autonomy over order** | The journey path *suggests* an order, but every module is open at any time (Self-Determination Theory: autonomy). |
| **Effort is celebrated** | Failing a quiz says "Almost there! Every try helps you learn", shows the answers, and allows unlimited retries. |
| **Keep it simple** | One mascot, one points system, one badge per competency. No currencies, shops or competing meters. |
| **Only learning earns points** | Logging support sessions is never gamified, so there is no incentive to inflate activity. |
| **Motion is optional** | All animation stops under `prefers-reduced-motion`; celebrations then show a static card. |

**Sources.**
- idstudio, [*Gamification in web design*](https://idstudio.co.uk/insights/web-design/gamification-in-web-design/): points, badges and challenges motivate, but "overcomplicating the gamification experience can frustrate and confuse users".
- idstudio, [*Tips for a content-heavy website*](https://idstudio.co.uk/insights/web-design/tips-for-a-content-heavy-website/): whitespace, clear headings, chunking, and icons to break up text.
- Mayor-Peña et al. (2024), [*Frontiers in Education*](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2024.1439879/full): points, badges and progress tracking supported motivation and outcomes, while leaderboards were neutral/mixed.

## 2. Colour

| Token | Hex | Use |
|---|---|---|
| `brand-700` | `#0c7468` | **Primary** buttons and links (white text 5.6:1) |
| `brand-500/600` | `#14a394` / `#0f8b7e` | Progress bars, icons, chart bars, theme colour |
| `brand-50/100/200` | `#eaf7f4` `#d3efe8` `#a8dfd3` | Mint tints: selected states, active tab pill, trail |
| `brand-900` | `#23404a` | Headings: soft teal-slate (not navy) |
| `beacon-500` | `#ffc857` | **Sunshine**: rewards only (badges, level, celebration, quiz CTA) |
| `beacon-700` on `beacon-50` | `#8a5a00` / `#fff6dd` | Reward text and labels (5.5:1) |
| `coral-*` | `#ff8a6b` / `#ffe4dc` / text `#a63e24` | Accent (Boundaries, celebration confetti) |
| `lavender-*` | `#cbbeff` / `#f0ecff` / text `#5b47b8` | Self-care and reflection |
| `sky-soft` | `#eaf4fb` | Role-clarity accent, soft tiles |
| `ink` / `muted` | `#2b3a4a` / `#5a6b7b` | Body / secondary text |
| `canvas` | `#f3f8fb` + faint mint and lavender wash | Page background |
| red | Tailwind red | **Reserved** for Urgent help, emergencies and destructive actions |

All text pairs were checked programmatically and meet **WCAG 2.1 AA** (≥ 4.5:1).
Colour is never the only signal: pills carry words, checkmarks carry labels.

### Competency colours
Each core competency has its own icon and tint (`client/lib/competencies.ts`),
used on the journey path, module headers and badge stickers.

| Competency | Icon | Tint |
|---|---|---|
| Role clarity | Compass | sky |
| Active listening | Ear | mint |
| Boundaries | Shield | coral |
| Safe self-disclosure | Message-heart | lavender |
| Referral literacy | Signpost | sunshine |
| Self-care | Sprout | mint |

## 3. Typography & shape

- **Nunito** (via `next/font`): rounded and warm, yet very readable for longer training text. Headings use extra-bold (800); body uses regular.
- Shapes are soft: buttons are **pills** (`rounded-full`), cards `rounded-3xl`, inputs `rounded-2xl`.
- Shadows are subtle and teal-tinted (`0 2px 12px rgb(35 64 74 / 6%)`); there are no hard borders.
- Plain English at about a grade 8 reading level, in the "you" voice.

## 4. Bea, the mascot

`client/components/mascot.tsx`: a smiling lighthouse drawn as inline SVG (no
image files, so it stays light on 3G).

| Mood | Used for |
|---|---|
| `wave` | Greetings: Home, landing, sign-in, current stop on the journey |
| `cheer` | Celebrations, passed quizzes, earned badges |
| `calm` | Empty states, encouragement after a quiz that isn't passed yet |
| `think` | Not-found page, quiz invitations, "nothing here yet" |

**Rules:**
- Bea never frowns or scolds, and never mentions what the user *hasn't* done.
- She appears at most once per screen and is decorative (`aria-hidden`); the text beside her carries the meaning.
- The gentle bob animation stops under reduced motion.

## 5. Gamification components

| Component | Behaviour |
|---|---|
| **Journey path** (`journey-path.tsx`) | Modules as stepping stones on a winding dashed trail. Shows a teal check when read and a sunshine check when the badge is earned; the suggested stop glows and Bea stands beside it. Every stone is a link. The compact `JourneyStrip` version appears on Home. |
| **Celebration** (`celebration.tsx`) | Soft confetti plus Bea cheering, shown on first module completion and on a new badge. It closes itself after ~4.5s, and taps pass through to the page underneath (only the × is clickable). Under reduced motion, no confetti renders. |
| **Level and points** | A sunshine level circle and a progress bar on Home and Progress. Points come only from learning. |
| **Badge stickers** | Competency icon on its tint with a sunshine rim once collected. Locked badges read "Not yet, whenever you're ready". |

## 6. Core components

| Component | Notes |
|---|---|
| `Button` | Pill-shaped variants: `primary` (teal), `accent` (sunshine, one reward action per screen), `secondary`, `ghost`, `danger`. 44px minimum touch target, with a press "squish". |
| `Card` | White, `rounded-3xl`, soft shadow. |
| `Pill` | Tones: brand, beacon, success, danger, neutral, coral, lavender. Always carries text. |
| `ProgressBar` | `role="progressbar"`; teal gradient for learning, sunshine for levels. |
| `EmptyState` | Accepts `art={<Bea />}` and kind copy ("No sessions yet, and that's okay!"). |
| Bottom tab bar | Five items; the active tab gets a mint pill behind its icon. |

## 7. Accessibility checklist (NFR3)

- Keyboard reachable; sunshine focus ring; "Skip to content" link.
- Landmarks, one `h1` per page, labelled controls, `fieldset/legend` for radio groups.
- Journey path is an ordered list; each stone's accessible name includes its status (e.g. "Healthy Boundaries: badge earned").
- `prefers-reduced-motion` disables bobbing, pop-ins and confetti (verified by a Playwright test).
- Charts print values as text and offer a Table view.

## 8. Voice & tone

Warm, encouraging, never clinical or judgemental:
- "Welcome back! No rush."
- "Almost there! Every try helps you learn."
- "Up next · whenever you're ready"

Safety messages stay direct and always link to help.

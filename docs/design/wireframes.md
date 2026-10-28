# Wireframes & Information Architecture

Low-fidelity wireframes produced before building the UI. They capture layout and
navigation decisions; final visuals follow the [style guide](style-guide.md) and
can be compared with the screenshots in [`../screenshots`](../screenshots).

## 1. Design drivers (from the proposal)

| Driver | Source | Design response |
|---|---|---|
| Peer supporters mostly use phones, often on 3G | NFR2, NFR3 | Mobile-first layout; bottom tab bar; light pages (no heavy images); PWA offline cache |
| Must be quick to use *right after* supporting someone | FR5, FR6 | "Log a session", "Find a service" and "Self-care" one tap from Home |
| Training should feel rewarding, not competitive | §2.7, SDT | Personal points, levels and badges; **no leaderboard, no streaks** |
| Learning should feel calm and inviting, not like an LMS | Pilot feedback | "Calm Lagoon" palette, Bea the mascot, journey path, gentle celebrations (see [style guide](style-guide.md)) |
| Content is unverified during the pilot | §3.6 | Persistent "Draft content, pending expert review" banner |
| Not a clinical tool | §1.5, §3.6 | "Peer support is not therapy" notice; "Urgent help" always in the header |
| Privacy by design | NFR1 | Pseudonymous sign-up, privacy warnings on note fields, coordinators see aggregates only |

## 2. Sitemap & navigation

```
Public                     Peer supporter (all roles)             Role workspaces
──────                     ──────────────────────────             ───────────────
/  Landing                 /dashboard  Home ◄─ bottom tab 1       /admin            (admin)
/login                     /learn      Modules ◄─ tab 2             ├ /admin/modules/:id
/register                    └ /learn/:slug  Module reader          └ /admin/providers
/privacy                         └ /learn/:slug/quiz             /coordinator      (coordinator, admin)
                           /directory  Referral directory ◄─ tab 3
                           /sessions   Session log ◄─ tab 4
                             └ /sessions/new
                           /reflect    Self-care ◄─ tab 5
                           /progress   Progress & badges   ┐
                           /feedback   SUS feedback        ├ user menu (avatar)
                           /account    Account & privacy   ┘
```

**Navigation rules**
- **Mobile (< 768px):** top bar (logo · Urgent help · avatar menu) + fixed **bottom tab bar** with the 5 core tasks. Admins/coordinators get an extra strip linking to their workspace.
- **Desktop (≥ 768px):** a single top bar holding the same 5 items plus role links; content max-width 72rem.
- The active item is marked with `aria-current="page"`, a tint and an amber icon.
- Secondary pages (progress, feedback, account) sit in the avatar menu to keep the primary nav to five items.
- Every deep page has a "← back" link to its parent (e.g. Module → All modules).

## 3. Key screens

### 3.1 Home / dashboard (mobile)
```
┌──────────────────────────────┐
│ [≡Beacon]   (Urgent help) (A)│  ← sticky top bar
├──────────────────────────────┤
│ Welcome back,                │
│ amani_k                      │
│ ┌──────────────────────────┐ │
│ │ Level 2 · Listener   180 │ │  ← navy "level card"
│ │ ▓▓▓▓▓▓░░░░░░  170 to go  │ │     amber progress = reward colour
│ │ [Modules 1/6][Badges 1][Sess 2]│
│ └──────────────────────────┘ │
│ ┌ Continue learning ───────┐ │
│ │ Active Listening         │ │
│ │ ▓▓▓░░░  1 of 3 sections  │ │
│ │ [ Resume → ]             │ │
│ └──────────────────────────┘ │
│ Quick actions                │
│ [📋 Log a session        →]  │
│ [📍 Find a service       →]  │
│ [♥  Self-care check-in   →]  │
│ Your training path  View all │
│ ① Role ② Listening ③ Bound…  │
│ ⓘ Peer support is not therapy│
├──────────────────────────────┤
│ Home  Learn  Directory  Sess  Reflect │ ← bottom tab bar
└──────────────────────────────┘
```

### 3.1b Home after the "Calm Lagoon" refresh
The navy level card became a light mint card with a sunshine level circle; Bea
greets the user with a speech bubble; the numbered module list became the
compact journey strip (stepping stones). Layout order is unchanged.

```
(Bea 👋)  Hello, amani_k!
          ╭───────────────────────────────╮
          │ Welcome back! No rush. Pick up │
          │ wherever feels right today.    │
          ╰───────────────────────────────╯
┌ (Lv 2) Listener · ✨180 learning points ┐   ┌ UP NEXT · WHENEVER YOU'RE READY ┐
│ ▓▓▓▓▓▓░░░░ 170 points until next level  │   │ (👂) Active Listening            │
│ [Modules 1/6] [Badges 1] [Sessions 2]   │   │ [ Resume → ]                     │
└─────────────────────────────────────────┘   └──────────────────────────────────┘
Your learning journey                                     See the full path
(🧭✓)···(👂)···(🛡)···(💬)···(🪧)···(🌱)
```

### 3.2 Module reader (desktop)
```
┌──────────────────────────────────────────────────────────────┐
│ Beacon   Home Learn Directory Sessions Reflect   (Urgent) (A)│
├──────────────────────────────────────────────────────────────┤
│ ← All modules                                                │
│ BOUNDARIES                                                   │
│ Healthy Boundaries                     ⏱ 12 min  🏅 badge    │
│ ┌ Draft content, pending expert review ──────────────────┐   │
│ ┌──────────────┐ ┌─────────────────────────────────────────┐ │
│ │ ▓▓▓░░ 1 of 3 │ │ Section 1 of 3                          │ │
│ │ ✓ What are…  │ │ What boundaries are                     │ │
│ │ 2 Setting…   │ │ Body text… bullet list…                 │ │
│ │ 3 Confident… │ │                                         │ │
│ │ (sticky)     │ │ [← Previous]   [Mark as read & continue]│ │
│ └──────────────┘ └─────────────────────────────────────────┘ │
│                  ┌ 🏆 Module complete! Ready for the quiz? ─┐ │
│                  │ 3 questions · pass 70%     [Take quiz]  │ │
└──────────────────────────────────────────────────────────────┘
```
On mobile the section list collapses into a horizontal row of numbered steps above the content.

### 3.3 Quiz → result
```
Quiz                                   Result
┌───────────────────────────┐          ┌───────────────────────────┐
│ 1. Why do boundaries…     │          │          🏅               │
│ ( ) option A              │  submit  │          100%             │
│ (•) option B   ◄ selected │ ───────► │       You passed!         │
│ ( ) option C              │          │ [New badge: Boundaries +100]│
│ 2. …                      │          │ Review your answers ✓ ✗    │
│ 2 of 3 answered  [Submit] │          │ [Back to modules][Badges] │
└───────────────────────────┘          └───────────────────────────┘
```

### 3.4 Referral directory (mobile)
```
┌──────────────────────────────┐
│ Referral directory           │
│ ⚠ Entries pending verification│
│ [🔍 Search by name, need…  ] │
│ (All)(Emergency)(Counselling)…→ │ ← horizontally scrolling chips
│ ┌──────────────────────────┐ │
│ │[Emergency][Pending]      │ │  ← emergency always first, red tint
│ │ National Emergency Svcs  │ │
│ │ 📍 Nationwide  ☎ 112      │ │  ← tap-to-call
│ │ Log a referral →         │ │
│ └──────────────────────────┘ │
│ ┌ ALU Counselling … ───────┐ │
```

### 3.5 Log a session
```
┌──────────────────────────────┐
│ ← Sessions                   │
│ Log a support session        │
│ ⚠ Never write names or IDs   │
│ Topic        [Academic   ▾]  │
│ Outcome  (•) Listened ( ) Referred … │
│ Referral     [ALU Advising ▾]│  ← pre-filled when coming from Directory
│ Notes        [             ] │
│              [Cancel] [Save] │
└──────────────────────────────┘
        ↓ saved
"Session logged ♥. Was it heavy? [Do a check-in]"   ← nudges self-care (FR7)
```

### 3.6 Coordinator dashboard (desktop)
```
┌──────────────────────────────────────────────────────────────┐
│ Cohort dashboard              ⓘ No individual records shown │
│ [Peers 18][Completions 42][Pass rate 86%][Sessions 31]       │  ← stat tiles
│ [Referrals 12][Avg mood 3.6][Avg SUS 74]                     │
│ ┌ Module completion rate  [Table]┐ ┌ Sessions by topic [Table]┐
│ │ Role          ▓▓▓▓▓▓▓▓░ 80%    │ │ Academic  ▓▓▓▓▓▓ 12       │
│ │ Listening     ▓▓▓▓▓░░░░ 55%    │ │ Wellbeing ▓▓▓▓ 8          │
│ └────────────────────────────────┘ └───────────────────────────┘
│ ┌ Referrals by service type ┐ ┌ Session outcomes ┐ ┌ Per week ┐
```

### 3.7 Admin: module editor
```
┌──────────────────────────────────────────────────────────────┐
│ [Training modules] [Referral directory]          ← admin tabs │
│ ← All modules   Edit: Healthy Boundaries      [Save changes] │
│ Details:  Title [   ] Slug [   ] Topic [  ] Order [] Min []  │
│           Status [Published ▾]  [✓] Content verified          │
│ Sections: ┌ Section 1  [↑][↓][🗑] Heading [ ] Body [      ] ┐ │
│           [+ Add section]                                     │
│ Quiz:     Pass mark [70]%                                     │
│           ┌ Question 1  Prompt [ ]  (•)[opt A] ( )[opt B] [x]┐ │
│           [+ Add question]                                    │
└──────────────────────────────────────────────────────────────┘
```

### 3.8 Learning journey path (Learn page)
```
Mobile                                   Desktop
┌──────────────────────────┐            ┌────────────────────────────┬─────────────────┐
│ Your learning journey    │            │        (Bea)(🧭)  ◄ glow     │ UP NEXT · NO RUSH│
│ ┌ UP NEXT · NO RUSH ────┐│            │            ·                 │ (🧭) Peer Role  │
│ │ (🧭) The Peer Role    ││            │              (👂)            │ [ Start → ]      │
│ │ [ Start → ]           ││            │            ·                 ├─────────────────┤
│ └───────────────────────┘│            │        (🛡)                  │ (Bea) "Every     │
│ (Bea) "Every expert…"    │            │       ·                      │ expert started…" │
│        (🧭) ◄ suggested   │            │  (💬)                        └─────────────────┘
│           ·  (👂)         │            │       ·
│        (🛡)               │            │        (🪧)
│  (💬)                     │            │            ·  (🌱)
│        (🪧)  ·  (🌱)      │            └────────────────────────────┘
└──────────────────────────┘
```
- Stones wind left/right along a curved dotted trail; each is a link (any order allowed).
- Status: teal check = read, quiz ready · sunshine check = badge collected · glow + Bea = suggested next.
- On mobile the "Up next" card sits **above** the path so the main action needs no scrolling.

## 4. Responsive breakpoints

| Width | Layout |
|---|---|
| < 640px (`sm`) | Single column, full-width buttons on forms, bottom tab bar |
| 640–767px | Two-column card grids where useful |
| ≥ 768px (`md`) | Top navigation replaces the bottom bar |
| ≥ 1024px (`lg`) | Sidebars (module sections), 2–3 column dashboards |

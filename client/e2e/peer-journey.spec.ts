// End-to-end journeys through the real stack (client + API + database):
// - the core flow from proposal Figure 3.7: register → complete a module →
//   pass its quiz → earn a badge → find a service → log a session with a referral;
// - the gamified additions: practice conversations, skill check and test-out;
// - role views: coordinator (aggregates only) and admin.
import { test, expect, type Page, type TestInfo } from '@playwright/test';

const SHOTS = process.env.E2E_SCREENSHOTS; // optional folder for documentation screenshots
const PASSWORD = 'e2e-password-123';

async function shot(page: Page, name: string, testInfo: TestInfo) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-${name}.png`, fullPage: true });
}

/**
 * A unique username within the app's 30-character limit, whatever the device
 * name (e.g. "small-android"): the timestamp in base 36 is 8 characters.
 */
function uniqueUsername(prefix: string, testInfo: TestInfo) {
  return `${prefix}_${testInfo.project.name.slice(0, 10)}_${Date.now().toString(36)}`;
}

/** Register a fresh peer account and wait for the dashboard. */
async function registerPeer(page: Page, prefix: string, testInfo: TestInfo) {
  const username = uniqueUsername(prefix, testInfo);
  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Username (pseudonym)').fill(username);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/dashboard');
  return username;
}

async function signIn(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

// Correct answers for the "Boundaries & Confidentiality" quiz (server/src/content/modules.ts).
async function answerBoundariesQuiz(page: Page) {
  await page.getByLabel('Explain kindly that you keep things private unless you are worried about their safety').check();
  await page.getByLabel('A peer talks about hurting themselves').check();
  await page.getByLabel('Responsibility for risk is shared with the Wellness Center').check();
  await page.getByLabel('Not expected, and it can harm you and the support you give').check();
}

test('peer supporter completes the module-to-referral flow', async ({ page }, testInfo) => {
  const username = uniqueUsername('e2e', testInfo);

  await page.goto('/');
  await shot(page, '01-landing', testInfo);
  await page.getByRole('link', { name: 'Get started' }).click();

  await page.getByLabel('Username (pseudonym)').fill(username);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('checkbox').check();
  await shot(page, '02-register', testInfo);
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('heading', { name: username })).toBeVisible();
  await shot(page, '03-dashboard', testInfo);

  // Module: read every section (5 in Boundaries & Confidentiality)
  await page.goto('/learn');
  await expect(page.getByRole('list', { name: 'Your learning journey' })).toBeVisible();
  await shot(page, '04-modules', testInfo);
  await page.getByRole('link', { name: /Boundaries & Confidentiality/ }).click();
  await expect(page.getByText('Pending expert review.')).toBeVisible();
  await expect(page.getByText(/Adapted from the Solid Minds/)).toBeVisible();
  await shot(page, '05-module', testInfo);
  for (let i = 0; i < 4; i += 1) {
    await page.getByRole('button', { name: 'Mark as read & continue' }).click();
  }
  await page.getByRole('button', { name: 'Finish module' }).click();
  await expect(page.getByText('Module complete!')).toBeVisible(); // celebration

  // Quiz: pass and earn the badge
  await page.getByRole('link', { name: 'Take the quiz' }).click();
  await answerBoundariesQuiz(page);
  await shot(page, '06-quiz', testInfo);
  await page.getByRole('button', { name: 'Submit answers' }).click();
  await expect(page.getByText('You passed!')).toBeVisible();
  await expect(page.getByText(/New badge: Boundaries & Confidentiality Badge/)).toBeVisible();
  await expect(page.getByText('New badge collected!')).toBeVisible(); // celebration
  await shot(page, '07-quiz-result', testInfo);
  // The celebration must not block the page: buttons underneath stay tappable.
  await page.getByRole('link', { name: 'See my badges' }).click();
  await expect(page).toHaveURL(/\/progress$/);

  // Directory: filter, then refer
  await page.goto('/directory');
  await page.getByRole('button', { name: 'Academic', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Academic Advising/ })).toBeVisible();
  await shot(page, '08-directory', testInfo);
  await page.getByRole('link', { name: 'Log a referral to this service →' }).first().click();

  // Session log with the referral preselected
  await page.getByLabel('What was the session mainly about?').selectOption('academic');
  await page.getByLabel('Notes (optional)').fill('Discussed workload; suggested academic advising.');
  await shot(page, '09-log-session', testInfo);
  await page.getByRole('button', { name: 'Save session' }).click();
  await expect(page.getByRole('heading', { name: 'Session logged' })).toBeVisible();

  await page.goto('/sessions');
  await expect(page.getByText(/Referred to:/)).toBeVisible();
  await shot(page, '10-sessions', testInfo);

  // Self-care check-in
  await page.goto('/reflect');
  await page.getByText('Good', { exact: true }).click();
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await expect(page.getByText('Check-in saved.', { exact: false })).toBeVisible();
  await shot(page, '11-reflect', testInfo);

  await page.goto('/progress');
  await expect(page.getByText('Collected', { exact: false })).toBeVisible();
  await shot(page, '12-progress', testInfo);
});

test('lessons use interactive blocks that never block progress', async ({ page }, testInfo) => {
  await registerPeer(page, 'e2e_lb', testInfo);
  await page.goto('/learn/peers-model');
  const lesson = page.getByRole('article');

  // Section 1: key terms in bold, a "Remember" callout, and a reading time.
  await expect(lesson.locator('strong', { hasText: 'Belonging is protective' })).toBeVisible();
  await expect(lesson.getByRole('complementary', { name: 'Remember' })).toBeVisible();
  await expect(lesson.getByText(/Section 1 of 6 · about \d+ min/)).toBeVisible();
  await page.getByRole('button', { name: 'Mark as read & continue' }).click();
  await expect(page.getByText('Nice! 1 of 6 sections read')).toBeVisible();
  // Section 2: ordered ideas as a step list.
  await expect(lesson.getByRole('listitem').filter({ hasText: 'Meaning' })).toBeVisible();
  await page.getByRole('button', { name: 'Mark as read & continue' }).click();

  // Section 3: think first, then reveal a suggested answer.
  await page.getByRole('button', { name: 'Show a suggested answer' }).click();
  await expect(lesson.getByText(/Staying alongside them/)).toBeVisible();
  await page.getByRole('button', { name: 'Mark as read & continue' }).click();

  // Section 4: flip cards and a "Check yourself" question with kind feedback.
  await lesson.getByRole('button', { name: /^P \(tap/ }).click();
  await expect(lesson.getByText('being fully with the person')).toBeVisible();
  const check = lesson.getByRole('group');
  await check.getByRole('button', { name: 'Referral with care' }).click();
  await expect(lesson.getByText(/Not quite/)).toBeVisible();
  await check.getByRole('button', { name: 'Early support' }).click();
  await expect(lesson.getByText('You got there!')).toBeVisible();
  await shot(page, '22-lesson-blocks', testInfo);

  // Section 5: moving on works without touching anything.
  await page.getByRole('button', { name: 'Mark as read & continue' }).click();
  await expect(page.getByRole('heading', { name: 'What peer counseling is, and is not' })).toBeVisible();
});

test('peer plays a practice conversation, retrying after an unhelpful choice', async ({ page }, testInfo) => {
  await registerPeer(page, 'e2e_sc', testInfo);

  await page.getByRole('link', { name: 'Practice', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Practice conversations' })).toBeVisible();
  await shot(page, '16-practice', testInfo);
  await page.getByRole('link', { name: /Overwhelmed in the library/ }).click();
  await page.getByRole('button', { name: 'Start the conversation' }).click();

  // An unhelpful choice shows the consequence and Bea's feedback, then lets you retry.
  await page.getByRole('button', { name: /You’ll be fine/ }).click();
  await expect(page.getByText("Let's try another way")).toBeVisible();
  await page.getByRole('button', { name: 'Try another response' }).click();
  await expect(page.getByRole('button', { name: /You’ll be fine/ })).toBeDisabled();

  // Helpful path to the end.
  await page.getByRole('button', { name: /That sounds like a lot to carry/ }).click();
  await expect(page.getByText('Great response').first()).toBeVisible();
  await shot(page, '17-scenario', testInfo);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /So it’s not only the work/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /Let’s breathe slowly together/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /look together at who could support you/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByText('Skills you practised')).toBeVisible();
  // First tries: unhelpful, helpful, helpful, helpful → 6 of 8 points = 75%.
  await expect(page.getByText('75% insight')).toBeVisible();
  await expect(page.getByText('Conversation complete!')).toBeVisible(); // celebration
  await shot(page, '18-scenario-end', testInfo);

  await page.goto('/practice');
  await expect(page.getByText('Best insight 75%')).toBeVisible();
});

test('skill check suggests modules and a peer can test out of a quiz', async ({ page }, testInfo) => {
  await registerPeer(page, 'e2e_sk', testInfo);

  await page.getByRole('link', { name: 'Take the skill check' }).first().click();
  await page.getByRole('button', { name: 'Start the skill check' }).click();
  const counter = await page.getByText(/Question 1 of \d+/).textContent();
  const total = Number(counter?.match(/of (\d+)/)?.[1]);
  expect(total).toBeGreaterThan(0);
  for (let i = 0; i < total; i += 1) {
    await page.getByRole('radio').first().check();
    if (i < total - 1) await page.getByRole('button', { name: 'Next' }).click();
  }
  await shot(page, '19-skill-check', testInfo);
  await page.getByRole('button', { name: 'See my results' }).click();
  await expect(page.getByRole('link', { name: 'Go to my journey' })).toBeVisible();
  // Review: each answer marked right or wrong, with the correct answer shown for mistakes.
  // (Always picking the first option guarantees at least one wrong answer.)
  await expect(page.getByRole('heading', { name: 'Review your answers' })).toBeVisible();
  await expect(page.getByText('Your answer:').first()).toBeVisible();
  await expect(page.getByText('Correct answer:').first()).toBeVisible();
  await shot(page, '20-skill-results', testInfo);

  // Test out: take a quiz without reading the module.
  await page.goto('/learn/boundaries-confidentiality/quiz');
  await expect(page.getByText('Testing out')).toBeVisible();
  await answerBoundariesQuiz(page);
  await page.getByRole('button', { name: 'Submit answers' }).click();
  await expect(page.getByText('You tested out!')).toBeVisible();
});

test('coordinator sees only aggregate data', async ({ page }, testInfo) => {
  await signIn(page, 'coordinator', process.env.E2E_COORDINATOR_PASSWORD || 'BeaconCoord#2026');
  await expect(page.getByRole('heading', { name: 'Cohort dashboard' })).toBeVisible();
  await expect(page.getByText('No individual records are shown.', { exact: false })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Skill check: before and after' })).toBeVisible();
  await shot(page, '13-coordinator', testInfo);
});

test('admin can open the module editor and manage scenarios', async ({ page }, testInfo) => {
  await signIn(page, 'admin', process.env.E2E_ADMIN_PASSWORD || 'BeaconAdmin#2026');
  await expect(page.getByRole('heading', { name: 'Training modules' })).toBeVisible();
  await shot(page, '14-admin', testInfo);
  await page.getByRole('link', { name: 'Edit' }).first().click();
  await expect(page.getByRole('heading', { name: /^Edit:/ })).toBeVisible();
  await shot(page, '15-admin-editor', testInfo);

  await page.getByRole('link', { name: 'Scenarios' }).click();
  await expect(page.getByRole('heading', { name: 'Scenario role-plays' })).toBeVisible();
  await expect(page.getByText('Sensitive', { exact: true }).first()).toBeVisible();
  await shot(page, '21-admin-scenarios', testInfo);
});

test('celebrations respect reduced motion', async ({ browser }, testInfo) => {
  // People who ask their device for less motion still get the kind message, without confetti.
  const context = await browser.newContext({ ...testInfo.project.use, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await registerPeer(page, 'e2e_rm', testInfo);

  await page.goto('/learn/psychological-first-aid');
  // Flip cards still work, without the turning animation.
  await page.getByRole('button', { name: /^LOOK \(tap/ }).click();
  await expect(page.getByText(/Observe the situation and the person/)).toBeVisible();
  for (let i = 0; i < 4; i += 1) {
    await page.getByRole('button', { name: 'Mark as read & continue' }).click();
  }
  await page.getByRole('button', { name: 'Finish module' }).click();
  await expect(page.getByText('Module complete!')).toBeVisible();
  await expect(page.locator('.confetti-layer')).toBeHidden();
  await context.close();
});

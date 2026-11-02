// End-to-end API tests against a real PostgreSQL database.
// Runs only when TEST_DATABASE_URL is set (CI sets it automatically).
// WARNING: the test database is wiped before the run.
import dotenv from 'dotenv';
import type { Express } from 'express';
import type { Pool } from 'pg';
import request from 'supertest';
import { modules } from '../../src/content/modules';
import { scenarios } from '../../src/content/scenarios';
import { stories } from '../../src/content/stories';
import { helpfulPath } from '../helpers';
import type * as PoolModule from '../../src/db/pool';
import type * as MigrateModule from '../../src/db/migrate';
import type * as SeedModule from '../../src/db/seed';
import type * as AppModule from '../../src/app';

dotenv.config({ quiet: true });
const TEST_DB = process.env.TEST_DATABASE_URL;
if (TEST_DB) process.env.DATABASE_URL = TEST_DB;

const describeDb = TEST_DB ? describe : describe.skip;

// Real bcrypt hashing + DB setup is slow, especially under coverage instrumentation.
jest.setTimeout(30000);

// Answers derived from the content itself, so content edits don't break tests.
const moduleBySlug = (slug: string) => modules.find((m) => m.slug === slug)!;

interface ShownQuestion {
  index: number;
  prompt: string;
  options: string[];
}
/**
 * The server shuffles options, so answers are found by text: the position
 * (as shown) of the correct option for each question in an attempt.
 */
const answersFor = (slug: string, questions: ShownQuestion[], correct = true) =>
  questions.map((shown) => {
    const bank = moduleBySlug(slug).quiz.find((q) => q.prompt === shown.prompt)!;
    const right = shown.options.indexOf(bank.options[bank.answerIndex]!);
    return correct ? right : (right + 1) % shown.options.length;
  });

describeDb('Beacon API', () => {
  let app: Express;
  let pool: Pool;

  beforeAll(async () => {
    if (!/test/i.test(new URL(TEST_DB!).pathname)) {
      throw new Error('Refusing to wipe a database whose name does not contain "test".');
    }
    // Loaded lazily (require, typed via `import type`) so the DATABASE_URL
    // override above is in place before the config module reads it.
    ({ pool } = require('../../src/db/pool') as typeof PoolModule);
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await (require('../../src/db/migrate') as typeof MigrateModule).migrate({ log: () => {} });
    await (require('../../src/db/seed') as typeof SeedModule).seed({ log: () => {} });
    app = (require('../../src/app') as typeof AppModule).createApp();
  });

  afterAll(async () => {
    await pool.end();
  });

  const login = async (username: string, password: string) => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username, password }).expect(200);
    return agent;
  };

  describe('authentication (FR1)', () => {
    it('registers a peer supporter with an httpOnly session cookie', async () => {
      const res = await request(app).post('/api/auth/register').send({ username: 'peer_one', password: 'correct-horse', consent: true }).expect(201);
      expect(res.body.user).toMatchObject({ username: 'peer_one', role: 'peer' });
      expect(res.body.user.password_hash).toBeUndefined();
      expect(String(res.headers['set-cookie'])).toMatch(/beacon_session=.+HttpOnly/i);
    });

    it('rejects duplicate usernames case-insensitively', async () => {
      await request(app).post('/api/auth/register').send({ username: 'PEER_ONE', password: 'another-pass', consent: true }).expect(409);
    });

    it('rejects registration without consent', async () => {
      const res = await request(app).post('/api/auth/register').send({ username: 'no_consent', password: 'whatever123', consent: false }).expect(400);
      expect(res.body.details[0].field).toBe('consent');
    });

    it('rejects a wrong password with a generic message', async () => {
      const res = await request(app).post('/api/auth/login').send({ username: 'peer_one', password: 'nope' }).expect(401);
      expect(res.body.error).toMatch(/incorrect/);
    });

    it('protects routes and ends sessions on logout', async () => {
      await request(app).get('/api/modules').expect(401);
      const agent = await login('peer_one', 'correct-horse');
      await agent.get('/api/auth/me').expect(200);
      await agent.post('/api/auth/logout').expect(204);
      await agent.get('/api/auth/me').expect(401);
    });
  });

  describe('training, quizzes, test-out and badges (FR2–FR4)', () => {
    const slug = 'boundaries-confidentiality';
    let agent: request.Agent;
    beforeAll(async () => {
      agent = await login('peer_one', 'correct-horse');
    });

    it('lists the six Solid Minds modules in order, each with its scenario count', async () => {
      const res = await agent.get('/api/modules').expect(200);
      expect(res.body.modules.map((m: { slug: string }) => m.slug)).toEqual(modules.map((m) => m.slug));
      expect(res.body.modules[0]).toMatchObject({ slug: 'peers-model', status: 'not_started', sectionCount: modules[0]!.sections.length });
      const total = res.body.modules.reduce((n: number, m: { scenarioCount: number }) => n + m.scenarioCount, 0);
      expect(total).toBe(scenarios.length);
    });

    it('includes where the content came from', async () => {
      const res = await agent.get(`/api/modules/${slug}`).expect(200);
      expect(res.body.module.sourceNote).toMatch(/Solid Minds/);
    });

    it('completes a module once all sections are viewed (FR3)', async () => {
      const { body } = await agent.get(`/api/modules/${slug}`).expect(200);
      let last: request.Response | undefined;
      for (const section of body.module.sections) {
        last = await agent.post(`/api/modules/${slug}/sections/${section.id}/view`).expect(200);
      }
      const n = moduleBySlug(slug).sections.length;
      expect(last!.body).toMatchObject({ status: 'completed', sectionsViewed: n, sectionCount: n });
    });

    const start = async (quizSlug: string, mode?: 'new' | 'repeat', who = agent) =>
      (await who.post(`/api/quiz/${quizSlug}/attempts`).send(mode ? { mode } : {}).expect(201)).body.attempt as {
        attemptId: number;
        mode: string;
        canEarnBadge: boolean;
        questions: ShownQuestion[];
      };
    const submit = (attemptId: number, answers: number[], who = agent) => who.post(`/api/quiz/attempts/${attemptId}/submit`).send({ answers });

    it('describes the quiz without sending any questions or answers', async () => {
      const res = await agent.get(`/api/quiz/${slug}`).expect(200);
      expect(res.body.quiz).toMatchObject({ questionCount: 5, bankSize: moduleBySlug(slug).quiz.length, testOut: false, attempts: 0, canRepeat: false });
      expect(res.body.quiz.questions).toBeUndefined();
    });

    it('starts an attempt with 5 questions from the bank, shuffled and without answers', async () => {
      const attempt = await start(slug);
      expect(attempt).toMatchObject({ mode: 'first', canEarnBadge: true });
      expect(attempt.questions).toHaveLength(5);
      const prompts = moduleBySlug(slug).quiz.map((q) => q.prompt);
      expect(attempt.questions.every((q) => prompts.includes(q.prompt))).toBe(true);
      expect(new Set(attempt.questions.map((q) => q.prompt)).size).toBe(5); // no question twice
      expect(JSON.stringify(attempt)).not.toMatch(/answerIndex|explanation/);
    });

    it('records a failed first attempt without a badge, and flags it as rushed', async () => {
      const attempt = await start(slug);
      const res = await submit(attempt.attemptId, answersFor(slug, attempt.questions, false)).expect(200);
      // Answered instantly: faster than anyone can read 5 questions.
      expect(res.body.result).toMatchObject({ passed: false, badge: null, mode: 'first', rushed: true });
      // The review shows each question as it was displayed, with the correct answer.
      expect(res.body.result.questions[0].prompt).toBe(attempt.questions[0]!.prompt);
      expect(res.body.result.results[0].correctIndex).toBe(answersFor(slug, attempt.questions)[0]);
    });

    it('rejects a second submission of the same attempt, and attempts that belong to someone else', async () => {
      const attempt = await start(slug);
      await submit(attempt.attemptId, answersFor(slug, attempt.questions, false)).expect(200);
      await submit(attempt.attemptId, answersFor(slug, attempt.questions)).expect(409);

      const mine = await start(slug);
      const other = request.agent(app);
      await other.post('/api/auth/register').send({ username: 'quiz_snoop', password: 'snoop-pass-1', consent: true }).expect(201);
      await submit(mine.attemptId, answersFor(slug, mine.questions), other).expect(404);
      await submit(mine.attemptId, [0]).expect(400); // must answer every question
    });

    it('a repeated quiz re-asks the same questions but never awards the badge', async () => {
      const last = await start(slug);
      await submit(last.attemptId, answersFor(slug, last.questions, false)).expect(200);
      const repeat = await start(slug, 'repeat');
      expect(repeat).toMatchObject({ mode: 'repeat', canEarnBadge: false });
      expect(repeat.questions.map((q) => q.prompt).sort()).toEqual(last.questions.map((q) => q.prompt).sort());
      const res = await submit(repeat.attemptId, answersFor(slug, repeat.questions)).expect(200);
      expect(res.body.result).toMatchObject({ score: 100, passed: true, badge: null, canEarnBadge: false });
    });

    it('a new quiz prefers questions not seen yet, and awards the badge once on a pass', async () => {
      const seen = (
        await pool.query<{ id: string }>(
          `SELECT DISTINCT jsonb_array_elements_text(question_ids) AS id FROM quiz_attempts a JOIN users u USING (user_id)
           WHERE u.username = 'peer_one' AND a.submitted_at IS NOT NULL`,
        )
      ).rows.map((r) => r.id);
      const fresh = await start(slug, 'new');
      expect(fresh.mode).toBe('new');
      const unseen = moduleBySlug(slug).quiz.filter((q) => !seen.includes(q.id)).map((q) => q.prompt);
      // Every unseen question is drawn before any seen one is repeated.
      expect(fresh.questions.filter((q) => unseen.includes(q.prompt))).toHaveLength(Math.min(5, unseen.length));

      const first = await submit(fresh.attemptId, answersFor(slug, fresh.questions)).expect(200);
      expect(first.body.result).toMatchObject({ score: 100, passed: true, badge: { isNew: true }, testedOut: false });
      const again = await start(slug, 'new');
      const second = await submit(again.attemptId, answersFor(slug, again.questions)).expect(200);
      expect(second.body.result.badge).toBeNull();
    });

    it('lets a peer test out of a module they already know', async () => {
      const quiz = await agent.get('/api/quiz/referral-with-care').expect(200);
      expect(quiz.body.quiz.testOut).toBe(true);
      const attempt = await start('referral-with-care');
      const res = await submit(attempt.attemptId, answersFor('referral-with-care', attempt.questions)).expect(200);
      expect(res.body.result).toMatchObject({ passed: true, testedOut: true, badge: { isNew: true } });
    });

    it('reports points, level and badges; sections clicked through too fast earn no points', async () => {
      const res = await agent.get('/api/progress').expect(200);
      // Every section above was marked read instantly (rushed): 0 x 10 + 1 module x 50 + 2 badges x 100
      expect(res.body.progress).toMatchObject({ points: 50 + 200, modulesCompleted: 1, carefulReads: 0, name: 'Listener' });
      expect(res.body.progress.badges).toHaveLength(2);
      // First tries: 0% on Boundaries (all wrong) and 100% when testing out of Referral.
      expect(res.body.progress).toMatchObject({ firstTryAverage: 50, firstTries: 2 });
    });

    it('measures reading time on the server: a careful read earns points, a rushed one is flagged', async () => {
      const read = 'peers-model';
      const { body } = await agent.get(`/api/modules/${read}`).expect(200);
      const [first, second] = body.module.sections;
      const rushed = await agent.post(`/api/modules/${read}/sections/${first.id}/view`).expect(200);
      expect(rushed.body.rushed).toBe(true);

      // Pretend the learner spent five minutes on the next section.
      await pool.query(
        `UPDATE module_activity SET last_seen_at = now() - interval '5 minutes'
         WHERE user_id = (SELECT user_id FROM users WHERE username = 'peer_one')`,
      );
      const careful = await agent.post(`/api/modules/${read}/sections/${second.id}/view`).expect(200);
      expect(careful.body.rushed).toBe(false);
      // Marking the same section again changes nothing.
      const again = await agent.post(`/api/modules/${read}/sections/${second.id}/view`).expect(200);
      expect(again.body.rushed).toBe(false);

      const progress = await agent.get('/api/progress').expect(200);
      expect(progress.body.progress).toMatchObject({ carefulReads: 1, points: 10 + 50 + 200 });
    });
  });

  describe('scenario role-plays', () => {
    const scenario = scenarios.find((s) => s.slug === 'exam-week-overwhelm')!;
    let agent: request.Agent;
    beforeAll(async () => {
      agent = await login('peer_one', 'correct-horse');
    });

    it('lists published scenarios, flagging sensitive ones', async () => {
      const res = await agent.get('/api/scenarios').expect(200);
      expect(res.body.scenarios).toHaveLength(scenarios.length);
      expect(res.body.scenarios.find((s: { slug: string }) => s.slug === 'promise-not-to-tell')).toMatchObject({ sensitive: true, completed: false });
    });

    it('serves the full script so learners can explore consequences', async () => {
      const res = await agent.get(`/api/scenarios/${scenario.slug}`).expect(200);
      expect(res.body.scenario.script.start).toBe(scenario.script.start);
      expect(res.body.scenario.persona.name).toBe(scenario.persona.name);
    });

    it('scores an ideal play-through as 100 and awards points only the first time', async () => {
      const path = helpfulPath(scenario.script);
      const first = await agent.post(`/api/scenarios/${scenario.slug}/complete`).send({ path }).expect(201);
      expect(first.body.result).toMatchObject({ insightScore: 100, retries: 0, firstCompletion: true });
      const again = await agent.post(`/api/scenarios/${scenario.slug}/complete`).send({ path }).expect(201);
      expect(again.body.result.firstCompletion).toBe(false);
    });

    it('lets learners retry after an unhelpful choice, scoring only first tries', async () => {
      const ideal = helpfulPath(scenario.script);
      const start = scenario.script.nodes[scenario.script.start];
      if (start?.kind !== 'step') throw new Error('bad fixture');
      const unhelpful = start.choices.findIndex((c) => c.quality === 'unhelpful');
      const path = [{ nodeId: scenario.script.start, choice: unhelpful }, ...ideal];
      const res = await agent.post(`/api/scenarios/${scenario.slug}/complete`).send({ path }).expect(201);
      expect(res.body.result.retries).toBe(1);
      expect(res.body.result.insightScore).toBeLessThan(100);
    });

    it('rejects a path that is not possible in the script', async () => {
      await agent.post(`/api/scenarios/${scenario.slug}/complete`).send({ path: [{ nodeId: 'end', choice: 0 }] }).expect(400);
    });

    it('counts completed scenarios in progress, with points once per scenario', async () => {
      const res = await agent.get('/api/progress').expect(200);
      expect(res.body.progress).toMatchObject({ scenariosCompleted: 1, scenariosTotal: scenarios.length });
    });
  });

  describe('skill check (placement and RQ3 pre/post test)', () => {
    let agent: request.Agent;
    beforeAll(async () => {
      agent = await login('peer_one', 'correct-horse');
    });

    it('serves two questions per module, without answers', async () => {
      const res = await agent.get('/api/skill-check').expect(200);
      expect(res.body.questions).toHaveLength(modules.length * 2);
      expect(res.body.latest).toEqual({ pre: null, post: null });
      expect(JSON.stringify(res.body)).not.toMatch(/answerIndex/);
    });

    it('uses its own questions, none of which appear in a quiz', async () => {
      const res = await agent.get('/api/skill-check').expect(200);
      const quizPrompts = new Set(modules.flatMap((m) => m.quiz.map((q) => q.prompt)));
      expect(res.body.questions.some((q: { prompt: string }) => quizPrompts.has(q.prompt))).toBe(false);
    });

    it('requires every question to be answered', async () => {
      await agent.post('/api/skill-check').send({ answers: [{ questionId: 'peers-model:s0', answer: 0 }] }).expect(400);
    });

    it('reports strengths and areas to practise per module', async () => {
      // Correct for the first module only, wrong for everything else.
      const answers = modules.flatMap((m, mi) =>
        m.skillCheck.map((q, qi) => ({
          questionId: `${m.slug}:s${qi}`,
          answer: mi === 0 ? q.answerIndex : (q.answerIndex + 1) % q.options.length,
        })),
      );
      const res = await agent.post('/api/skill-check').send({ kind: 'pre', answers }).expect(201);
      const { results, score } = res.body.result;
      expect(score).toBe(Math.round((2 / (modules.length * 2)) * 100));
      expect(results[0]).toMatchObject({ slug: modules[0]!.slug, level: 'strong', correct: 2, total: 2 });
      expect(results.slice(1).every((r: { level: string }) => r.level === 'practise')).toBe(true);

      // After submitting, the peer gets a review: their answer, right or wrong, and why,
      // but never the correct option (so retaking the check stays meaningful).
      const firstWrong = modules[1]!.skillCheck[0]!;
      expect(results[1].questions[0]).toEqual({
        prompt: firstWrong.prompt,
        options: firstWrong.options,
        chosen: (firstWrong.answerIndex + 1) % firstWrong.options.length,
        correct: false,
        explanation: firstWrong.explanation,
      });
      expect(results[0].questions.every((q: { correct: boolean }) => q.correct)).toBe(true);
      expect(JSON.stringify(res.body)).not.toMatch(/correctIndex|answerIndex/);

      // The review is kept with the attempt, so it is still there when the peer comes back.
      const latest = await agent.get('/api/skill-check').expect(200);
      expect(latest.body.latest.pre.score).toBe(score);
      expect(latest.body.latest.pre.results[1].questions[0]).toMatchObject({ correct: false, explanation: firstWrong.explanation });
      expect(JSON.stringify(latest.body)).not.toMatch(/correctIndex|answerIndex/);
      // Questions for a new attempt still never include answers.
      // (Checks field names, not raw text: an option's wording may contain words like "explanation".)
      for (const q of latest.body.questions) {
        expect(Object.keys(q).sort()).toEqual(['id', 'moduleSlug', 'moduleTitle', 'options', 'prompt', 'topic']);
      }
    });
  });

  describe('directory, sessions and referrals (FR5–FR6)', () => {
    let agent: request.Agent;
    let wellnessId: number;
    beforeAll(async () => {
      agent = await login('peer_one', 'correct-horse');
    });

    it('lists verified services with their contact details', async () => {
      const { body } = await agent.get('/api/providers').expect(200);
      expect(body.providers.every((p: { verified: boolean }) => p.verified)).toBe(true);
      expect(JSON.stringify(body)).not.toMatch(/to be confirmed|placeholder/i);
      const byName = (name: string) => body.providers.find((p: { name: string }) => p.name === name);
      expect(byName('ALU Emergency Line')).toMatchObject({ serviceType: 'emergency', contact: '+250 787 414 774' });
      expect(byName('Solid Minds Counselling Clinic')).toMatchObject({ email: 'info@solidminds.rw', hours: expect.stringMatching(/Mon–Sat/) });
      expect(byName('ALU Financial Aid Office')).toMatchObject({ website: 'https://support.alueducation.com/finance', hours: '' });
      expect(byName('ALU Student Success')).toMatchObject({ email: 'studentsuccess_rw@alueducation.com' });
      expect(byName('Campus Health Services (placeholder)')).toBeUndefined();
    });

    it('lists ALU Wellness & Counselling and searches by keyword and category', async () => {
      const all = await agent.get('/api/providers').expect(200);
      expect(all.body.providers[0].serviceType).toBe('emergency');
      const counselling = await agent.get('/api/providers?category=counselling').expect(200);
      expect(counselling.body.providers.every((p: { serviceType: string }) => p.serviceType === 'counselling')).toBe(true);
      const wellness = counselling.body.providers.find((p: { name: string }) => p.name === 'ALU Wellness & Counselling');
      expect(wellness).toBeDefined();
      wellnessId = wellness.id;
      const search = await agent.get('/api/providers?q=financial').expect(200);
      expect(search.body.providers).toHaveLength(1);
      await agent.get('/api/providers?category=astrology').expect(400);
    });

    it('treats LIKE wildcards in a search literally', async () => {
      const res = await agent.get('/api/providers?q=%25').expect(200);
      expect(res.body.providers).toHaveLength(0);
    });

    it('logs a session with a referral and encrypts the notes at rest', async () => {
      await agent
        .post('/api/sessions')
        .send({ category: 'wellbeing', notes: 'Talked about exam stress', outcome: 'referred', providerId: wellnessId })
        .expect(201);
      const list = await agent.get('/api/sessions').expect(200);
      expect(list.body.sessions[0]).toMatchObject({ notes: 'Talked about exam stress', referral: { providerId: wellnessId } });

      const raw = await pool.query<{ notes_enc: string }>('SELECT notes_enc FROM support_sessions');
      expect(raw.rows[0]!.notes_enc).not.toContain('exam stress');
    });

    it("keeps each peer's sessions private", async () => {
      const other = request.agent(app);
      await other.post('/api/auth/register').send({ username: 'peer_two', password: 'second-pass', consent: true }).expect(201);
      const res = await other.get('/api/sessions').expect(200);
      expect(res.body.sessions).toHaveLength(0);
    });
  });

  describe('self-care and feedback (FR7–FR8)', () => {
    it('stores reflections and anonymous SUS feedback', async () => {
      const agent = await login('peer_one', 'correct-horse');
      await agent.post('/api/reflections').send({ moodRating: 2, freeText: 'Heavy day' }).expect(201);
      await agent.post('/api/reflections').send({ moodRating: 7 }).expect(400);
      const list = await agent.get('/api/reflections').expect(200);
      expect(list.body.reflections[0]).toMatchObject({ moodRating: 2, freeText: 'Heavy day' });

      const fb = await agent.post('/api/feedback').send({ susAnswers: [5, 1, 5, 1, 5, 1, 5, 1, 5, 1] }).expect(201);
      expect(fb.body.susScore).toBe(100);
      const cols = await pool.query<{ column_name: string }>("SELECT column_name FROM information_schema.columns WHERE table_name = 'feedback'");
      expect(cols.rows.map((c) => c.column_name)).not.toContain('user_id');
    });
  });

  describe('roles: admin (FR9) and coordinator (FR10)', () => {
    it('blocks peers from admin and dashboard routes', async () => {
      const agent = await login('peer_one', 'correct-horse');
      await agent.get('/api/admin/modules').expect(403);
      await agent.get('/api/admin/scenarios').expect(403);
      await agent.get('/api/dashboard').expect(403);
    });

    it('lets an admin create, publish and archive content', async () => {
      const admin = await login('admin', 'BeaconAdmin#2026');
      const created = await admin
        .post('/api/admin/modules')
        .send({
          slug: 'crisis-awareness',
          title: 'Crisis Awareness',
          topic: 'Referral',
          status: 'published',
          sections: [{ heading: 'Intro', body: 'Placeholder' }],
          quiz: { questionsPerAttempt: 1, questions: [{ prompt: 'Pick one', options: ['a', 'b'], answerIndex: 0 }] },
        })
        .expect(201);
      const id = created.body.module.id;
      // New questions get a stable id, so attempts can refer to them.
      expect(created.body.module.quiz.questions[0].id).toMatch(/^m\d+-q1$/);
      expect(created.body.module.quiz.questionsPerAttempt).toBe(1);

      const peer = await login('peer_one', 'correct-horse');
      let list = (await peer.get('/api/modules')).body.modules as { slug: string }[];
      expect(list.map((m) => m.slug)).toContain('crisis-awareness');

      await admin.patch(`/api/admin/modules/${id}/status`).send({ status: 'archived' }).expect(204);
      list = (await peer.get('/api/modules')).body.modules;
      expect(list.map((m) => m.slug)).not.toContain('crisis-awareness');

      await admin
        .post('/api/admin/modules')
        .send({
          slug: 'too-few',
          title: 'Too few questions',
          topic: 'Referral',
          sections: [{ heading: 'Intro', body: 'Text' }],
          quiz: { questionsPerAttempt: 3, questions: [{ prompt: 'Pick one', options: ['a', 'b'], answerIndex: 0 }] },
        })
        .expect(400);

      await admin.post('/api/admin/providers').send({ name: 'Bad Clinic', serviceType: 'medical', website: 'http://insecure.example' }).expect(400);
      await admin.post('/api/admin/providers').send({ name: 'Bad Clinic', serviceType: 'medical', email: 'not-an-email' }).expect(400);
      const provider = await admin
        .post('/api/admin/providers')
        .send({ name: 'Test Clinic', serviceType: 'medical', verified: true, email: 'clinic@example.org', website: 'https://example.org' })
        .expect(201);
      expect(provider.body.provider).toMatchObject({ email: 'clinic@example.org', website: 'https://example.org' });
      await admin.patch(`/api/admin/providers/${provider.body.provider.id}/archive`).send({ archived: true }).expect(204);
      const search = await peer.get('/api/providers?q=Test%20Clinic').expect(200);
      expect(search.body.providers).toHaveLength(0);
    });

    it('lets an admin switch a scenario off, hiding it from peers', async () => {
      const admin = await login('admin', 'BeaconAdmin#2026');
      const { body } = await admin.get('/api/admin/scenarios').expect(200);
      const sensitive = body.scenarios.find((s: { slug: string }) => s.slug === 'promise-not-to-tell');
      expect(sensitive.sensitive).toBe(true);
      await admin.patch(`/api/admin/scenarios/${sensitive.id}/status`).send({ status: 'draft' }).expect(204);

      const peer = await login('peer_one', 'correct-horse');
      const visible = (await peer.get('/api/scenarios')).body.scenarios as { slug: string }[];
      expect(visible.map((s) => s.slug)).not.toContain('promise-not-to-tell');
      await peer.get('/api/scenarios/promise-not-to-tell').expect(404);

      await admin.patch(`/api/admin/scenarios/${sensitive.id}/status`).send({ status: 'published' }).expect(204);
    });

    it('gives coordinators aggregates only, with small groups suppressed', async () => {
      const coord = await login('coordinator', 'BeaconCoord#2026');
      const { body } = await coord.get('/api/dashboard').expect(200);
      expect(body.dashboard.overview).toMatchObject({ peers: 4, sessionsLogged: 1, referralsMade: 1, badgesAwarded: 2, scenarioCompletions: 3 });
      expect(body.dashboard.wellbeing.averageMood).toBeNull(); // only 1 reflection < minimum group size
      expect(body.dashboard.skillCheck).toMatchObject({ prePeople: 1, preAverage: null }); // suppressed for 1 person
      // Learning quality: counts are shown, but rates from a single person are hidden.
      expect(body.dashboard.learningQuality).toMatchObject({ readingPeople: 1, rushedReadRate: null, firstTryPeople: 1, firstTryAverage: null });
      expect(body.dashboard.learningQuality.attemptsByMode.repeat).toBeGreaterThan(0);
      expect(JSON.stringify(body)).not.toMatch(/peer_one|exam stress|Heavy day/);
    });
  });

  describe('refreshing module text on a live database', () => {
    const seed = (options: Parameters<typeof SeedModule.seed>[0]) => (require('../../src/db/seed') as typeof SeedModule).seed(options);
    const sectionsOf = async (slug: string) =>
      (
        await pool.query<{ section_id: number; body: string }>(
          `SELECT s.section_id, s.body FROM module_sections s JOIN training_modules m USING (module_id)
           WHERE m.slug = $1 ORDER BY s.order_index`,
          [slug],
        )
      ).rows;
    const viewsOf = async (slug: string) =>
      Number(
        (
          await pool.query(
            `SELECT count(*) FROM section_views v JOIN module_sections s USING (section_id)
             JOIN training_modules m USING (module_id) WHERE m.slug = $1`,
            [slug],
          )
        ).rows[0].count,
      );

    it('updates older text in place, keeping section ids and reading progress', async () => {
      const slug = 'boundaries-confidentiality'; // peer_one has read this module
      const before = await sectionsOf(slug);
      const viewsBefore = await viewsOf(slug);
      expect(viewsBefore).toBeGreaterThan(0);
      // Pretend the database still has an older version of the text.
      await pool.query(`UPDATE module_sections SET body = 'Old plain text' WHERE section_id = ANY($1::int[])`, [before.map((s) => s.section_id)]);
      await pool.query('UPDATE training_modules SET content_version = 0 WHERE slug = $1', [slug]);
      // ...and the old 4-question quiz, with no skill-check questions.
      await pool.query(
        `UPDATE quizzes SET questions = $2, skill_questions = '[]' WHERE module_id = (SELECT module_id FROM training_modules WHERE slug = $1)`,
        [slug, JSON.stringify(moduleBySlug(slug).quiz.slice(0, 4))],
      );

      await seed({ log: () => {} });
      const quiz = await pool.query<{ questions: unknown[]; skill_questions: unknown[] }>(
        'SELECT questions, skill_questions FROM quizzes WHERE module_id = (SELECT module_id FROM training_modules WHERE slug = $1)',
        [slug],
      );
      expect(quiz.rows[0]!.questions).toHaveLength(moduleBySlug(slug).quiz.length);
      expect(quiz.rows[0]!.skill_questions).toHaveLength(moduleBySlug(slug).skillCheck.length);

      const after = await sectionsOf(slug);
      expect(after.map((s) => s.section_id)).toEqual(before.map((s) => s.section_id));
      expect(after.map((s) => s.body)).toEqual(moduleBySlug(slug).sections.map((s) => s.body));
      expect(await viewsOf(slug)).toBe(viewsBefore);
      const { rows } = await pool.query('SELECT content_version FROM training_modules WHERE slug = $1', [slug]);
      expect(rows[0].content_version).toBe(moduleBySlug(slug).version);
    });

    it('never overwrites a module an admin has edited', async () => {
      const slug = 'caring-for-yourself';
      const admin = await login('admin', 'BeaconAdmin#2026');
      const { rows } = await pool.query('SELECT module_id FROM training_modules WHERE slug = $1', [slug]);
      const edit = (await admin.get(`/api/admin/modules/${rows[0].module_id}`).expect(200)).body.module;
      edit.sections[0].body = 'Reviewed wording from Solid Minds';
      await admin.put(`/api/admin/modules/${edit.id}`).send(edit).expect(200);
      await pool.query('UPDATE training_modules SET content_version = 0 WHERE slug = $1', [slug]);

      await seed({ log: () => {} });

      expect((await sectionsOf(slug))[0]!.body).toBe('Reviewed wording from Solid Minds');
    });

    it('renames older directory entries in place, retires old ones and never overwrites admin edits', async () => {
      const count = async (name: string) =>
        Number((await pool.query('SELECT count(*) FROM providers WHERE name = $1 AND NOT archived', [name])).rows[0].count);
      // Pretend the database still holds the earlier, unverified entries.
      await pool.query(`UPDATE providers SET name = 'ALU Academic Advising (placeholder)', email = '', verified = false WHERE name = 'ALU Student Success'`);
      await pool.query(
        `INSERT INTO providers (name, service_type, contact) VALUES ('Campus Health Services (placeholder)', 'medical', 'To be confirmed')`,
      );
      const admin = await login('admin', 'BeaconAdmin#2026');
      const { body } = await admin.get('/api/admin/providers').expect(200);
      const solid = body.providers.find((p: { name: string }) => p.name === 'Solid Minds Counselling Clinic');
      await admin.put(`/api/admin/providers/${solid.id}`).send({ ...solid, description: 'Edited by an admin' }).expect(200);

      await seed({ log: () => {} });

      expect(await count('ALU Academic Advising (placeholder)')).toBe(0);
      expect(await count('ALU Student Success')).toBe(1);
      const success = await pool.query('SELECT email, verified FROM providers WHERE name = $1', ['ALU Student Success']);
      expect(success.rows[0]).toEqual({ email: 'studentsuccess_rw@alueducation.com', verified: true });
      expect(await count('Campus Health Services (placeholder)')).toBe(0);
      const kept = await pool.query('SELECT description FROM providers WHERE provider_id = $1', [solid.id]);
      expect(kept.rows[0].description).toBe('Edited by an admin');
    });
  });

  describe('daily stories and streak', () => {
    let agent: request.Agent;
    beforeAll(async () => {
      agent = await login('peer_one', 'correct-horse');
    });

    it("serves today's story and the full list", async () => {
      const { body } = await agent.get('/api/stories').expect(200);
      expect(body.stories).toHaveLength(stories.length);
      expect(stories.map((s) => s.slug)).toContain(body.today.slug);
      expect(body.today).toMatchObject({ read: false, module: { slug: expect.any(String) } });
      // Everyone sees the same story on the same day.
      const other = await login('admin', 'BeaconAdmin#2026');
      expect((await other.get('/api/stories').expect(200)).body.today.slug).toBe(body.today.slug);
    });

    it('earns points the first time a story is read, never twice', async () => {
      const before = (await agent.get('/api/progress')).body.progress.points;
      const first = await agent.post(`/api/stories/${stories[0]!.slug}/read`).expect(200);
      expect(first.body).toEqual({ firstRead: true, pointsEarned: 15 });
      const second = await agent.post(`/api/stories/${stories[0]!.slug}/read`).expect(200);
      expect(second.body).toEqual({ firstRead: false, pointsEarned: 0 });
      const after = (await agent.get('/api/progress')).body.progress;
      expect(after.points).toBe(before + 15);
      expect(after.storiesRead).toBe(1);
      await agent.get('/api/stories/not-a-story').expect(404);
    });

    it('counts today in the learning streak once there is activity', async () => {
      const { body } = await agent.get('/api/progress').expect(200);
      expect(body.progress.streak).toMatchObject({ current: 1, best: 1, activeToday: true, restDaysPerWeek: 1 });
      const fresh = request.agent(app);
      await fresh.post('/api/auth/register').send({ username: 'streak_new', password: 'streak-pass-1', consent: true }).expect(201);
      const none = await fresh.get('/api/progress').expect(200);
      expect(none.body.progress.streak).toMatchObject({ current: 0, best: 0, activeToday: false });
    });
  });

  describe('community wall (anonymous)', () => {
    let author: request.Agent;
    let reader: request.Agent;
    beforeAll(async () => {
      author = await login('peer_one', 'correct-horse');
      reader = await login('streak_new', 'streak-pass-1');
    });

    it('shares a mood anonymously: no names, ids or exact times', async () => {
      const created = await author.post('/api/community/posts').send({ mood: 2, note: 'Exams are piling up' }).expect(201);
      expect(created.body.post).toMatchObject({ mood: 2, note: 'Exams are piling up', mine: true, needsCare: false });
      const { body } = await reader.get('/api/community/posts').expect(200);
      const post = body.posts.find((p: { id: number }) => p.id === created.body.post.id);
      expect(post.mine).toBe(false);
      expect(JSON.stringify(body)).not.toMatch(/peer_one|user_?id|username/i);
      expect(new Date(post.postedAt).getUTCMinutes()).toBe(0); // rounded to the hour
      await author.post('/api/community/posts').send({ mood: 9 }).expect(400);
      await author.post('/api/community/posts').send({ mood: 3, note: 'x'.repeat(281) }).expect(400);
    });

    it('flags notes that may mention risk, without blocking them', async () => {
      const res = await author.post('/api/community/posts').send({ mood: 1, note: 'I don’t want to be here anymore' }).expect(201);
      expect(res.body.post.needsCare).toBe(true);
    });

    it('lets peers send and take back kind messages, from a fixed set only', async () => {
      const { body } = await reader.get('/api/community/posts').expect(200);
      const id = body.posts[0].id;
      const sent = await reader.post(`/api/community/posts/${id}/support`).send({ kind: 'hug' }).expect(200);
      expect(sent.body.post).toMatchObject({ supports: { hug: 1 }, mySupports: ['hug'] });
      const undone = await reader.post(`/api/community/posts/${id}/support`).send({ kind: 'hug' }).expect(200);
      expect(undone.body.post.supports.hug).toBe(0);
      await reader.post(`/api/community/posts/${id}/support`).send({ kind: 'any text I like' }).expect(400);
    });

    it('hides a post after three reports until an admin restores it', async () => {
      const post = (await author.post('/api/community/posts').send({ mood: 3, note: 'Reported post' }).expect(201)).body.post;
      await author.post(`/api/community/posts/${post.id}/report`).expect(409); // not your own
      const reporters = [reader, await login('admin', 'BeaconAdmin#2026'), await login('demo_peer', 'BeaconPeer#2026')];
      const results = [];
      for (const r of reporters) results.push((await r.post(`/api/community/posts/${post.id}/report`).expect(200)).body.hidden);
      expect(results).toEqual([false, false, true]);
      const wall = (await reader.get('/api/community/posts')).body.posts as { id: number }[];
      expect(wall.map((p) => p.id)).not.toContain(post.id);

      const admin = await login('admin', 'BeaconAdmin#2026');
      const queue = (await admin.get('/api/admin/community').expect(200)).body.posts;
      expect(queue.find((p: { id: number }) => p.id === post.id)).toMatchObject({ hidden: true, reports: 3 });
      expect(JSON.stringify(queue)).not.toMatch(/peer_one|user_?id/i);
      await reader.get('/api/admin/community').expect(403);
      await admin.patch(`/api/admin/community/${post.id}`).send({ hidden: false }).expect(204);
      expect(((await reader.get('/api/community/posts')).body.posts as { id: number }[]).map((p) => p.id)).toContain(post.id);
    });

    it('removes posts older than 7 days from the wall, and lets authors delete their own', async () => {
      const post = (await author.post('/api/community/posts').send({ mood: 4, note: 'Old news' }).expect(201)).body.post;
      await reader.delete(`/api/community/posts/${post.id}`).expect(404); // not theirs
      await pool.query("UPDATE mood_posts SET created_at = now() - interval '8 days' WHERE post_id = $1", [post.id]);
      expect(((await reader.get('/api/community/posts')).body.posts as { id: number }[]).map((p) => p.id)).not.toContain(post.id);
      await author.delete(`/api/community/posts/${post.id}`).expect(204);
    });

    it('limits how often someone can post in a day', async () => {
      const busy = request.agent(app);
      await busy.post('/api/auth/register').send({ username: 'busy_poster', password: 'busy-pass-1', consent: true }).expect(201);
      for (let i = 0; i < 5; i += 1) await busy.post('/api/community/posts').send({ mood: 3 }).expect(201);
      await busy.post('/api/community/posts').send({ mood: 3 }).expect(400);
    });
  });

  describe('privacy rights', () => {
    it('deletes an account and all linked records', async () => {
      const agent = await login('peer_two', 'second-pass');
      await agent.delete('/api/auth/me').expect(204);
      await request(app).post('/api/auth/login').send({ username: 'peer_two', password: 'second-pass' }).expect(401);
    });
  });

  it('returns JSON 404s for unknown routes', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    expect(res.body.error).toBeDefined();
  });
});

// End-to-end API tests against a real PostgreSQL database.
// Runs only when TEST_DATABASE_URL is set (CI sets it automatically).
// WARNING: the test database is wiped before the run.
import dotenv from 'dotenv';
import type { Express } from 'express';
import type { Pool } from 'pg';
import request from 'supertest';
import { modules } from '../../src/content/modules';
import { scenarios } from '../../src/content/scenarios';
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
const correctAnswers = (slug: string) => moduleBySlug(slug).quiz.map((q) => q.answerIndex);
const wrongAnswers = (slug: string) => moduleBySlug(slug).quiz.map((q) => (q.answerIndex + 1) % q.options.length);

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

    it('never sends correct answers to the client', async () => {
      const res = await agent.get(`/api/quiz/${slug}`).expect(200);
      expect(res.body.quiz.questions).toHaveLength(moduleBySlug(slug).quiz.length);
      expect(res.body.quiz.testOut).toBe(false);
      expect(JSON.stringify(res.body)).not.toMatch(/answerIndex/);
    });

    it('records a failed attempt without a badge', async () => {
      const res = await agent.post(`/api/quiz/${slug}/submit`).send({ answers: wrongAnswers(slug) }).expect(200);
      expect(res.body.result).toMatchObject({ passed: false, badge: null });
    });

    it('awards a badge once on a passing attempt', async () => {
      const first = await agent.post(`/api/quiz/${slug}/submit`).send({ answers: correctAnswers(slug) }).expect(200);
      expect(first.body.result).toMatchObject({ score: 100, passed: true, badge: { isNew: true }, testedOut: false });
      const second = await agent.post(`/api/quiz/${slug}/submit`).send({ answers: correctAnswers(slug) }).expect(200);
      expect(second.body.result.badge).toBeNull();
    });

    it('lets a peer test out of a module they already know', async () => {
      const quiz = await agent.get('/api/quiz/referral-with-care').expect(200);
      expect(quiz.body.quiz.testOut).toBe(true);
      const res = await agent.post('/api/quiz/referral-with-care/submit').send({ answers: correctAnswers('referral-with-care') }).expect(200);
      expect(res.body.result).toMatchObject({ passed: true, testedOut: true, badge: { isNew: true } });
    });

    it('reports points, level and badges', async () => {
      const res = await agent.get('/api/progress').expect(200);
      // 5 sections x 10 + 1 module x 50 + 2 badges x 100
      const sections = moduleBySlug(slug).sections.length;
      expect(res.body.progress).toMatchObject({ points: sections * 10 + 50 + 200, modulesCompleted: 1, name: 'Listener' });
      expect(res.body.progress.badges).toHaveLength(2);
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

    it('requires every question to be answered', async () => {
      await agent.post('/api/skill-check').send({ answers: [{ questionId: 'peers-model:0', answer: 0 }] }).expect(400);
    });

    it('reports strengths and areas to practise per module', async () => {
      // Correct for the first module only, wrong for everything else.
      const answers = modules.flatMap((m, mi) =>
        m.quiz.slice(0, 2).map((q, qi) => ({
          questionId: `${m.slug}:${qi}`,
          answer: mi === 0 ? q.answerIndex : (q.answerIndex + 1) % q.options.length,
        })),
      );
      const res = await agent.post('/api/skill-check').send({ kind: 'pre', answers }).expect(201);
      const { results, score } = res.body.result;
      expect(score).toBe(Math.round((2 / (modules.length * 2)) * 100));
      expect(results[0]).toMatchObject({ slug: modules[0]!.slug, level: 'strong', correct: 2, total: 2 });
      expect(results.slice(1).every((r: { level: string }) => r.level === 'practise')).toBe(true);

      // After submitting, the peer gets a review: their answer, the correct one and why.
      const firstWrong = modules[1]!.quiz[0]!;
      expect(results[1].questions[0]).toEqual({
        prompt: firstWrong.prompt,
        options: firstWrong.options,
        chosen: (firstWrong.answerIndex + 1) % firstWrong.options.length,
        correctIndex: firstWrong.answerIndex,
        correct: false,
        explanation: firstWrong.explanation,
      });
      expect(results[0].questions.every((q: { correct: boolean }) => q.correct)).toBe(true);

      // The review is kept with the attempt, so it is still there when the peer comes back.
      const latest = await agent.get('/api/skill-check').expect(200);
      expect(latest.body.latest.pre.score).toBe(score);
      expect(latest.body.latest.pre.results[1].questions[0].correctIndex).toBe(firstWrong.answerIndex);
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

    it('lists the ALU Wellness Center and searches by keyword and category', async () => {
      const all = await agent.get('/api/providers').expect(200);
      expect(all.body.providers[0].serviceType).toBe('emergency');
      const counselling = await agent.get('/api/providers?category=counselling').expect(200);
      expect(counselling.body.providers.every((p: { serviceType: string }) => p.serviceType === 'counselling')).toBe(true);
      const wellness = counselling.body.providers.find((p: { name: string }) => p.name === 'ALU Wellness Center');
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
          quiz: { questions: [{ prompt: 'Pick one', options: ['a', 'b'], answerIndex: 0 }] },
        })
        .expect(201);
      const id = created.body.module.id;

      const peer = await login('peer_one', 'correct-horse');
      let list = (await peer.get('/api/modules')).body.modules as { slug: string }[];
      expect(list.map((m) => m.slug)).toContain('crisis-awareness');

      await admin.patch(`/api/admin/modules/${id}/status`).send({ status: 'archived' }).expect(204);
      list = (await peer.get('/api/modules')).body.modules;
      expect(list.map((m) => m.slug)).not.toContain('crisis-awareness');

      const provider = await admin.post('/api/admin/providers').send({ name: 'Test Clinic', serviceType: 'medical', verified: true }).expect(201);
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
      expect(body.dashboard.overview).toMatchObject({ peers: 3, sessionsLogged: 1, referralsMade: 1, badgesAwarded: 2, scenarioCompletions: 3 });
      expect(body.dashboard.wellbeing.averageMood).toBeNull(); // only 1 reflection < minimum group size
      expect(body.dashboard.skillCheck).toMatchObject({ prePeople: 1, preAverage: null }); // suppressed for 1 person
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

      await seed({ log: () => {} });

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

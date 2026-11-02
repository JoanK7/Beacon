// Unit tests for the learning-integrity, streak, question-selection and
// crisis-detection logic. All pure: no database, no clock.
import { QuestionSelector, presentQuestion, seededRandom } from '../../src/domain/question-selector';
import { ReadingPaceSignal, QuizPaceSignal, countWords, normalisedGain } from '../../src/domain/learning-integrity';
import { StreakCalculator, dayNumber } from '../../src/domain/streak';
import { CrisisDetector } from '../../src/domain/crisis-detector';
import { assignQuestionIds } from '../../src/services/admin.service';

const bank = Array.from({ length: 10 }, (_, i) => ({ id: `q${i + 1}`, options: ['a', 'b', 'c'], answerIndex: i % 3 }));

describe('QuestionSelector', () => {
  it('draws the requested number of different questions', () => {
    const drawn = new QuestionSelector(seededRandom(1)).drawNew(bank, 5);
    expect(drawn).toHaveLength(5);
    expect(new Set(drawn.map((d) => d.id)).size).toBe(5);
  });

  it('never draws more questions than the bank holds', () => {
    expect(new QuestionSelector(seededRandom(2)).drawNew(bank.slice(0, 3), 5)).toHaveLength(3);
  });

  it('prefers questions the learner has seen least', () => {
    const seen = new Map(bank.slice(0, 5).map((q) => [q.id, 1])); // q1–q5 seen once
    for (let seed = 0; seed < 20; seed += 1) {
      const ids = new QuestionSelector(seededRandom(seed)).drawNew(bank, 5, seen).map((d) => d.id);
      expect(ids.sort()).toEqual(['q10', 'q6', 'q7', 'q8', 'q9']);
    }
  });

  it('is reproducible with the same seed, and varies across seeds', () => {
    const a = new QuestionSelector(seededRandom(42)).drawNew(bank, 5);
    const b = new QuestionSelector(seededRandom(42)).drawNew(bank, 5);
    expect(a).toEqual(b);
    const draws = new Set(Array.from({ length: 10 }, (_, s) => JSON.stringify(new QuestionSelector(seededRandom(s)).drawNew(bank, 5))));
    expect(draws.size).toBeGreaterThan(1);
  });

  it('gives each question a valid shuffled option order (a permutation)', () => {
    for (const d of new QuestionSelector(seededRandom(7)).drawNew(bank, 10)) {
      expect([...d.order].sort()).toEqual([0, 1, 2]);
    }
  });

  it('shuffles fairly: every position is used for the first item', () => {
    const selector = new QuestionSelector(seededRandom(3));
    const firstPositions = new Set(Array.from({ length: 60 }, () => selector.shuffle([0, 1, 2, 3]).indexOf(0)));
    expect(firstPositions).toEqual(new Set([0, 1, 2, 3]));
  });

  it('redraws the same questions for a repeat, dropping any removed from the bank', () => {
    const redrawn = new QuestionSelector(seededRandom(5)).redraw(bank, ['q2', 'q4', 'gone']);
    expect(redrawn.map((d) => d.id).sort()).toEqual(['q2', 'q4']);
  });

  it('presents a question in the drawn order and moves the correct answer with it', () => {
    const question = { id: 'x', prompt: 'p', options: ['right', 'wrong 1', 'wrong 2'], answerIndex: 0 };
    const shown = presentQuestion(question, [2, 0, 1]);
    expect(shown.options).toEqual(['wrong 2', 'right', 'wrong 1']);
    expect(shown.options[shown.answerIndex]).toBe('right');
  });
});

describe('reading and quiz pace', () => {
  it('counts words, ignoring lesson markup', () => {
    expect(countWords('**Bold** words here')).toBe(3);
    expect(countWords('- one\n- two\n> Tip: three')).toBe(4);
    expect(countWords('+ Front | Back')).toBe(2);
    expect(countWords('[x] right\n[ ] wrong')).toBe(2);
  });

  it('flags a section read far faster than its length allows', () => {
    const body = Array.from({ length: 200 }, () => 'word').join(' '); // 200 words = 60 s at 200 wpm
    const pace = new ReadingPaceSignal();
    expect(pace.evaluate({ body }, 10)).toMatchObject({ expectedSeconds: 60, thresholdSeconds: 15, rushed: true });
    expect(pace.evaluate({ body }, 15).rushed).toBe(false); // exactly at the threshold is fine
    expect(pace.evaluate({ body }, 120).rushed).toBe(false);
  });

  it('never expects less than 8 seconds, even for a very short section', () => {
    const pace = new ReadingPaceSignal();
    expect(pace.evaluate({ body: 'Short.' }, 5)).toMatchObject({ thresholdSeconds: 8, rushed: true });
    expect(pace.evaluate({ body: 'Short.' }, 8).rushed).toBe(false);
  });

  it('flags a quiz answered faster than ~6 seconds a question', () => {
    const pace = new QuizPaceSignal();
    expect(pace.evaluate({ questionCount: 5 }, 12)).toMatchObject({ thresholdSeconds: 30, rushed: true });
    expect(pace.evaluate({ questionCount: 5 }, 45).rushed).toBe(false);
  });
});

describe('normalised learning gain', () => {
  it('is the share of the possible improvement achieved', () => {
    expect(normalisedGain(50, 75)).toBe(0.5);
    expect(normalisedGain(0, 100)).toBe(1);
    expect(normalisedGain(60, 60)).toBe(0);
    expect(normalisedGain(80, 60)).toBe(-1); // scored lower
  });

  it('is undefined (null) when the first score was already 100%', () => {
    expect(normalisedGain(100, 100)).toBeNull();
  });
});

describe('StreakCalculator', () => {
  const streak = new StreakCalculator();

  it('is zero with no activity', () => {
    expect(streak.summarise([], '2026-11-02')).toEqual({ current: 0, best: 0, activeToday: false, restDaysPerWeek: 1 });
  });

  it('counts consecutive active days, including today', () => {
    expect(streak.summarise(['2026-10-31', '2026-11-01', '2026-11-02'], '2026-11-02')).toMatchObject({ current: 3, activeToday: true });
  });

  it('does not count today against the learner before they have done anything', () => {
    expect(streak.summarise(['2026-10-31', '2026-11-01'], '2026-11-02')).toMatchObject({ current: 2, activeToday: false });
  });

  it('forgives one rest day in a week', () => {
    // Active Oct 29, 30, (rest 31), Nov 1, 2.
    expect(streak.summarise(['2026-10-29', '2026-10-30', '2026-11-01', '2026-11-02'], '2026-11-02').current).toBe(4);
  });

  it('breaks after two missed days in a row, or two rest days within a week', () => {
    expect(streak.summarise(['2026-10-29', '2026-11-01', '2026-11-02'], '2026-11-02').current).toBe(2);
    // Rests on Oct 28 and Oct 31: the second is within 7 days of the first.
    expect(streak.summarise(['2026-10-27', '2026-10-29', '2026-10-30', '2026-11-01'], '2026-11-01').current).toBe(1);
  });

  it('keeps the best streak after a reset, and ignores duplicates and order', () => {
    const days = ['2026-10-03', '2026-10-01', '2026-10-02', '2026-10-02', '2026-10-20'];
    expect(streak.summarise(days, '2026-10-20')).toMatchObject({ current: 1, best: 3 });
  });

  it('handles month and year boundaries', () => {
    expect(dayNumber('2027-01-01') - dayNumber('2026-12-31')).toBe(1);
    expect(streak.summarise(['2026-12-30', '2026-12-31', '2027-01-01'], '2027-01-01').current).toBe(3);
  });

  it('can be configured with no rest days', () => {
    expect(new StreakCalculator(0).summarise(['2026-10-30', '2026-11-01'], '2026-11-01').current).toBe(1);
  });
});

describe('CrisisDetector', () => {
  const detector = new CrisisDetector();

  it.each([
    'I want to die',
    'thinking about suicide lately',
    'I might hurt myself',
    'I don’t want to be here anymore',
    'everyone would be better off without me',
    'Self-harm again',
  ])('flags "%s"', (text) => {
    expect(detector.check(text).needsCare).toBe(true);
  });

  it.each(['Exams are killing me but I will survive', 'Tired and homesick', 'I could die of embarrassment? no, just tired', ''])(
    'does not flag "%s"',
    (text) => {
      expect(detector.check(text).needsCare).toBe(false);
    },
  );
});

describe('assignQuestionIds', () => {
  it('keeps existing ids and gives new questions unused ones', () => {
    const result = assignQuestionIds([{ id: 'm4-q1' }, {}, { id: 'custom' }, {}], 4);
    expect(result.map((q) => q.id)).toEqual(['m4-q1', 'm4-q2', 'custom', 'm4-q3']);
  });
});

import { scoreQuiz, calculateSus, calculatePoints, levelForPoints } from '../../src/utils/scoring';

const questions = [
  { prompt: 'Q1', options: ['a', 'b'], answerIndex: 1, explanation: 'because' },
  { prompt: 'Q2', options: ['a', 'b'], answerIndex: 0 },
  { prompt: 'Q3', options: ['a', 'b', 'c'], answerIndex: 2 },
];

describe('scoreQuiz', () => {
  it('scores all-correct answers as 100 and passes', () => {
    const r = scoreQuiz(questions, [1, 0, 2], 70);
    expect(r).toMatchObject({ score: 100, passed: true, correctCount: 3, total: 3 });
  });

  it('rounds partial scores and applies the pass mark', () => {
    const r = scoreQuiz(questions, [1, 0, 0], 70);
    expect(r.score).toBe(67);
    expect(r.passed).toBe(false);
    expect(r.results[2]).toMatchObject({ correct: false, chosen: 0, correctIndex: 2 });
  });

  it('treats missing answers as incorrect', () => {
    expect(scoreQuiz(questions, [1], 50).correctCount).toBe(1);
  });

  it('rejects a quiz with no questions', () => {
    expect(() => scoreQuiz([], [], 70)).toThrow();
  });
});

describe('calculateSus', () => {
  it('returns 100 for the best possible answers', () => {
    expect(calculateSus([5, 1, 5, 1, 5, 1, 5, 1, 5, 1])).toBe(100);
  });

  it('returns 0 for the worst possible answers', () => {
    expect(calculateSus([1, 5, 1, 5, 1, 5, 1, 5, 1, 5])).toBe(0);
  });

  it('returns 50 for all-neutral answers', () => {
    expect(calculateSus(Array(10).fill(3))).toBe(50);
  });

  it('rejects the wrong number of answers or out-of-range values', () => {
    expect(() => calculateSus([3, 3])).toThrow();
    expect(() => calculateSus([6, 3, 3, 3, 3, 3, 3, 3, 3, 3])).toThrow();
  });
});

describe('points and levels', () => {
  it('weights learning activities', () => {
    expect(calculatePoints({ sectionsViewed: 3, modulesCompleted: 1, badgesEarned: 1 })).toBe(180);
  });

  it('starts new users at level 1', () => {
    expect(levelForPoints(0)).toMatchObject({ level: 1, name: 'Newcomer', progressToNext: 0 });
  });

  it('reports progress towards the next level', () => {
    expect(levelForPoints(60)).toMatchObject({ level: 1, nextLevelAt: 120, progressToNext: 50 });
  });

  it('caps at the top level', () => {
    expect(levelForPoints(5000)).toMatchObject({ name: 'Beacon', nextLevelAt: null, progressToNext: 100 });
  });

  it('makes the top level reachable by completing all six seeded modules', () => {
    // 6 modules × 3 sections, 6 completions, 6 badges
    const points = calculatePoints({ sectionsViewed: 18, modulesCompleted: 6, badgesEarned: 6 });
    expect(levelForPoints(points).name).toBe('Beacon');
  });
});

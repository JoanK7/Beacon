// Learning streak: days in a row with any learning activity.
//
// Kind by design (supervisor feedback asked for a streak; the proposal asked
// for low pressure):
// - one rest day in any 7 days does not break the streak;
// - today only counts once something has happened, so the streak is never
//   shown as broken before the day is over;
// - the best streak is kept, so a reset never erases past effort.

const DAY_MS = 86_400_000;

/** Days since 1970-01-01 for a 'YYYY-MM-DD' date. */
export function dayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Math.floor(Date.UTC(y!, m! - 1, d!) / DAY_MS);
}

export interface StreakSummary {
  /** Active days in the current run (rest days are not counted). */
  current: number;
  best: number;
  activeToday: boolean;
  /** Rest days allowed per 7 days. */
  restDaysPerWeek: number;
}

export class StreakCalculator {
  constructor(private readonly restDaysPerWeek = 1) {}

  /**
   * @param activeDates  dates with activity, 'YYYY-MM-DD' in the learner's time zone (any order, duplicates allowed)
   * @param today  today's date in the same time zone
   *
   * Walks day by day from the first activity to today, O(days). A missed day
   * is forgiven when fewer than `restDaysPerWeek` days were forgiven in the
   * previous 7; otherwise the run ends.
   */
  summarise(activeDates: readonly string[], today: string): StreakSummary {
    const active = new Set(activeDates.map(dayNumber));
    const todayNo = dayNumber(today);
    const activeToday = active.has(todayNo);
    const summary = { current: 0, best: 0, activeToday, restDaysPerWeek: this.restDaysPerWeek };
    if (active.size === 0) return summary;

    const first = Math.min(...active);
    let run = 0;
    let restDays: number[] = []; // days forgiven in the current run
    for (let day = first; day <= todayNo; day += 1) {
      if (active.has(day)) {
        run += 1;
      } else if (day === todayNo) {
        break; // today is not over yet: never count it against the learner
      } else {
        restDays = restDays.filter((d) => day - d < 7);
        if (run > 0 && restDays.length < this.restDaysPerWeek) {
          restDays.push(day);
        } else {
          run = 0;
          restDays = [];
        }
      }
      summary.best = Math.max(summary.best, run);
    }
    summary.current = run;
    return summary;
  }
}

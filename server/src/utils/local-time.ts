// Beacon's users are in Rwanda, so "today" (for streaks and the daily story)
// means today in Kigali, not on the server's clock (which runs in UTC).
export const LOCAL_TIME_ZONE = 'Africa/Kigali';

/** SQL for today's date in Kigali, e.g. in SELECT ${LOCAL_TODAY_SQL} AS today. */
export const LOCAL_TODAY_SQL = `to_char((now() AT TIME ZONE '${LOCAL_TIME_ZONE}')::date, 'YYYY-MM-DD')`;

/** SQL that turns a timestamptz column into a Kigali date string. */
export const localDateSql = (column: string) => `to_char((${column} AT TIME ZONE '${LOCAL_TIME_ZONE}')::date, 'YYYY-MM-DD')`;

/** Event dates/times are always Asia/Kolkata (UTC+05:30, no DST), stored as separate IST date + time strings. */
export function isValidDate(d: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const [y, m, day] = d.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, day));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === day;
}
export const isValidTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
export const toIstIso = (date: string, time: string) => `${date}T${time}:00+05:30`;

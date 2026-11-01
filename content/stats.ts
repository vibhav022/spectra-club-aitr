export interface Stat { key: string; label: string; value: number | null; suffix?: string }
/** value: null hides the stat. Fill only with figures confirmed by the club. */
export const stats: Stat[] = [
  { key: "members", label: "Active Members", value: null },
  { key: "events", label: "Events Hosted", value: null },
  { key: "students", label: "Students Reached", value: null },
  { key: "schools", label: "Schools Reached", value: null },
];

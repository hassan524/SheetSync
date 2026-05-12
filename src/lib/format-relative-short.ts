/** Valid ISO-like or epoch string for `new Date(input)` */
export function formatOpenedAgo(
  input: string | Date | null | undefined,
): string {
  if (input == null || input === "") return "—";
  const d = input instanceof Date ? input : new Date(input);
  const t = d.getTime();
  if (Number.isNaN(t)) return typeof input === "string" ? input : "—";

  let sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 0) sec = 0;

  if (sec < 10) return "just now";
  if (sec < 60) return `${sec} sec ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;

  const day = Math.floor(hr / 24);
  if (day < 14) return `${day} day${day === 1 ? "" : "s"} ago`;

  const week = Math.floor(day / 7);
  if (week < 8) return `${week} week${week === 1 ? "" : "s"} ago`;

  const month = Math.floor(day / 30);
  if (month < 12) return `${month} month${month === 1 ? "" : "s"} ago`;

  const year = Math.floor(day / 365);
  return `${year} year${year === 1 ? "" : "s"} ago`;
}

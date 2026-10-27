// Gatherings before 7am belong to the preceding night, using local time.
export function todayIso(now = new Date()) {
  const date = new Date(now);
  if (date.getHours() < 7) date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

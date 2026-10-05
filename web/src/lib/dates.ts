// La tienda opera en Nogales, Sonora: UTC−7 todo el año (Sonora no usa horario de verano).
export const STORE_TZ = "America/Hermosillo";
const OFFSET = "-07:00";

/** "2026-11-20T18:00" (hora de Sonora, de un input datetime-local) → Date. */
export function parseLocalDateTime(v: FormDataEntryValue | null): Date | null {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const d = new Date(`${v}:00${OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date → valor para un input datetime-local en hora de Sonora. */
export function toLocalInput(d: Date | null | undefined): string {
  if (!d) return "";
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: STORE_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function formatDate(d: Date, withTime = false) {
  return d.toLocaleString("es-MX", { timeZone: STORE_TZ, dateStyle: "medium", ...(withTime ? { timeStyle: "short" } : {}) });
}

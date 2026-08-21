export const TIMEZONE_GT = "America/Guatemala" as const;
export const LOCALE_GT = "es-GT" as const;

const fechaCalendarioRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
const mesCalendarioRegex = /^(\d{4})-(\d{2})$/;

export function fechaCalendarioGt(fecha = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_GT,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
}

export function mesCalendarioGt(fecha = new Date()): string {
  return fechaCalendarioGt(fecha).slice(0, 7);
}

export function normalizarFechaCalendario(
  value: string | null | undefined,
): string {
  if (!value) return "";
  const solo = value.split("T")[0];
  return fechaCalendarioRegex.test(solo) ? solo : "";
}

export function normalizarMesCalendario(
  value: string | null | undefined,
): string {
  if (!value) return "";
  if (mesCalendarioRegex.test(value)) return value;
  const fecha = normalizarFechaCalendario(value);
  return fecha ? fecha.slice(0, 7) : "";
}

export function formatFechaCalendarioGt(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "long",
    year: "numeric",
  },
): string {
  const fecha = normalizarFechaCalendario(value);
  if (!fecha) return "—";

  const [y, m, d] = fecha.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  return new Intl.DateTimeFormat(LOCALE_GT, {
    timeZone: TIMEZONE_GT,
    ...options,
  }).format(date);
}

export function formatFechaHoraGt(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  },
): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(LOCALE_GT, {
    timeZone: TIMEZONE_GT,
    ...options,
  }).format(date);
}

export function formatFechaCortaGt(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(LOCALE_GT, {
    timeZone: TIMEZONE_GT,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

export function formatDiaFechaCortaGt(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const weekdayRaw = new Intl.DateTimeFormat(LOCALE_GT, {
    timeZone: TIMEZONE_GT,
    weekday: "short",
  })
    .format(date)
    .replace(/\.$/, "")
    .slice(0, 3);

  const weekday =
    weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1).toLowerCase();

  return `${weekday} ${formatFechaCortaGt(value)}`;
}

export function formatHoraAmGt(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_GT,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatHoraGt(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(LOCALE_GT, {
    timeZone: TIMEZONE_GT,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function mesCalendarioToTimestamptz(mes: string): string {
  const normalizado = normalizarMesCalendario(mes);
  if (!normalizado) throw new Error("INVALID_MONTH");
  return `${normalizado}-01T12:00:00.000Z`;
}

export function timestamptzToMesCalendario(
  value: string | null | undefined,
): string {
  if (!value) return mesCalendarioGt();

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return mesCalendarioGt();

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_GT,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;

  return y && m ? `${y}-${m}` : mesCalendarioGt();
}

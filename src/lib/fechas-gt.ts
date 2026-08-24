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

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function diasEnMes(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function clampDia(day: string, month: string, year: string): string {
  if (day.length !== 2) return day;
  let d = Number(day);
  if (!Number.isFinite(d) || d < 1) d = 1;
  let max = 31;
  if (month.length === 2) {
    const m = Number(month);
    if (m === 2) {
      max = year.length === 4 ? diasEnMes(Number(year), 2) : 29;
    } else if (m === 4 || m === 6 || m === 9 || m === 11) {
      max = 30;
    } else if (m >= 1 && m <= 12) {
      max = year.length === 4 ? diasEnMes(Number(year), m) : 31;
    }
  }
  if (d > max) d = max;
  return pad2(d);
}

function clampPar(value: string, min: number, max: number): string {
  if (value.length !== 2) return value;
  let n = Number(value);
  if (!Number.isFinite(n) || n < min) n = min;
  if (n > max) n = max;
  return pad2(n);
}

function ensamblarFechaManual(
  day: string,
  month: string,
  year: string,
  digitCount: number,
): string {
  if (digitCount <= 2) return digitCount === 2 ? `${day}/` : day;
  if (digitCount <= 4) return digitCount === 4 ? `${day}/${month}/` : `${day}/${month}`;
  return `${day}/${month}/${year}`;
}

export function maskFechaManual(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";

  let day = digits.slice(0, 2);
  let month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  month = clampPar(month, 1, 12);
  day = clampDia(day, month, year);

  return ensamblarFechaManual(day, month, year, digits.length);
}

export function maskFechaHoraManual(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  if (!digits) return "";

  let day = digits.slice(0, 2);
  let month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  let hour = digits.slice(8, 10);
  let minute = digits.slice(10, 12);

  month = clampPar(month, 1, 12);
  day = clampDia(day, month, year);
  hour = clampPar(hour, 0, 23);
  minute = clampPar(minute, 0, 59);

  const fecha = ensamblarFechaManual(day, month, year, Math.min(digits.length, 8));
  if (digits.length <= 8) return digits.length === 8 ? `${fecha} ` : fecha;
  if (digits.length <= 10) {
    return digits.length === 10 ? `${day}/${month}/${year} ${hour}:` : `${day}/${month}/${year} ${hour}`;
  }
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

function esFechaCalendarioValida(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function parseFechaManualToYmd(
  value: string | null | undefined,
): string {
  if (!value) return "";
  const t = value.trim();
  const iso = normalizarFechaCalendario(t);
  if (iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return esFechaCalendarioValida(y, m, d) ? iso : "";
  }
  const match = t.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (!match) return "";
  const d = Number(match[1]);
  const m = Number(match[2]);
  const y = Number(match[3]);
  if (!esFechaCalendarioValida(y, m, d)) return "";
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function fechaManualToTimestamptz(
  value: string | null | undefined,
): string | null {
  if (!value?.trim()) return null;
  const ymd = parseFechaManualToYmd(value);
  return ymd ? `${ymd}T12:00:00.000Z` : null;
}

export function formatFechaManualInput(
  value: string | null | undefined,
): string {
  if (!value?.trim()) return "";
  const ymd = parseFechaManualToYmd(value);
  if (ymd) {
    const [y, m, d] = ymd.split("-");
    return `${d}/${m}/${y}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE_GT,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);
  const d = parts.find((p) => p.type === "day")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const y = parts.find((p) => p.type === "year")?.value;
  return d && m && y ? `${d}/${m}/${y}` : "";
}

export function parseFechaHoraManualToIso(
  value: string | null | undefined,
): string {
  if (!value?.trim()) return "";
  const t = value.trim();

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:/.test(t)) {
    const date = new Date(t);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  const dmy = t.match(
    /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})(?:\s+|T)(\d{1,2}):(\d{2})$/,
  );
  const ymd = t.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:\s+|T)(\d{1,2}):(\d{2})$/,
  );

  let year: number;
  let month: number;
  let day: number;
  let hour: number;
  let minute: number;

  if (dmy) {
    day = Number(dmy[1]);
    month = Number(dmy[2]);
    year = Number(dmy[3]);
    hour = Number(dmy[4]);
    minute = Number(dmy[5]);
  } else if (ymd) {
    year = Number(ymd[1]);
    month = Number(ymd[2]);
    day = Number(ymd[3]);
    hour = Number(ymd[4]);
    minute = Number(ymd[5]);
  } else {
    return "";
  }

  if (!esFechaCalendarioValida(year, month, day)) return "";
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return "";

  return `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}:00-06:00`;
}

export function formatFechaHoraManualInput(
  value: string | null | undefined,
): string {
  if (!value?.trim()) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE_GT,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const d = parts.find((p) => p.type === "day")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const y = parts.find((p) => p.type === "year")?.value;
  const h = parts.find((p) => p.type === "hour")?.value;
  const min = parts.find((p) => p.type === "minute")?.value;
  return d && m && y && h && min ? `${d}/${m}/${y} ${h}:${min}` : "";
}

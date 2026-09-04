import {
  formatFechaManualGt,
  normalizarFechaCalendario,
  parseFechaManualGt,
} from "@/lib/fechas-gt";

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

function extraerSlotsFecha(
  raw: string,
  conHora: boolean,
): {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
} {
  const max = conHora ? [2, 2, 4, 2, 2] : [2, 2, 4];
  const slots = max.map(() => "");
  let i = 0;

  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") {
      while (i < slots.length && slots[i].length >= max[i]) i += 1;
      if (i >= slots.length) break;
      slots[i] += ch;
      continue;
    }
    if (ch === "/" || ch === ":" || ch === " ") {
      if (i < slots.length - 1) i += 1;
    }
  }

  return {
    day: slots[0] ?? "",
    month: slots[1] ?? "",
    year: slots[2] ?? "",
    hour: slots[3] ?? "",
    minute: slots[4] ?? "",
  };
}

function ensamblarFechaHoraSlots(
  day: string,
  month: string,
  year: string,
  hour: string,
  minute: string,
  conHora: boolean,
): string {
  const hayTrasDia = Boolean(month || year || hour || minute);
  const hayTrasMes = Boolean(year || hour || minute);
  const hayTrasAnio = Boolean(hour || minute);
  const hayTrasHora = Boolean(minute);

  if (!day && !hayTrasDia) return "";

  let out = day;
  if (day.length === 2 || hayTrasDia) out += "/";
  out += month;
  if (month.length === 2 || hayTrasMes) out += "/";
  out += year;
  if (!conHora) return out;
  if (year.length === 4 || hayTrasAnio) out += " ";
  out += hour;
  if (hour.length === 2 || hayTrasHora) out += ":";
  out += minute;
  return out;
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

export function maskFechaManual(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length > 8) digits = digits.slice(0, 8);
  if (!digits) return "";

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function maskFechaHoraManual(raw: string): string {
  let { day, month, year, hour, minute } = extraerSlotsFecha(raw, true);
  if (!day && !month && !year && !hour && !minute) return "";

  month = clampPar(month, 1, 12);
  day = clampDia(day, month, year);
  hour = clampPar(hour, 0, 23);
  minute = clampPar(minute, 0, 59);

  return ensamblarFechaHoraSlots(day, month, year, hour, minute, true);
}

export function aplicarMascaraEnInput(
  input: HTMLInputElement,
  mask: (raw: string) => string,
): void {
  const caret = input.selectionStart ?? input.value.length;
  const digitsBefore = input.value.slice(0, caret).replace(/\D/g, "").length;
  const masked = mask(input.value);
  input.value = masked;

  if (!masked) {
    input.setSelectionRange(0, 0);
    return;
  }

  let digitCount = 0;
  let nextCaret = masked.length;
  for (let i = 0; i < masked.length; i += 1) {
    const ch = masked[i]!;
    if (ch >= "0" && ch <= "9") {
      digitCount += 1;
      if (digitCount === digitsBefore) {
        nextCaret = i + 1;
        break;
      }
    }
  }

  input.setSelectionRange(nextCaret, nextCaret);
}

export function formatFechaManualInput(
  value: string | null | undefined,
): string {
  if (!value?.trim()) return "";
  const formatted = formatFechaManualGt(value);
  if (formatted) return formatted;
  const iso = normalizarFechaCalendario(value);
  return iso ? formatFechaManualGt(iso) : "";
}

export function fechaManualToTimestamptz(
  value: string | null | undefined,
): string | null {
  if (!value?.trim()) return null;
  const iso = parseFechaManualGt(value.trim());
  return iso ? `${iso}T12:00:00.000Z` : null;
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
  const ymd = t.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+|T)(\d{1,2}):(\d{2})$/);

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

"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
} from "react";
import { createPortal } from "react-dom";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale/es";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fechaCalendarioGt, partesFechaHoraGt } from "@/lib/fechas-gt";
import { GvFechaHoraInput } from "./gv-fecha-input";
import { maskFechaHoraManual, partesFechaHoraManual, parseFechaHoraManualToIso } from "./fechas-input";
import {
  pisoPickerSolicitudGt,
  type PisoPickerSolicitudGt,
} from "../solicitudes/lib/calendario-reservas";

type GvFechaHoraPickerInputProps = Omit<
  ComponentProps<typeof GvFechaHoraInput>,
  "className"
> & {
  className?: string;
  inputClassName?: string;
  solicitudNoPasadaGt?: boolean;
  solicitudPisoManual?: string;
};

const GV_TIME_SELECT_TRIGGER_CLASS =
  "h-9 min-w-0 flex-1 cursor-pointer rounded-md border border-border bg-white shadow-none dark:border-zinc-700 dark:bg-zinc-950";

const GV_TIME_SELECT_CONTENT_CLASS =
  "z-[300] max-h-48 w-[var(--radix-select-trigger-width)] border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900";

const GV_TIME_SELECT_ITEM_CLASS =
  "cursor-pointer rounded-lg bg-white focus:bg-sky-50 dark:bg-zinc-900 dark:focus:bg-zinc-800";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function buildManualFromParts(
  y: number,
  m: number,
  d: number,
  h: number,
  min: number,
): string {
  const raw = `${pad2(d)}${pad2(m)}${y}${pad2(h)}${pad2(min)}`;
  return maskFechaHoraManual(raw);
}

function dateFromCalendarioGt(yyyyMmDd: string): Date | null {
  const norm = yyyyMmDd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!norm) return null;
  const y = Number(norm[1]);
  const m = Number(norm[2]);
  const d = Number(norm[3]);
  const dt = new Date(y, m - 1, d);
  if (!isValid(dt) || dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

function calendarioGtDesdeDate(d: Date): string {
  return fechaCalendarioGt(d);
}

function dateFromManualParts(value: string): Date | null {
  const parts = partesFechaHoraManual(value);
  if (parts.year.length !== 4 || parts.month.length !== 2 || parts.day.length !== 2) {
    return null;
  }
  return dateFromCalendarioGt(
    `${parts.year}-${parts.month}-${parts.day}`,
  );
}

function minutosPermitidosParaDia(
  diaCalendario: string,
  piso: PisoPickerSolicitudGt,
): { hourMin: number; minuteMin: number } {
  if (diaCalendario > piso.calendarioMin) {
    return { hourMin: 0, minuteMin: 0 };
  }
  return { hourMin: piso.hourMin, minuteMin: piso.minuteMin };
}

function clampHoraMinuto(
  hour: number,
  minute: number,
  hourMin: number,
  minuteMin: number,
): { hour: number; minute: number } {
  if (hour < hourMin) return { hour: hourMin, minute: minuteMin };
  if (hour === hourMin && minute < minuteMin) {
    return { hour: hourMin, minute: minuteMin };
  }
  return { hour, minute };
}

function GvTimeUnitSelect({
  value,
  onChange,
  max,
  min = 0,
  ariaLabel,
}: {
  value: number;
  onChange: (n: number) => void;
  max: number;
  min?: number;
  ariaLabel: string;
}) {
  const safeValue = value < min ? min : value;
  return (
    <Select
      value={String(safeValue)}
      onValueChange={(v) => onChange(Number(v))}
    >
      <SelectTrigger className={GV_TIME_SELECT_TRIGGER_CLASS} aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className={GV_TIME_SELECT_CONTENT_CLASS}>
        {Array.from({ length: max - min }, (_, i) => {
          const n = min + i;
          return (
            <SelectItem
              key={n}
              value={String(n)}
              className={GV_TIME_SELECT_ITEM_CLASS}
            >
              {pad2(n)}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function GvFechaHoraPickerPanel({
  currentMonth,
  setCurrentMonth,
  selectedDay,
  setSelectedDay,
  draftHour,
  setDraftHour,
  draftMinute,
  setDraftMinute,
  onClose,
  onApply,
  piso,
  restringirPasado,
}: {
  currentMonth: Date;
  setCurrentMonth: (d: Date) => void;
  selectedDay: Date | null;
  setSelectedDay: (d: Date) => void;
  draftHour: number;
  setDraftHour: (n: number) => void;
  draftMinute: number;
  setDraftMinute: (n: number) => void;
  onClose: () => void;
  onApply: () => void;
  piso: PisoPickerSolicitudGt;
  restringirPasado: boolean;
}) {
  const hoyGt = fechaCalendarioGt();
  const diaSeleccionado = selectedDay ? calendarioGtDesdeDate(selectedDay) : "";
  const { hourMin, minuteMin } = restringirPasado
    ? minutosPermitidosParaDia(diaSeleccionado, piso)
    : { hourMin: 0, minuteMin: 0 };

  const clampDraft = useCallback(
    (day: Date, hour: number, minute: number) => {
      if (!restringirPasado) {
        setDraftHour(hour);
        setDraftMinute(minute);
        return;
      }
      const dia = calendarioGtDesdeDate(day);
      const mins = minutosPermitidosParaDia(dia, piso);
      const clamped = clampHoraMinuto(hour, minute, mins.hourMin, mins.minuteMin);
      setDraftHour(clamped.hour);
      setDraftMinute(clamped.minute);
    },
    [piso, restringirPasado],
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale: es });
  const endDate = endOfWeek(monthEnd, { locale: es });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const esDiaBloqueado = (day: Date): boolean => {
    if (!restringirPasado) return false;
    const dia = calendarioGtDesdeDate(day);
    return dia < piso.calendarioMin;
  };

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar calendario"
        className="fixed inset-0 z-[250] bg-black/45 dark:bg-black/60"
        onClick={onClose}
      />
      <div className="pointer-events-none fixed inset-0 z-[251] flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Seleccionar fecha y hora"
          className="pointer-events-auto w-[320px] overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-2xl shadow-black/20 dark:border-zinc-700/60 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="text-sm font-bold capitalize tracking-wide text-foreground">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </div>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="mx-4 h-px bg-zinc-200 dark:bg-zinc-700" />

          <div className="grid grid-cols-7 px-3 pt-3 pb-1">
            {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((day) => (
              <div
                key={day}
                className="flex h-9 items-center justify-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
            {days.map((day, i) => {
              const bloqueado = esDiaBloqueado(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = calendarioGtDesdeDate(day) === hoyGt;

              return (
                <button
                  key={`${day.toISOString()}-${i}`}
                  type="button"
                  disabled={bloqueado}
                  onClick={() => {
                    if (bloqueado) return;
                    setSelectedDay(day);
                    clampDraft(day, draftHour, draftMinute);
                  }}
                  className={cn(
                    "relative flex h-10 w-full items-center justify-center rounded-xl text-sm font-medium transition-all duration-200",
                    bloqueado &&
                      "cursor-not-allowed text-muted-foreground/25 line-through decoration-muted-foreground/40 dark:text-muted-foreground/20",
                    !bloqueado &&
                      !isCurrentMonth &&
                      "text-muted-foreground/30 hover:text-muted-foreground/50",
                    !bloqueado &&
                      isCurrentMonth &&
                      "text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    !bloqueado &&
                      isSelected &&
                      "bg-[#2c5f9b] text-white shadow-md hover:bg-[#2c5f9b]/90 dark:bg-[#6f9fd4] dark:hover:bg-[#6f9fd4]/90",
                    !bloqueado &&
                      isToday &&
                      !isSelected &&
                      "font-bold text-[#2c5f9b] ring-2 ring-[#2c5f9b]/30 ring-inset dark:text-[#6f9fd4] dark:ring-[#6f9fd4]/30",
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <span className="shrink-0 text-xs font-bold text-[#2c5f9b] dark:text-[#6f9fd4]">
              Hora
            </span>
            <GvTimeUnitSelect
              value={draftHour}
              onChange={(h) => {
                setDraftHour(h);
                if (selectedDay) clampDraft(selectedDay, h, draftMinute);
              }}
              max={24}
              min={hourMin}
              ariaLabel="Hora"
            />
            <span className="text-muted-foreground">:</span>
            <GvTimeUnitSelect
              value={draftMinute}
              onChange={(m) => setDraftMinute(m)}
              max={60}
              min={draftHour === hourMin ? minuteMin : 0}
              ariaLabel="Minutos"
            />
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => {
                const ahora = partesFechaHoraGt();
                const day =
                  dateFromCalendarioGt(ahora.calendario) ?? new Date();
                if (esDiaBloqueado(day)) return;
                setSelectedDay(day);
                setCurrentMonth(day);
                clampDraft(day, ahora.hour, ahora.minute);
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-muted-foreground transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Ahora
            </button>
            <button
              type="button"
              onClick={onApply}
              className="rounded-lg bg-[#2c5f9b] px-4 py-1.5 text-xs font-bold text-white transition-all hover:bg-[#2c5f9b]/90 dark:bg-[#6f9fd4] dark:hover:bg-[#6f9fd4]/90"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export const GvFechaHoraPickerInput = forwardRef<
  HTMLInputElement,
  GvFechaHoraPickerInputProps
>(function GvFechaHoraPickerInput(
  {
    className,
    inputClassName,
    onChange,
    solicitudNoPasadaGt = false,
    solicitudPisoManual,
    ...props
  },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [draftHour, setDraftHour] = useState(8);
  const [draftMinute, setDraftMinute] = useState(0);

  const pisoIso = useMemo(() => {
    if (!solicitudNoPasadaGt || !solicitudPisoManual?.trim()) return null;
    const iso = parseFechaHoraManualToIso(solicitudPisoManual.trim());
    return iso || null;
  }, [solicitudNoPasadaGt, solicitudPisoManual]);

  const piso = useMemo(
    () => pisoPickerSolicitudGt(pisoIso),
    [pisoIso],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const syncPickerFromInput = useCallback(() => {
    const ahora = partesFechaHoraGt();
    const value = inputRef.current?.value ?? "";
    const iso = value.trim() ? parseFechaHoraManualToIso(value.trim()) : "";
    const msValor = iso ? new Date(iso).getTime() : Number.NaN;

    let day =
      dateFromCalendarioGt(piso.calendarioMin) ?? dateFromCalendarioGt(ahora.calendario);

    if (
      iso &&
      !Number.isNaN(msValor) &&
      msValor >= piso.msMin &&
      fechaCalendarioGt(new Date(iso)) >= piso.calendarioMin
    ) {
      const parsedDay = dateFromManualParts(value);
      if (parsedDay) day = parsedDay;
    }

    setSelectedDay(day);
    setCurrentMonth(day ?? new Date());
    setDraftHour(ahora.hour);
    setDraftMinute(ahora.minute);

    if (solicitudNoPasadaGt && day) {
      const dia = calendarioGtDesdeDate(day);
      const mins = minutosPermitidosParaDia(dia, piso);
      const clamped = clampHoraMinuto(
        ahora.hour,
        ahora.minute,
        mins.hourMin,
        mins.minuteMin,
      );
      setDraftHour(clamped.hour);
      setDraftMinute(clamped.minute);
    }
  }, [piso, solicitudNoPasadaGt]);

  const emitValue = useCallback(
    (masked: string) => {
      const el = inputRef.current;
      if (!el) return;
      el.value = masked;
      onChange?.({
        target: el,
        currentTarget: el,
      } as ChangeEvent<HTMLInputElement>);
    },
    [onChange],
  );

  const applySelection = useCallback(() => {
    const day = selectedDay ?? dateFromCalendarioGt(piso.calendarioMin) ?? new Date();
    const masked = buildManualFromParts(
      day.getFullYear(),
      day.getMonth() + 1,
      day.getDate(),
      draftHour,
      draftMinute,
    );

    if (solicitudNoPasadaGt) {
      const iso = parseFechaHoraManualToIso(masked);
      const ms = iso ? new Date(iso).getTime() : Number.NaN;
      if (!iso || Number.isNaN(ms) || ms < piso.msMin) {
        return;
      }
    }

    emitValue(masked);
    setOpen(false);
  }, [selectedDay, draftHour, draftMinute, emitValue, piso, solicitudNoPasadaGt]);

  const openPicker = () => {
    syncPickerFromInput();
    setOpen(true);
  };

  return (
    <>
      <div className={cn("relative w-full", className)}>
        <GvFechaHoraInput
          ref={inputRef}
          className={cn("pr-10", inputClassName)}
          onChange={onChange}
          {...props}
        />
        <button
          type="button"
          aria-label="Abrir calendario"
          onClick={openPicker}
          className="absolute right-0 top-0 flex h-9 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <CalendarIcon className="size-4" />
        </button>
      </div>

      {mounted && open
        ? createPortal(
            <GvFechaHoraPickerPanel
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              draftHour={draftHour}
              setDraftHour={setDraftHour}
              draftMinute={draftMinute}
              setDraftMinute={setDraftMinute}
              onClose={() => setOpen(false)}
              onApply={applySelection}
              piso={piso}
              restringirPasado={solicitudNoPasadaGt}
            />,
            document.body,
          )
        : null}
    </>
  );
});

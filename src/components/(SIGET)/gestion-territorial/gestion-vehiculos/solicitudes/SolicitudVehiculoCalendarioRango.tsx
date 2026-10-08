"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isValid,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale/es";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";

import { showAlert } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { fechaCalendarioGt, formatFechaManualGt } from "@/lib/fechas-gt";
import type { ReactNode } from "react";
import { nombreSolicitanteReserva } from "../flota/lib/reserva-vehiculo";
import {
  diasReservaCalendarioGt,
  findConflictoDiaVehiculo,
  vehiculoReservadoEnDiaCalendario,
} from "./lib/calendario-reservas";
import { formatFechaSolicitudGv, formatEstadoLabel } from "./lib/helpers";
import {
  reservaPrioritariaEnDiaCalendario,
  type SolicitudCalendarioConSolicitante,
} from "./lib/preferencia-vehiculo";
import {
  parseFechaManualToIsoGtFinDia,
  parseFechaManualToIsoGtInicioDia,
} from "../lib/fechas-input";

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

function manualDesdeCalendarioGt(dia: string): string {
  return formatFechaManualGt(dia);
}

function compararDiasCalendarioGt(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function ReservaDiaCalendarioTooltip({
  reserva,
  children,
}: {
  reserva: SolicitudCalendarioConSolicitante;
  children: ReactNode;
}) {
  const nombre = nombreSolicitanteReserva(reserva.solicitante);
  const estado = formatEstadoLabel(reserva.estado);

  return (
    <div className="group/reserva relative flex h-10 w-full items-center justify-center">
      {children}
      <div
        role="tooltip"
        className={cn(
          "pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-[260] hidden w-max min-w-[11rem] max-w-[15rem] -translate-x-1/2 rounded-xl border-2 border-orange-300 bg-white px-3 py-2.5 text-left text-[11px] leading-snug shadow-lg",
          "dark:border-orange-700 dark:bg-zinc-900",
          "group-hover/reserva:block group-focus-within/reserva:block",
        )}
      >
        <p className="text-xs font-bold text-orange-700 dark:text-orange-300">Reservado</p>
        <p className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-50">{nombre}</p>
        <p className="capitalize text-zinc-600 dark:text-zinc-400">{estado}</p>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Salida:</span>{" "}
          {formatFechaSolicitudGv(reserva.fecha_inicio)}
        </p>
        <p className="text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Retorno:</span>{" "}
          {formatFechaSolicitudGv(reserva.fecha_fin_estimada)}
        </p>
        <span
          aria-hidden
          className="absolute left-1/2 top-full -mt-px size-2.5 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-orange-300 bg-white dark:border-orange-700 dark:bg-zinc-900"
        />
      </div>
    </div>
  );
}

export function SolicitudVehiculoCalendarioRango({
  vehiculoId,
  reservas,
  fechaInicioManual,
  fechaFinManual,
  onAplicarFechas,
  habilitado = true,
}: {
  vehiculoId: string;
  reservas: SolicitudCalendarioConSolicitante[];
  fechaInicioManual: string;
  fechaFinManual: string;
  onAplicarFechas: (inicioManual: string, finManual: string) => void;
  habilitado?: boolean;
}) {
  const hoyGt = fechaCalendarioGt();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const fromForm = parseFechaManualToIsoGtInicioDia(fechaInicioManual);
    if (fromForm) {
      const d = dateFromCalendarioGt(fechaCalendarioGt(new Date(fromForm)));
      if (d) return startOfMonth(d);
    }
    const hoy = dateFromCalendarioGt(hoyGt);
    return hoy ? startOfMonth(hoy) : new Date();
  });

  const [inicioDia, setInicioDia] = useState<string | null>(() => {
    const iso = parseFechaManualToIsoGtInicioDia(fechaInicioManual);
    return iso ? fechaCalendarioGt(new Date(iso)) : null;
  });
  const [finDia, setFinDia] = useState<string | null>(() => {
    const iso = parseFechaManualToIsoGtFinDia(fechaFinManual);
    return iso ? fechaCalendarioGt(new Date(iso)) : null;
  });
  const [hoverDia, setHoverDia] = useState<string | null>(null);
  const pendienteFinRangoRef = useRef(false);

  const esDiaReservado = useCallback(
    (diaCalendario: string) =>
      vehiculoReservadoEnDiaCalendario(vehiculoId, diaCalendario, reservas),
    [vehiculoId, reservas],
  );

  const esDiaPasado = useCallback(
    (diaCalendario: string) => diaCalendario < hoyGt,
    [hoyGt],
  );

  const esDiaDisponible = useCallback(
    (diaCalendario: string) =>
      habilitado && !esDiaPasado(diaCalendario) && !esDiaReservado(diaCalendario),
    [esDiaPasado, esDiaReservado, habilitado],
  );

  const rangoPreview = useMemo(() => {
    if (!inicioDia) return null;
    const fin = finDia ?? hoverDia;
    if (!fin) return { desde: inicioDia, hasta: inicioDia };
    const desde = compararDiasCalendarioGt(inicioDia, fin) <= 0 ? inicioDia : fin;
    const hasta = compararDiasCalendarioGt(inicioDia, fin) <= 0 ? fin : inicioDia;
    return { desde, hasta };
  }, [finDia, hoverDia, inicioDia]);

  const diaEnRango = useCallback(
    (diaCalendario: string) => {
      if (!rangoPreview) return false;
      return (
        compararDiasCalendarioGt(diaCalendario, rangoPreview.desde) >= 0 &&
        compararDiasCalendarioGt(diaCalendario, rangoPreview.hasta) <= 0
      );
    },
    [rangoPreview],
  );

  const rangoIncluyeDiaNoDisponible = useCallback(
    (desde: string, hasta: string) => {
      const dias = diasReservaCalendarioGt(
        `${desde}T00:00:00-06:00`,
        `${hasta}T23:59:59-06:00`,
      );
      return dias.some((dia) => !esDiaDisponible(dia));
    },
    [esDiaDisponible],
  );

  const handleDiaClick = (day: Date) => {
    const dia = calendarioGtDesdeDate(day);
    if (!esDiaDisponible(dia)) return;

    const seleccionUnDia =
      inicioDia === dia && (finDia === null || finDia === inicioDia);
    if (seleccionUnDia) {
      pendienteFinRangoRef.current = false;
      setInicioDia(null);
      setFinDia(null);
      setHoverDia(null);
      return;
    }

    if (inicioDia && finDia && inicioDia !== finDia && dia === finDia) {
      pendienteFinRangoRef.current = true;
      setFinDia(null);
      setHoverDia(null);
      return;
    }

    if (!inicioDia || (inicioDia && finDia)) {
      pendienteFinRangoRef.current = false;
      setInicioDia(dia);
      setFinDia(null);
      setHoverDia(null);
      return;
    }

    const desde = compararDiasCalendarioGt(inicioDia, dia) <= 0 ? inicioDia : dia;
    const hasta = compararDiasCalendarioGt(inicioDia, dia) <= 0 ? dia : inicioDia;

    if (rangoIncluyeDiaNoDisponible(desde, hasta)) {
      void showAlert(
        "warning",
        "Rango no disponible",
        "El rango incluye días reservados o no disponibles.",
      );
      setInicioDia(dia);
      setFinDia(null);
      return;
    }

    pendienteFinRangoRef.current = desde !== hasta;
    setInicioDia(desde);
    setFinDia(hasta);
  };

  useEffect(() => {
    if (!habilitado) return;

    if (!inicioDia) {
      pendienteFinRangoRef.current = false;
      if (fechaInicioManual || fechaFinManual) {
        onAplicarFechas("", "");
      }
      return;
    }

    const inicioManual = manualDesdeCalendarioGt(inicioDia);
    const finManual = finDia
      ? manualDesdeCalendarioGt(finDia)
      : pendienteFinRangoRef.current
        ? ""
        : inicioManual;

    const finDiaEfectivo = finDia ?? (pendienteFinRangoRef.current ? null : inicioDia);
    if (!finDiaEfectivo) {
      if (inicioManual !== fechaInicioManual || fechaFinManual) {
        onAplicarFechas(inicioManual, "");
      }
      return;
    }

    const inicioIso = `${inicioDia}T00:00:00-06:00`;
    const finIso = `${finDiaEfectivo}T23:59:59-06:00`;
    const conflicto = findConflictoDiaVehiculo(
      {
        vehiculo_id: vehiculoId,
        fecha_inicio: inicioIso,
        fecha_fin_estimada: finIso,
      },
      reservas,
    );
    if (conflicto) {
      toast.error("El vehículo ya tiene una reserva en las fechas seleccionadas.");
      pendienteFinRangoRef.current = false;
      setInicioDia(null);
      setFinDia(null);
      onAplicarFechas("", "");
      return;
    }

    if (inicioManual !== fechaInicioManual || finManual !== fechaFinManual) {
      onAplicarFechas(inicioManual, finManual);
    }
  }, [
    finDia,
    fechaFinManual,
    fechaInicioManual,
    inicioDia,
    onAplicarFechas,
    reservas,
    vehiculoId,
    habilitado,
  ]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale: es });
  const endDate = endOfWeek(monthEnd, { locale: es });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-700 dark:bg-zinc-900",
          !habilitado && "pointer-events-none opacity-55",
        )}
      >
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
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

        <div className="mx-3 h-px bg-zinc-200 dark:bg-zinc-700" />

        <div className="grid grid-cols-7 px-2 pt-2 pb-1">
          {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((day) => (
            <div
              key={day}
              className="flex h-8 items-center justify-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1 px-1.5 pb-3">
          {days.map((day, i) => {
            const dia = calendarioGtDesdeDate(day);
            const reservado = esDiaReservado(dia);
            const pasado = esDiaPasado(dia);
            const bloqueado = reservado || pasado;
            const enRango = diaEnRango(dia);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = dia === hoyGt;
            const rangoUnDia =
              rangoPreview !== null && rangoPreview.desde === rangoPreview.hasta;
            const esExtremoInicio =
              Boolean(rangoPreview) && enRango && !bloqueado && dia === rangoPreview!.desde;
            const esExtremoFin =
              Boolean(rangoPreview) && enRango && !bloqueado && dia === rangoPreview!.hasta;
            const esMedioRango =
              enRango && !bloqueado && !esExtremoInicio && !esExtremoFin && !rangoUnDia;
            const esMarcadorRango =
              enRango && !bloqueado && (rangoUnDia || esExtremoInicio || esExtremoFin);
            const reservaDia = reservado
              ? reservaPrioritariaEnDiaCalendario(dia, vehiculoId, reservas)
              : null;

            const celdaClassName = cn(
              "relative flex h-10 items-center justify-center",
              enRango && !bloqueado && !rangoUnDia && "bg-sky-100/95 dark:bg-sky-950/55",
              enRango &&
                !bloqueado &&
                !rangoUnDia &&
                esExtremoInicio &&
                "rounded-l-full",
              enRango &&
                !bloqueado &&
                !rangoUnDia &&
                esExtremoFin &&
                "rounded-r-full",
            );

            const dayButton = (
              <button
                type="button"
                disabled={bloqueado}
                onMouseEnter={() => {
                  if (inicioDia && !finDia) setHoverDia(dia);
                }}
                onMouseLeave={() => setHoverDia(null)}
                onClick={() => handleDiaClick(day)}
                className={cn(
                  "relative z-[1] flex size-9 items-center justify-center rounded-full text-sm font-medium transition-all duration-150",
                  reservado &&
                    "cursor-not-allowed bg-orange-100 font-semibold text-orange-800 dark:bg-orange-950/70 dark:text-orange-300",
                  pasado &&
                    !reservado &&
                    "cursor-not-allowed text-muted-foreground/30 line-through decoration-muted-foreground/40",
                  !bloqueado &&
                    !isCurrentMonth &&
                    !enRango &&
                    "text-muted-foreground/35",
                  !bloqueado &&
                    isCurrentMonth &&
                    !enRango &&
                    "text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800",
                  esMedioRango && "font-semibold text-[#2c5f9b] dark:text-[#6f9fd4]",
                  esMarcadorRango &&
                    "bg-[#2c5f9b] font-bold text-white shadow-sm ring-2 ring-[#2c5f9b]/25 dark:bg-[#6f9fd4] dark:text-zinc-900 dark:ring-[#6f9fd4]/35",
                  isToday &&
                    !enRango &&
                    !bloqueado &&
                    "ring-2 ring-[#2c5f9b]/35 ring-inset dark:ring-[#6f9fd4]/40",
                )}
              >
                {format(day, "d")}
              </button>
            );

            const celdaKey = `${day.toISOString()}-${i}`;

            if (reservaDia) {
              return (
                <div key={celdaKey} className={celdaClassName}>
                  <ReservaDiaCalendarioTooltip reserva={reservaDia}>{dayButton}</ReservaDiaCalendarioTooltip>
                </div>
              );
            }

            return (
              <div key={celdaKey} className={celdaClassName}>
                {dayButton}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-center text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded bg-[#2c5f9b] dark:bg-[#6f9fd4]" />
          Rango seleccionado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded bg-orange-200 dark:bg-orange-800" />
          Día reservado
        </span>
      </div>
    </div>
  );
}

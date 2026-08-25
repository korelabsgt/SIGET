"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  fechaCalendarioDesdePartes,
  normalizarParteFechaAnio,
  normalizarParteFechaDia,
  normalizarParteFechaMes,
  partesFechaCalendario,
} from "../lib/zod";

const parteInputClass =
  "h-10 min-w-0 flex-1 rounded-lg border border-zinc-200/80 bg-transparent px-2 py-2 text-center text-sm tabular-nums text-foreground outline-none transition-colors focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-400/25 dark:border-zinc-700 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-500/30";

export function FechaNacimientoCampos({
  value,
  onChange,
  required = false,
  diaId = "fecha-nac-dia",
  mesId = "fecha-nac-mes",
  anioId = "fecha-nac-anio",
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  diaId?: string;
  mesId?: string;
  anioId?: string;
}) {
  const [dia, setDia] = useState("");
  const [mes, setMes] = useState("");
  const [anio, setAnio] = useState("");
  const mesRef = useRef<HTMLInputElement>(null);
  const anioRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const partes = partesFechaCalendario(value);
    setDia(partes.dia);
    setMes(partes.mes);
    setAnio(partes.anio);
  }, [value]);

  const emit = (nextDia: string, nextMes: string, nextAnio: string) => {
    onChange(fechaCalendarioDesdePartes(nextDia, nextMes, nextAnio));
  };

  const handleDia = (raw: string) => {
    const next = normalizarParteFechaDia(raw);
    setDia(next);
    emit(next, mes, anio);
    if (next.length === 2) mesRef.current?.focus();
  };

  const handleMes = (raw: string) => {
    const next = normalizarParteFechaMes(raw);
    setMes(next);
    emit(dia, next, anio);
    if (next.length === 2) anioRef.current?.focus();
  };

  const handleAnio = (raw: string) => {
    const next = normalizarParteFechaAnio(raw);
    setAnio(next);
    emit(dia, mes, next);
  };

  return (
    <div className="flex min-w-0 items-center gap-2">
      <input
        id={diaId}
        type="text"
        inputMode="numeric"
        autoComplete="bday-day"
        placeholder="DD"
        value={dia}
        onChange={(e) => handleDia(e.target.value)}
        maxLength={2}
        required={required}
        aria-label="Día de nacimiento"
        className={cn(parteInputClass, "max-w-[4.5rem]")}
      />
      <span className="shrink-0 text-sm font-semibold text-muted-foreground">
        /
      </span>
      <input
        ref={mesRef}
        id={mesId}
        type="text"
        inputMode="numeric"
        autoComplete="bday-month"
        placeholder="MM"
        value={mes}
        onChange={(e) => handleMes(e.target.value)}
        maxLength={2}
        required={required}
        aria-label="Mes de nacimiento"
        className={cn(parteInputClass, "max-w-[4.5rem]")}
      />
      <span className="shrink-0 text-sm font-semibold text-muted-foreground">
        /
      </span>
      <input
        ref={anioRef}
        id={anioId}
        type="text"
        inputMode="numeric"
        autoComplete="bday-year"
        placeholder="AAAA"
        value={anio}
        onChange={(e) => handleAnio(e.target.value)}
        maxLength={4}
        required={required}
        aria-label="Año de nacimiento"
        className={cn(parteInputClass, "max-w-[5.5rem]")}
      />
    </div>
  );
}

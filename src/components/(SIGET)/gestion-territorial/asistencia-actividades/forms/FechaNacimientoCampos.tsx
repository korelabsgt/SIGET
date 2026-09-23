"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatFechaManualGt, parseFechaManualGt } from "@/lib/fechas-gt";
import { REGISTRO_PUBLICO_FIELD_CLASS } from "./modal-field-class";

const slotClass =
  "bg-transparent text-center text-sm outline-none placeholder:text-muted-foreground";

export function FechaNacimientoCampos({
  value,
  onChange,
  required = false,
  diaId = "fecha-nac-dia",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  diaId?: string;
  mesId?: string;
  anioId?: string;
  className?: string;
}) {
  const [dia, setDia] = useState("");
  const [mes, setMes] = useState("");
  const [anio, setAnio] = useState("");
  const diaRef = useRef<HTMLInputElement>(null);
  const mesRef = useRef<HTMLInputElement>(null);
  const anioRef = useRef<HTMLInputElement>(null);
  const enFoco = useRef(false);

  useEffect(() => {
    if (enFoco.current) return;
    const formatted = formatFechaManualGt(value);
    if (!formatted) {
      if (!value) {
        setDia("");
        setMes("");
        setAnio("");
      }
      return;
    }
    const [d, m, y] = formatted.split("/");
    setDia(d ?? "");
    setMes(m ?? "");
    setAnio(y ?? "");
  }, [value]);

  const emitir = (d: string, m: string, y: string) => {
    if (!d && !m && !y) {
      onChange("");
      return;
    }
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      const parsed = parseFechaManualGt(`${d}/${m}/${y}`);
      if (parsed) onChange(parsed);
    }
  };

  const soloDigitos = (raw: string, max: number) =>
    raw.replace(/\D/g, "").slice(0, max);

  const aplicarPegado = (texto: string) => {
    const digits = texto.replace(/\D/g, "").slice(0, 8);
    if (!digits) return;
    const d = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    const y = digits.slice(4, 8);
    setDia(d);
    setMes(m);
    setAnio(y);
    emitir(d, m, y);
    if (y.length === 4) anioRef.current?.focus();
    else if (m.length === 2) anioRef.current?.focus();
    else if (d.length === 2) mesRef.current?.focus();
  };

  const marcarFoco = () => {
    enFoco.current = true;
  };
  const soltarFoco = () => {
    enFoco.current = false;
  };

  return (
    <div
      className={cn(
        REGISTRO_PUBLICO_FIELD_CLASS,
        "items-center gap-1",
        className,
      )}
    >
      <input
        id={diaId}
        ref={diaRef}
        type="text"
        inputMode="numeric"
        autoComplete="bday-day"
        placeholder="DD"
        maxLength={2}
        required={required}
        aria-label="Día de nacimiento"
        value={dia}
        onFocus={marcarFoco}
        onBlur={soltarFoco}
        onPaste={(e) => {
          e.preventDefault();
          aplicarPegado(e.clipboardData.getData("text"));
        }}
        onChange={(e) => {
          const next = soloDigitos(e.target.value, 2);
          setDia(next);
          emitir(next, mes, anio);
          if (next.length === 2) mesRef.current?.focus();
        }}
        onKeyDown={(e) => {
          if (
            e.key === "ArrowRight" &&
            (diaRef.current?.selectionStart ?? 0) >= dia.length
          ) {
            e.preventDefault();
            mesRef.current?.focus();
          }
        }}
        className={cn(slotClass, "w-8")}
      />
      <span className="text-muted-foreground">/</span>
      <input
        ref={mesRef}
        type="text"
        inputMode="numeric"
        autoComplete="bday-month"
        placeholder="MM"
        maxLength={2}
        aria-label="Mes de nacimiento"
        value={mes}
        onFocus={marcarFoco}
        onBlur={soltarFoco}
        onPaste={(e) => {
          e.preventDefault();
          aplicarPegado(e.clipboardData.getData("text"));
        }}
        onChange={(e) => {
          const next = soloDigitos(e.target.value, 2);
          setMes(next);
          emitir(dia, next, anio);
          if (next.length === 2) anioRef.current?.focus();
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && mes === "") {
            e.preventDefault();
            diaRef.current?.focus();
          }
          if (
            e.key === "ArrowLeft" &&
            (mesRef.current?.selectionStart ?? 0) === 0
          ) {
            e.preventDefault();
            diaRef.current?.focus();
          }
          if (
            e.key === "ArrowRight" &&
            (mesRef.current?.selectionStart ?? 0) >= mes.length
          ) {
            e.preventDefault();
            anioRef.current?.focus();
          }
        }}
        className={cn(slotClass, "w-8")}
      />
      <span className="text-muted-foreground">/</span>
      <input
        ref={anioRef}
        type="text"
        inputMode="numeric"
        autoComplete="bday-year"
        placeholder="AAAA"
        maxLength={4}
        aria-label="Año de nacimiento"
        value={anio}
        onFocus={marcarFoco}
        onBlur={soltarFoco}
        onPaste={(e) => {
          e.preventDefault();
          aplicarPegado(e.clipboardData.getData("text"));
        }}
        onChange={(e) => {
          const next = soloDigitos(e.target.value, 4);
          setAnio(next);
          emitir(dia, mes, next);
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && anio === "") {
            e.preventDefault();
            mesRef.current?.focus();
          }
          if (
            e.key === "ArrowLeft" &&
            (anioRef.current?.selectionStart ?? 0) === 0
          ) {
            e.preventDefault();
            mesRef.current?.focus();
          }
        }}
        className={cn(slotClass, "w-12")}
      />
    </div>
  );
}

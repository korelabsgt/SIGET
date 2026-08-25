"use client";

import React, { useState, useEffect, useRef } from "react";
import { format, isValid, parse, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale/es";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/lib/utils";

interface CalendarDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  id?: string;
  required?: boolean;
}

export function CalendarDatePicker({
  value,
  onChange,
  className,
  inputClassName,
  id,
  required,
}: CalendarDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Sincronizar value externo (YYYY-MM-DD) al formato interno del input (DD/MM/YYYY)
  useEffect(() => {
    if (value) {
      const parsed = parseISO(value);
      if (isValid(parsed)) {
        setInputValue(format(parsed, "dd/MM/yyyy"));
        setCurrentMonth(parsed);
      }
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ""); // Solo números
    if (val.length > 8) val = val.slice(0, 8);

    // Formatear automáticamente con slashes
    let formatted = val;
    if (val.length > 2 && val.length <= 4) {
      formatted = `${val.slice(0, 2)}/${val.slice(2)}`;
    } else if (val.length > 4) {
      formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
    }
    setInputValue(formatted);

    // Si está completo (10 caracteres), intentar emitir fecha
    if (formatted.length === 10) {
      const parsed = parse(formatted, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) {
        onChange(format(parsed, "yyyy-MM-dd"));
        setCurrentMonth(parsed);
      }
    } else {
      // Si se borra o está incompleto y antes había valor, limpiamos para no mandar basura (o mantener el último válido)
      if (formatted === "") {
        onChange("");
      }
    }
  };

  const handleSelectDay = (day: Date) => {
    setInputValue(format(day, "dd/MM/yyyy"));
    onChange(format(day, "yyyy-MM-dd"));
    setOpen(false);
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
    setOpen(false);
  };

  const handleHoy = () => {
    const hoy = new Date();
    setInputValue(format(hoy, "dd/MM/yyyy"));
    onChange(format(hoy, "yyyy-MM-dd"));
    setCurrentMonth(hoy);
    setOpen(false);
  };

  // Generar días del calendario
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  // En español la semana suele empezar en lunes, pero lo ajustamos a domingo como Chrome por defecto o lunes, según locale
  const startDate = startOfWeek(monthStart, { locale: es });
  const endDate = endOfWeek(monthEnd, { locale: es });

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const selectedDate = value ? parseISO(value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative w-full", className)}>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder="DD/MM/AAAA"
          value={inputValue}
          onChange={handleInputChange}
          required={required}
          className={cn(
            "flex h-10 w-full rounded-lg border-2 border-celeste-trifinio bg-transparent px-3 py-2 pr-10 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio/30 transition-all outline-none",
            inputClassName,
          )}
        />
        <PopoverTrigger asChild>
          <button
            type="button"
            className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
          >
            <CalendarIcon className="size-4" />
          </button>
        </PopoverTrigger>
      </div>

      <PopoverContent
        align="start"
        className="z-[210] w-[320px] border-zinc-200/80 bg-white/95 p-0 shadow-2xl shadow-black/20 backdrop-blur-xl dark:border-zinc-700/60 dark:bg-zinc-900/95 rounded-2xl"
      >
        {/* Header con navegación de mes */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-sky-50 hover:text-celeste-trifinio dark:hover:bg-sky-950/50 cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="text-sm font-bold capitalize tracking-wide text-foreground">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </div>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-sky-50 hover:text-celeste-trifinio dark:hover:bg-sky-950/50 cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Separador */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent dark:via-zinc-700" />

        {/* Días de la semana */}
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

        {/* Grid de días */}
        <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
          {days.map((day, i) => {
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={day.toISOString() + i}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={cn(
                  "relative flex h-10 w-full items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer",
                  !isCurrentMonth
                    ? "text-muted-foreground/30 hover:text-muted-foreground/50"
                    : "text-foreground hover:bg-sky-50 hover:text-celeste-trifinio dark:hover:bg-sky-950/40",
                  isSelected &&
                    "bg-gradient-to-br from-celeste-trifinio to-sky-500 text-white shadow-md shadow-sky-500/30 hover:from-celeste-trifinio/90 hover:to-sky-500/90 hover:text-white font-bold dark:shadow-sky-500/20",
                  isToday &&
                    !isSelected &&
                    "font-bold text-celeste-trifinio ring-2 ring-celeste-trifinio/30 ring-inset"
                )}
              >
                {format(day, dateFormat)}
              </button>
            );
          })}
        </div>

        {/* Footer con acciones */}
        <div className="flex items-center justify-between border-t border-zinc-200/80 px-4 py-3 dark:border-zinc-700/60">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg px-3 py-1.5 text-xs font-bold text-muted-foreground transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 cursor-pointer"
          >
            Borrar
          </button>
          <button
            type="button"
            onClick={handleHoy}
            className="rounded-lg bg-celeste-trifinio/10 px-4 py-1.5 text-xs font-bold text-celeste-trifinio transition-all hover:bg-celeste-trifinio hover:text-white dark:bg-sky-500/10 dark:hover:bg-sky-500 cursor-pointer"
          >
            Hoy
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

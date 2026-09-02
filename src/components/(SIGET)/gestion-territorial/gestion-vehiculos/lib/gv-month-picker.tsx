"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { mesCalendarioGt, normalizarMesCalendario } from "@/lib/fechas-gt";
import { GV_FILTRO_FIELD_CLASS } from "./gv-header-ui";

const MESES_CORTOS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const;

function parseMes(value: string) {
  const mes = normalizarMesCalendario(value) || mesCalendarioGt();
  const [year, month] = mes.split("-").map(Number);
  return { year, month, mes };
}

export function GvMonthPicker({
  value,
  onChange,
  className,
}: {
  /** YYYY-MM */
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const parsed = parseMes(value);
  const [viewYear, setViewYear] = useState(parsed.year);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setViewYear(parsed.year);
  }, [parsed.year]);

  const label = useMemo(() => {
    const date = new Date(parsed.year, parsed.month - 1, 1);
    return format(date, "MMM yyyy", { locale: es });
  }, [parsed.year, parsed.month]);

  const selectMonth = (mes: number) => {
    onChange(`${viewYear}-${String(mes).padStart(2, "0")}`);
    setOpen(false);
  };

  const handleEsteMes = () => {
    const current = mesCalendarioGt();
    onChange(current);
    setViewYear(Number(current.split("-")[0]));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            GV_FILTRO_FIELD_CLASS,
            "inline-flex h-11 w-[10.5rem] shrink-0 cursor-pointer items-center justify-between gap-2 px-3 text-left capitalize",
            className,
          )}
        >
          <span className="truncate text-sm font-semibold">{label}</span>
          <CalendarIcon className="size-4 shrink-0 text-celeste-trifinio" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="center"
        className="z-[210] w-[280px] border-zinc-200/80 bg-white/95 p-0 shadow-2xl shadow-black/20 backdrop-blur-xl dark:border-zinc-700/60 dark:bg-zinc-900/95 rounded-2xl"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <button
            type="button"
            onClick={() => setViewYear((y) => y - 1)}
            className="flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-sky-50 hover:text-celeste-trifinio dark:hover:bg-sky-950/50"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="text-sm font-bold tracking-wide text-foreground">{viewYear}</div>
          <button
            type="button"
            onClick={() => setViewYear((y) => y + 1)}
            className="flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-sky-50 hover:text-celeste-trifinio dark:hover:bg-sky-950/50"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent dark:via-zinc-700" />

        <div className="grid grid-cols-3 gap-1.5 p-3">
          {MESES_CORTOS.map((nombre, index) => {
            const mesNum = index + 1;
            const selected = viewYear === parsed.year && mesNum === parsed.month;

            return (
              <button
                key={nombre}
                type="button"
                onClick={() => selectMonth(mesNum)}
                className={cn(
                  "cursor-pointer rounded-xl px-2 py-2.5 text-xs font-bold uppercase tracking-wide transition-all",
                  selected
                    ? "bg-celeste-trifinio text-white shadow-md shadow-sky-500/25"
                    : "text-foreground hover:bg-sky-50 hover:text-celeste-trifinio dark:hover:bg-sky-950/40",
                )}
              >
                {nombre}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end border-t border-zinc-200/80 px-4 py-3 dark:border-zinc-700/60">
          <button
            type="button"
            onClick={handleEsteMes}
            className="cursor-pointer rounded-lg bg-celeste-trifinio/10 px-4 py-1.5 text-xs font-bold text-celeste-trifinio transition-all hover:bg-celeste-trifinio hover:text-white dark:bg-sky-500/10 dark:hover:bg-sky-500"
          >
            Este mes
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

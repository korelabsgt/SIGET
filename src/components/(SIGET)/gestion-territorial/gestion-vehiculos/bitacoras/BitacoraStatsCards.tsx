"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Route, Fuel, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsProps {
  metrics: {
    total_km: number;
    total_combustible: number;
    total_misiones: number;
  };
  mesLabel?: string;
  filtroVehiculo?: boolean;
}

export function BitacoraStatsCards({
  metrics,
  mesLabel,
  filtroVehiculo = false,
}: StatsProps) {
  const periodoBase = mesLabel ?? "Mes";
  const periodoLabel = filtroVehiculo ? `${periodoBase} · Vehículo` : periodoBase;

  const montoCombustible = metrics.total_combustible.toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const stats: {
    labelMobile: string;
    labelDesktop: string;
    value: ReactNode;
    icon: ReactNode;
    bg: string;
    border: string;
  }[] = [
    {
      labelMobile: "Recorrido",
      labelDesktop: `Recorrido total (${periodoLabel})`,
      value: (
        <>
          {metrics.total_km.toLocaleString("es-GT")}
          <span className="ml-0.5 text-[0.85em] font-bold text-muted-foreground">km</span>
        </>
      ),
      icon: <Route className="size-4 text-indigo-500 sm:size-5" />,
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      labelMobile: "Combustible",
      labelDesktop: "Consumo combustible",
      value: (
        <>
          <span className="text-[0.9em] font-bold text-muted-foreground">Q.</span>
          {montoCombustible}
        </>
      ),
      icon: <Fuel className="size-4 text-rose-500 sm:size-5" />,
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      labelMobile: "Misiones",
      labelDesktop: "Misiones completadas",
      value: metrics.total_misiones.toLocaleString("es-GT"),
      icon: <CheckCircle2 className="size-4 text-emerald-500 sm:size-5" />,
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-2">
      <p className="text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:hidden">
        {periodoLabel}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.labelDesktop}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: i * 0.08 }}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border bg-card p-2 text-center shadow-sm dark:bg-zinc-900/30 sm:gap-3 sm:p-4 sm:text-left md:flex-row md:items-center md:gap-4 md:p-5",
              stat.border,
            )}
          >
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-xl sm:size-11 md:size-12",
                stat.bg,
              )}
            >
              {stat.icon}
            </div>
            <div className="flex w-full min-w-0 flex-col items-center md:items-start">
              <p className="w-full text-[9px] font-bold uppercase leading-tight tracking-wide text-muted-foreground sm:text-xs sm:tracking-wider">
                <span className="sm:hidden">{stat.labelMobile}</span>
                <span className="hidden sm:inline">{stat.labelDesktop}</span>
              </p>
              <p className="mt-0.5 w-full text-[13px] font-black tabular-nums leading-tight text-foreground sm:mt-1 sm:text-xl md:text-2xl">
                {stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Route, Fuel, CheckCircle2 } from "lucide-react";
import {
  GV_STATS_KPI_BODY_CLASS,
  GV_STATS_KPI_CARD_CLASS,
  GV_STATS_KPI_GRID_CLASS,
  GV_STATS_KPI_ICON_BOX_CLASS,
  GV_STATS_KPI_TITLE_CLASS,
  GV_STATS_KPI_VALUE_CLASS,
} from "../lib/detalle-ui";
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

  const stats = [
    {
      title: `Recorrido Total (${periodoLabel})`,
      value: `${metrics.total_km.toLocaleString()} km`,
      icon: <Route className="h-5 w-5 text-indigo-500" />,
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      title: "Consumo Combustible",
      value: `Q. ${metrics.total_combustible.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <Fuel className="h-5 w-5 text-rose-500" />,
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      title: "Misiones Completadas",
      value: metrics.total_misiones.toString(),
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  return (
    <div className={cn(GV_STATS_KPI_GRID_CLASS, "grid-cols-3")}>
      {stats.map((stat, i) => (
        <motion.div
          key={`${stat.title}-${stat.value}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className={cn(GV_STATS_KPI_CARD_CLASS, stat.border)}
        >
          <div className={cn(GV_STATS_KPI_ICON_BOX_CLASS, stat.bg)}>{stat.icon}</div>
          <div className={GV_STATS_KPI_BODY_CLASS}>
            <p className={GV_STATS_KPI_TITLE_CLASS}>{stat.title}</p>
            <p className={GV_STATS_KPI_VALUE_CLASS}>{stat.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

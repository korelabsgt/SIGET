"use client";

import { motion } from "framer-motion";
import { Route, Fuel, CheckCircle2 } from "lucide-react";

interface StatsProps {
  metrics: {
    total_km: number;
    total_combustible: number;
    total_misiones: number;
  };
  filtroVehiculo?: boolean;
}

export function BitacoraStatsCards({ metrics, filtroVehiculo = false }: StatsProps) {
  const periodoLabel = filtroVehiculo ? "Mes · Vehículo filtrado" : "Mes";

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
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      {stats.map((stat, i) => (
        <motion.div
          key={`${stat.title}-${stat.value}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className={`flex items-center gap-4 rounded-2xl border ${stat.border} bg-card p-5 shadow-sm dark:bg-zinc-900/30`}
        >
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
            {stat.icon}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {stat.title}
            </p>
            <p className="mt-1 text-2xl font-black text-foreground">{stat.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

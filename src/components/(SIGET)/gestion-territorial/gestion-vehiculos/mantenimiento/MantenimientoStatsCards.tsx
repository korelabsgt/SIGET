"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GV_STATS_KPI_BODY_CLASS,
  GV_STATS_KPI_CARD_CLASS,
  GV_STATS_KPI_GRID_CLASS,
  GV_STATS_KPI_ICON_BOX_CLASS,
  GV_STATS_KPI_TITLE_CLASS,
  GV_STATS_KPI_VALUE_CLASS,
} from "../lib/detalle-ui";

interface StatsProps {
  metrics: {
    fallasActivas: number;
    unidadesFueraDeServicio: number;
    promedioDias: number;
  };
  showPromedio?: boolean;
}

export function MantenimientoStatsCards({ metrics, showPromedio = true }: StatsProps) {
  const stats = [
    {
      title: "Fallas activas",
      value: metrics.fallasActivas.toString(),
      icon: <Activity className="h-5 w-5 text-orange-500" />,
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    },
    {
      title: "Fuera de servicio",
      value: metrics.unidadesFueraDeServicio.toString(),
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
    ...(showPromedio
      ? [
          {
            title: "Promedio reparación",
            value: `${metrics.promedioDias} días`,
            icon: <Clock className="h-5 w-5 text-sky-500" />,
            bg: "bg-sky-500/10",
            border: "border-sky-500/20",
          },
        ]
      : []),
  ];

  return (
    <div
      className={cn(
        GV_STATS_KPI_GRID_CLASS,
        stats.length === 2 ? "grid-cols-2" : "grid-cols-3",
      )}
    >
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

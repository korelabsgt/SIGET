"use client";

import { useState } from "react";
import type { IconNode } from "lucide";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Car,
  ClipboardList,
  FileText,
  Fuel,
  Globe2,
  Library,
  Map,
  Newspaper,
  PieChart,
  Send,
} from "lucide";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { cn } from "@/lib/utils";
import type { DashboardModule } from "./modules";

type Accent = {
  border: string;
  ring: string;
  badge: string;
  button: string;
  check: string;
  iconBg: string;
  iconColor: string;
};

type CardVisual = {
  badge: string;
  cta: string;
  iconFrom: IconNode;
  iconTo: IconNode;
  accent: Accent;
  features: { label: string; iconFrom: IconNode; iconTo: IconNode }[];
};

const CARD_VISUAL: Record<string, CardVisual> = {
  "gestion-territorial": {
    badge: "Operación institucional",
    cta: "Entrar a Gestión",
    iconFrom: ClipboardList,
    iconTo: Car,
    accent: {
      border: "border-blue-300/40 dark:border-blue-400/20",
      ring: "ring-blue-300/20",
      badge: "bg-blue-500/90",
      button: "bg-blue-500 hover:bg-blue-600",
      check: "text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-400/10",
      iconColor: "#60a5fa",
    },
    features: [
      { label: "Registro de actividades", iconFrom: ClipboardList, iconTo: FileText },
      { label: "Flota y combustible", iconFrom: Car, iconTo: Fuel },
      { label: "Memoria de labores", iconFrom: FileText, iconTo: ClipboardList },
    ],
  },
  repositorio: {
    badge: "Conocimiento",
    cta: "Entrar al Repositorio",
    iconFrom: BookOpen,
    iconTo: Newspaper,
    accent: {
      border: "border-orange-300/40 dark:border-orange-400/20",
      ring: "ring-orange-300/20",
      badge: "bg-orange-400/90",
      button: "bg-orange-400 hover:bg-orange-500",
      check: "text-orange-400",
      iconBg: "bg-orange-50 dark:bg-orange-400/10",
      iconColor: "#fb923c",
    },
    features: [
      { label: "Noticias institucionales", iconFrom: Newspaper, iconTo: Send },
      { label: "Documentos científicos", iconFrom: BookOpen, iconTo: FileText },
      { label: "Revisión y publicación", iconFrom: Library, iconTo: Send },
    ],
  },
  observatorio: {
    badge: "Datos regionales",
    cta: "Entrar al Observatorio",
    iconFrom: Globe2,
    iconTo: BarChart3,
    accent: {
      border: "border-violet-300/40 dark:border-violet-400/20",
      ring: "ring-violet-300/20",
      badge: "bg-violet-400/90",
      button: "bg-violet-400 hover:bg-violet-500",
      check: "text-violet-400",
      iconBg: "bg-violet-50 dark:bg-violet-400/10",
      iconColor: "#a78bfa",
    },
    features: [
      { label: "Visualización de indicadores", iconFrom: BarChart3, iconTo: PieChart },
      { label: "Mapas y estadísticas", iconFrom: Map, iconTo: Globe2 },
      { label: "Consulta en tiempo real", iconFrom: Globe2, iconTo: BarChart3 },
    ],
  },
};

const FALLBACK_VISUAL: CardVisual = {
  badge: "Módulo",
  cta: "Entrar",
  iconFrom: ArrowRight,
  iconTo: ArrowRight,
  accent: {
    border: "border-sky-300/40 dark:border-sky-400/20",
    ring: "ring-sky-300/20",
    badge: "bg-sky-400/90",
    button: "bg-sky-400 hover:bg-sky-500",
    check: "text-sky-400",
    iconBg: "bg-sky-50 dark:bg-sky-400/10",
    iconColor: "#38bdf8",
  },
  features: [],
};

type DashboardModulosProps = {
  modules: DashboardModule[];
  onOpen: (id: string, href: string) => void;
  navigatingId: string | null;
};

export function DashboardModulos({
  modules,
  onOpen,
  navigatingId,
}: DashboardModulosProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:justify-center">
      {modules.map((mod) => {
        const visual = CARD_VISUAL[mod.id] ?? FALLBACK_VISUAL;
        const hovered = hoveredId === mod.id;
        const navigating = navigatingId === mod.id;

        return (
          <div
            key={mod.id}
            className={cn(
              "group flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border bg-card p-0 shadow-lg ring-1 transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-xl",
              visual.accent.border,
              visual.accent.ring,
              navigating && "pointer-events-none opacity-80",
            )}
            onMouseEnter={() => setHoveredId(mod.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onOpen(mod.id, mod.href)}
          >
            <div
              className={cn(
                "py-2 text-center text-[10px] font-black uppercase tracking-widest text-white",
                visual.accent.badge,
              )}
            >
              {visual.badge}
            </div>
            <div className="flex h-full flex-col px-5 py-8">
              <div className="mb-8 flex flex-col gap-3">
                <div className="flex items-center gap-5">
                  <div
                    className={cn(
                      "flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 ease-out group-hover:scale-110",
                      visual.accent.iconBg,
                    )}
                  >
                    <MorphHoverIcon
                      from={visual.iconFrom}
                      to={visual.iconTo}
                      hovered={hovered}
                      size={40}
                      color={visual.accent.iconColor}
                    />
                  </div>
                  <h3 className="min-w-0 text-2xl font-black leading-none text-slate-900 dark:text-white">
                    {mod.title}
                    <span className="mt-1 block text-lg font-black text-slate-500 dark:text-slate-400">
                      {mod.subtitle}
                    </span>
                  </h3>
                </div>
                <p className="text-sm font-medium leading-snug text-slate-500 dark:text-slate-400">
                  {mod.desc}
                </p>
              </div>
              <div
                className={cn(
                  "pointer-events-none mb-8 w-full rounded-xl py-3.5 text-center text-sm font-bold text-white",
                  visual.accent.button,
                )}
              >
                {navigating ? "Entrando…" : visual.cta}
              </div>
              <ul className="mt-auto w-full space-y-4">
                {visual.features.map((feature) => (
                  <li
                    key={feature.label}
                    className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300"
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center",
                        visual.accent.check,
                      )}
                    >
                      <MorphHoverIcon
                        from={feature.iconFrom}
                        to={feature.iconTo}
                        hovered={hovered}
                        size={18}
                        color={visual.accent.iconColor}
                        spring="snappy"
                      />
                    </span>
                    {feature.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}

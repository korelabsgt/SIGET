"use client";

import { Droplets, Map, MapPinned, Satellite, Globe, Waves } from "lucide";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { cn } from "@/lib/utils";
import type { JaMapVista } from "./lib/map-tiles";

const VISTAS = [
  {
    id: "hidrografia" as const,
    label: "Hidrografía",
    aria: "Vista de hidrografía con ríos y lagos",
    from: Waves,
    to: Droplets,
  },
  {
    id: "mapa" as const,
    label: "Mapa",
    aria: "Vista de mapa base",
    from: Map,
    to: MapPinned,
  },
  {
    id: "satelite" as const,
    label: "Satélite",
    aria: "Vista satelital híbrida",
    from: Satellite,
    to: Globe,
  },
];

export function JaMapBasemapSwitches({
  vista,
  onVistaChange,
}: {
  vista: JaMapVista;
  onVistaChange: (vista: JaMapVista) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Vista del mapa"
      className="inline-flex flex-wrap items-center rounded-full bg-zinc-100 p-1 dark:bg-zinc-800"
    >
      {VISTAS.map((item) => {
        const active = vista === item.id;
        const azul = item.id === "hidrografia";
        const color = active
          ? azul
            ? "#2c5f9b"
            : "#3f3f46"
          : "#71717a";
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={item.aria}
            onClick={() => onVistaChange(item.id)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              active
                ? azul
                  ? "bg-white text-[#2c5f9b] dark:bg-zinc-950 dark:text-[#6f9fd4]"
                  : "bg-white text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                : "text-zinc-500 dark:text-zinc-400",
            )}
          >
            <MorphHoverIcon
              from={item.from}
              to={item.to}
              size={16}
              color={color}
              strokeWidth={2}
              spring="snappy"
              hovered={active}
            />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

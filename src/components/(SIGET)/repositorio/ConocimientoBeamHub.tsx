"use client";

import { forwardRef, useRef, useState } from "react";
import type { IconNode } from "lucide";
import {
  BookOpen,
  FileText,
  FlaskConical,
  GraduationCap,
  Library,
  Microscope,
  Newspaper,
  Send,
} from "lucide";
import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { cn } from "@/lib/utils";

const AZUL_TRIFINIO = "#2c5f9b";
const CELESTE_TRIFINIO = "#6f9fd4";

const BEAM_BASE = {
  pathColor: AZUL_TRIFINIO,
  pathOpacity: 0.22,
  pathWidth: 2,
  gradientStartColor: CELESTE_TRIFINIO,
  gradientStopColor: AZUL_TRIFINIO,
  duration: 4,
};

type ConocimientoBeamItem = {
  label: string;
  href: string;
  iconFrom: IconNode;
  iconTo: IconNode;
  iconColor: string;
  iconBg: string;
};

const CONOCIMIENTO_BEAM_ITEMS: ConocimientoBeamItem[] = [
  {
    label: "Noticias",
    href: "/conocimiento/noticias",
    iconFrom: Newspaper,
    iconTo: Send,
    iconColor: "#fb923c",
    iconBg: "bg-orange-50 dark:bg-orange-400/10",
  },
  {
    label: "Documentos",
    href: "/conocimiento/documentos",
    iconFrom: FileText,
    iconTo: Library,
    iconColor: AZUL_TRIFINIO,
    iconBg: "bg-sky-50 dark:bg-sky-950/50",
  },
  {
    label: "Educación",
    href: "/conocimiento/educativo",
    iconFrom: GraduationCap,
    iconTo: BookOpen,
    iconColor: "#1a95d3",
    iconBg: "bg-sky-50 dark:bg-sky-950/50",
  },
  {
    label: "Ciencia",
    href: "/conocimiento/cientifico",
    iconFrom: FlaskConical,
    iconTo: Microscope,
    iconColor: "#6366f1",
    iconBg: "bg-indigo-50 dark:bg-indigo-950/50",
  },
];

const BeamAnchor = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => (
  <div ref={ref} className={cn("relative z-10 shrink-0", className)}>
    {children}
  </div>
));
BeamAnchor.displayName = "BeamAnchor";

function ConocimientoCanalPill({
  item,
  hovered,
  onHover,
  compact,
  compactoHome,
}: {
  item: ConocimientoBeamItem;
  hovered: boolean;
  onHover: (active: boolean) => void;
  compact?: boolean;
  compactoHome?: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-full border border-azul-trifinio/25 bg-white py-2 pl-2 pr-3.5 shadow-sm transition-colors hover:border-celeste-trifinio hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800",
        compact
          ? "gap-4 rounded-2xl px-4 py-3"
          : compactoHome
            ? "gap-2.5 py-2 pl-2 pr-4 md:gap-3 md:py-2.5 md:pl-2.5 md:pr-5"
            : "gap-3 py-3 pl-2.5 pr-5 md:gap-3.5 md:py-3.5 md:pl-3 md:pr-6",
      )}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl transition-transform duration-300 ease-out",
          item.iconBg,
          compact
            ? "size-14 rounded-2xl"
            : compactoHome
              ? "size-9 md:size-10"
              : "size-11 md:size-12",
          hovered && "scale-110",
        )}
      >
        <MorphHoverIcon
          from={item.iconFrom}
          to={item.iconTo}
          hovered={hovered}
          size={compact ? 28 : compactoHome ? 20 : 26}
          color={item.iconColor}
        />
      </span>
      <span
        className={cn(
          "whitespace-nowrap font-black uppercase text-azul-trifinio dark:text-celeste-trifinio",
          compact
            ? "text-sm tracking-wider"
            : compactoHome
              ? "text-[9px] tracking-[0.12em] md:text-[10px] md:tracking-wider"
              : "text-[10px] tracking-[0.14em] md:text-xs md:tracking-wider",
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

function itemByLabel(label: string) {
  const found = CONOCIMIENTO_BEAM_ITEMS.find((i) => i.label === label);
  if (!found) throw new Error(`ConocimientoBeamHub: item ${label}`);
  return found;
}

export function ConocimientoBeamHub({ compactoHome = false }: { compactoHome?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const noticiasRef = useRef<HTMLDivElement>(null);
  const educacionRef = useRef<HTMLDivElement>(null);
  const documentosRef = useRef<HTMLDivElement>(null);
  const cienciaRef = useRef<HTMLDivElement>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const pillProps = (label: string) => ({
    item: itemByLabel(label),
    hovered: hoveredLabel === label,
    onHover: (active: boolean) => setHoveredLabel(active ? label : null),
    compactoHome,
  });

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className={cn(
          "relative mx-auto hidden w-full max-w-2xl items-center justify-center overflow-visible md:flex lg:max-w-3xl",
          compactoHome
            ? "my-2 p-4 md:my-4 md:min-h-[22rem] md:p-6 lg:min-h-[24rem]"
            : "my-6 p-6 md:my-12 md:min-h-[26rem] md:p-8 lg:min-h-[28rem]",
        )}
      >
        <div
          className={cn(
            "flex w-full max-w-xl flex-col items-center lg:max-w-2xl",
            compactoHome ? "gap-6 md:gap-8" : "gap-8 md:gap-10",
          )}
        >
          <BeamAnchor ref={noticiasRef} className="flex justify-center">
            <ConocimientoCanalPill {...pillProps("Noticias")} />
          </BeamAnchor>

          <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-x-3 md:gap-x-6 lg:gap-x-10">
            <BeamAnchor ref={educacionRef} className="flex justify-end">
              <ConocimientoCanalPill {...pillProps("Educación")} />
            </BeamAnchor>

            <BeamAnchor ref={centerRef} className="flex justify-center px-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 120 }}
                className={cn(
                  "z-10 flex items-center justify-center rounded-full border-2 border-azul-trifinio/35 bg-white shadow-[0_0_40px_-12px_rgba(44,95,155,0.5)] dark:border-celeste-trifinio/40 dark:bg-zinc-900",
                  compactoHome
                    ? "size-32 md:size-36 lg:size-40"
                    : "size-36 md:size-44 lg:size-52",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/trifinio/logo-vertical.png"
                  alt="Plan Trifinio"
                  className="h-[58%] w-[52%] max-h-full max-w-full object-contain object-center"
                />
              </motion.div>
            </BeamAnchor>

            <BeamAnchor ref={cienciaRef} className="flex justify-start">
              <ConocimientoCanalPill {...pillProps("Ciencia")} />
            </BeamAnchor>
          </div>

          <BeamAnchor ref={documentosRef} className="flex justify-center">
            <ConocimientoCanalPill {...pillProps("Documentos")} />
          </BeamAnchor>
        </div>

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={noticiasRef}
          toRef={centerRef}
          curvature={-48}
          endYOffset={-8}
          {...BEAM_BASE}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={documentosRef}
          toRef={centerRef}
          curvature={48}
          endYOffset={8}
          {...BEAM_BASE}
          delay={0.25}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={educacionRef}
          toRef={centerRef}
          {...BEAM_BASE}
          delay={0.4}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={cienciaRef}
          toRef={centerRef}
          reverse
          {...BEAM_BASE}
          delay={0.55}
        />
      </div>

      <ul className="mt-4 w-full space-y-3 md:hidden">
        {CONOCIMIENTO_BEAM_ITEMS.map((item) => (
          <li key={item.label}>
            <ConocimientoCanalPill
              item={item}
              hovered={hoveredLabel === item.label}
              onHover={(active) => setHoveredLabel(active ? item.label : null)}
              compact
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

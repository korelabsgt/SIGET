"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  ChevronDown,
  FileSpreadsheet,
  Users,
  TrendingUp,
  ListChecks,
  Sparkles,
  Images,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProyectoImagenes } from "@/components/(base)/imgs";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  formatMemoriaPeriodo,
  formatReporteRealizadoParts,
  formatReporteRealizadoText,
  formatInformeFechaLinea,
  formatUltimaActualizacionParts,
  formatoOrdinalCortoEs,
  sumBeneficiariosProyectos,
} from "./lib/helpers";
import type {
  BeneficiariosGrupo,
  ProyectoItem,
  ProyectosMemoria,
} from "./lib/zod";
import {
  downloadProyectoMemoriaExcel,
  type MemoriaProyectoExcelContext,
} from "./lib/memoria-excel";

function totalBeneficiariosCount(proyectos: ProyectoItem[]): number {
  const b = sumBeneficiariosProyectos(proyectos);
  const sum = (g: BeneficiariosGrupo) =>
    (g?.hombres || 0) + (g?.mujeres || 0) + (g?.jovenes || 0);
  return sum(b.directos) + sum(b.indirectos);
}

const informeCardClass =
  "rounded-3xl border border-slate-200/70 bg-white dark:border-zinc-800 dark:bg-card";

const GRUPO_COLORS = {
  hombres: "#2563eb",
  mujeres: "#ec4899",
  jovenes: "#22c55e",
} as const;

const TIPO_COLORS = {
  directos: "#0ea5e9",
  indirectos: "#a855f7",
} as const;

type DonutDatum = { name: string; value: number; color: string };

function formatCantidadLeyenda(value: number): {
  display: string;
  title: string;
  textClass: string;
  badgeClass: string;
} {
  const title = value.toLocaleString("es-GT");
  if (value >= 1_000_000) {
    const millones = value / 1_000_000;
    const display = Number.isInteger(millones)
      ? `${millones.toLocaleString("es-GT")}M`
      : `${millones.toFixed(1).replace(".", ",")}M`;
    return {
      display,
      title,
      textClass: "text-[9px]",
      badgeClass: "h-9 min-w-9 px-1.5",
    };
  }
  if (value >= 10_000) {
    const miles = Math.round(value / 1_000);
    return {
      display: `${miles.toLocaleString("es-GT")}K`,
      title,
      textClass: "text-[9px]",
      badgeClass: "h-9 min-w-9 px-1.5",
    };
  }
  const len = title.length;
  if (len <= 3) {
    return {
      display: title,
      title,
      textClass: "text-[10px]",
      badgeClass: "h-9 w-9",
    };
  }
  if (len <= 5) {
    return {
      display: title,
      title,
      textClass: "text-[9px]",
      badgeClass: "h-9 min-w-9 px-1",
    };
  }
  return {
    display: title,
    title,
    textClass: "text-[8px]",
    badgeClass: "h-9 min-w-[2.75rem] px-1",
  };
}

const donutDetailEase = [0.4, 0, 0.2, 1] as const;
const donutFillDurationMs = 1400;
const donutFillBeginMs = 280;

function DonutChart({
  data,
  centerValue,
  centerLabel,
  size = 184,
  detailTotal,
  animateFill = true,
  activeIndex,
  onSegmentEnter,
  onSegmentLeave,
}: {
  data: DonutDatum[];
  centerValue: number;
  centerLabel: string;
  size?: number;
  detailTotal?: number;
  animateFill?: boolean;
  activeIndex?: number | null;
  onSegmentEnter?: (index: number) => void;
  onSegmentLeave?: () => void;
}) {
  const [internalActiveIndex, setInternalActiveIndex] = useState<number | null>(
    null,
  );
  const reduceMotion = useReducedMotion();
  const slices = data.filter((d) => d.value > 0);
  const sliceSum = slices.reduce((sum, item) => sum + item.value, 0);
  const totalForPct = detailTotal ?? sliceSum;
  const resolvedActiveIndex = activeIndex ?? internalActiveIndex;
  const active =
    resolvedActiveIndex != null ? slices[resolvedActiveIndex] : null;
  const activePct =
    active && totalForPct > 0
      ? Math.round((active.value / totalForPct) * 100)
      : 0;

  const handleEnter = (index: number) => {
    if (onSegmentEnter) onSegmentEnter(index);
    else setInternalActiveIndex(index);
  };

  const handleLeave = () => {
    if (onSegmentLeave) onSegmentLeave();
    else setInternalActiveIndex(null);
  };

  if (slices.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs font-semibold text-muted-foreground"
        style={{ height: size, width: size }}
      >
        Sin datos
      </div>
    );
  }
  return (
    <div className="relative shrink-0" style={{ height: size, width: size }}>
      {animateFill ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.32}
              outerRadius={size * 0.48}
              paddingAngle={slices.length > 1 ? 2 : 0}
              cornerRadius={6}
              dataKey="value"
              stroke="none"
              isAnimationActive={!reduceMotion}
              animationDuration={reduceMotion ? 0 : donutFillDurationMs}
              animationBegin={reduceMotion ? 0 : donutFillBeginMs}
              animationEasing="ease-out"
              onMouseEnter={(_, index) => handleEnter(index)}
              onMouseLeave={handleLeave}
            >
              {slices.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div
          aria-hidden
          className="mx-auto rounded-full border-[10px] border-slate-100 dark:border-zinc-800"
          style={{
            width: size * 0.96,
            height: size * 0.96,
            marginTop: size * 0.02,
          }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-2 text-center">
        <motion.div
          layout={!reduceMotion}
          transition={{
            layout: {
              duration: reduceMotion ? 0 : 0.3,
              ease: donutDetailEase,
            },
          }}
          className="flex w-full max-w-[92%] flex-col items-center"
        >
          <span className="text-3xl font-black leading-none text-foreground">
            {centerValue.toLocaleString("es-GT")}
          </span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            {centerLabel}
          </span>
          <AnimatePresence initial={false}>
            {active ? (
              <motion.div
                key={active.name}
                layout={!reduceMotion}
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, height: 0, marginTop: 0 }
                }
                animate={
                  reduceMotion
                    ? { opacity: 1 }
                    : { opacity: 1, height: "auto", marginTop: 8 }
                }
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, height: 0, marginTop: 0 }
                }
                transition={{
                  duration: reduceMotion ? 0.12 : 0.3,
                  ease: donutDetailEase,
                }}
                className="w-full overflow-hidden"
              >
                <p className="truncate text-[9px] font-semibold leading-tight text-muted-foreground">
                  {active.name}
                </p>
                <p className="mt-0.5 flex items-center justify-center gap-2 text-xs font-black tabular-nums">
                  <motion.span
                    key={`${active.name}-pct`}
                    initial={reduceMotion ? false : { opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.22,
                      delay: reduceMotion ? 0 : 0.04,
                      ease: donutDetailEase,
                    }}
                    style={{ color: active.color }}
                  >
                    {activePct}%
                  </motion.span>
                  <motion.span
                    key={`${active.name}-value`}
                    initial={reduceMotion ? false : { opacity: 0, x: 4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.22,
                      delay: reduceMotion ? 0 : 0.08,
                      ease: donutDetailEase,
                    }}
                    className="text-foreground"
                  >
                    {active.value.toLocaleString("es-GT")}
                  </motion.span>
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function DonutLeyenda({
  items,
  total,
  columns = 1,
  activeIndex = null,
  onItemSelect,
}: {
  items: DonutDatum[];
  total: number;
  columns?: 1 | 2;
  activeIndex?: number | null;
  onItemSelect?: (index: number) => void;
}) {
  const visibles = items.filter((i) => i.value > 0);
  if (visibles.length === 0) return null;
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2.5",
        columns === 2 && "sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2.5",
      )}
    >
      {visibles.map((item, index) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        const cantidad = formatCantidadLeyenda(item.value);
        const isActive = activeIndex === index;
        return (
          <button
            key={item.name}
            type="button"
            onClick={() => onItemSelect?.(index)}
            className={cn(
              "flex w-full items-center gap-3 rounded-full bg-slate-50 py-1.5 pl-1.5 pr-4 text-left transition-opacity dark:bg-zinc-800/60",
              onItemSelect && "cursor-pointer hover:opacity-90",
              isActive && "ring-2 ring-celeste-trifinio/40",
            )}
          >
            <span
              title={cantidad.title}
              className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-full font-black leading-none text-white tabular-nums",
                cantidad.textClass,
                cantidad.badgeClass,
              )}
              style={{ backgroundColor: item.color }}
            >
              {cantidad.display}
            </span>
            <span className="flex-1 text-sm font-semibold text-foreground">
              {item.name}
            </span>
            <span
              className="text-sm font-black tabular-nums"
              style={{ color: item.color }}
            >
              {pct}%
            </span>
          </button>
        );
      })}
    </div>
  );
}

const beneficiarioSubPanel =
  "rounded-2xl bg-white p-3 dark:bg-zinc-900/70 sm:p-5";

function DonutPanel({
  title,
  data,
  total,
  legendColumns = 1,
  size = 184,
  animateFill = true,
}: {
  title: string;
  data: DonutDatum[];
  total: number;
  legendColumns?: 1 | 2;
  size?: number;
  animateFill?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [pinnedFromLegend, setPinnedFromLegend] = useState(false);
  const visibles = data.filter((d) => d.value > 0);

  const handleLegendSelect = (index: number) => {
    if (activeIndex === index && pinnedFromLegend) {
      setActiveIndex(null);
      setPinnedFromLegend(false);
      return;
    }
    setActiveIndex(index);
    setPinnedFromLegend(true);
  };

  return (
    <div className={beneficiarioSubPanel}>
      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-10">
        <div className="flex flex-col items-center gap-2 lg:shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            {title}
          </p>
          <DonutChart
            data={data}
            centerValue={total}
            centerLabel="Total"
            size={size}
            detailTotal={total}
            animateFill={animateFill}
            activeIndex={activeIndex}
            onSegmentEnter={(index) => {
              setPinnedFromLegend(false);
              setActiveIndex(index);
            }}
            onSegmentLeave={() => {
              if (!pinnedFromLegend) setActiveIndex(null);
            }}
          />
        </div>
        <div className="w-full lg:flex-1">
          <DonutLeyenda
            items={visibles}
            total={total}
            columns={legendColumns}
            activeIndex={activeIndex}
            onItemSelect={handleLegendSelect}
          />
        </div>
      </div>
    </div>
  );
}

function DonutDesglosePanel({
  data,
  total,
  animateFill = true,
}: {
  data: DonutDatum[];
  total: number;
  animateFill?: boolean;
}) {
  const directos = data.filter(
    (d) =>
      d.name.toLowerCase().includes("direct") &&
      !d.name.toLowerCase().includes("indirect"),
  );
  const indirectos = data.filter((d) =>
    d.name.toLowerCase().includes("indirect"),
  );

  return (
    <div className={beneficiarioSubPanel}>
      <p className="mb-6 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Desglose completo
      </p>
      <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="w-full rounded-xl bg-sky-50/80 p-4 dark:bg-sky-950/20">
          <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
            Directos
          </p>
          <DonutLeyenda items={directos} total={total} />
        </div>
        <div className="flex justify-center">
          <DonutChart
            data={data}
            centerValue={total}
            centerLabel="Total"
            size={220}
            detailTotal={total}
            animateFill={animateFill}
          />
        </div>
        <div className="w-full rounded-xl bg-violet-50/80 p-4 dark:bg-violet-950/20">
          <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
            Indirectos
          </p>
          <DonutLeyenda items={indirectos} total={total} />
        </div>
      </div>
    </div>
  );
}

function AvanceProgreso({
  descripcion,
  logrado,
  meta,
}: {
  descripcion: string;
  logrado: number;
  meta: number;
}) {
  const pct = meta > 0 ? Math.min(100, Math.round((logrado / meta) * 100)) : 0;
  return (
    <div className="flex w-full flex-col items-center gap-3 rounded-2xl bg-white p-4 dark:bg-zinc-900/60 md:flex-row md:items-center md:gap-6 md:p-4 lg:gap-8">
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <div className="relative h-52 w-52 sm:h-56 sm:w-56 md:h-60 md:w-60 lg:h-64 lg:w-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: "Logrado", value: logrado, color: "#f59e0b" },
                  {
                    name: "Restante",
                    value: Math.max(0, meta - logrado),
                    color: "#fde68a",
                  },
                ]}
                cx="50%"
                cy="50%"
                innerRadius="34%"
                outerRadius="46%"
                startAngle={90}
                endAngle={-270}
                cornerRadius={8}
                dataKey="value"
                stroke="none"
              >
                <Cell fill="#f59e0b" />
                <Cell fill="#fde68a" className="dark:opacity-30" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-black leading-none tabular-nums text-amber-600 sm:text-2xl lg:text-3xl dark:text-amber-400">
              {pct}%
            </span>
          </div>
        </div>
        <p className="text-center text-sm font-bold text-amber-600 sm:text-base dark:text-amber-400">
          {logrado} de {meta} alcanzado
        </p>
      </div>
      <div className="flex w-full min-w-0 flex-1 items-center text-center md:text-left">
        <p className="text-base font-bold text-foreground break-words sm:text-lg">
          {descripcion.trim() || "Sin descripción"}
        </p>
      </div>
    </div>
  );
}

export function InformeMemoriaEncabezado({
  cargo,
  nombre,
  oficina,
  proyectos,
  periodo,
  createdAt,
  updatedAt,
  open,
  onToggle,
}: {
  cargo?: string | null;
  nombre?: string | null;
  oficina?: string | null;
  proyectos: ProyectoItem[];
  periodo?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  open?: boolean;
  onToggle?: () => void;
}) {
  const informe = {
    id: "",
    proyectos,
    periodo: periodo ?? "",
    imagenes: [],
    beneficiarios: sumBeneficiariosProyectos(proyectos),
    created_at: createdAt ?? "",
    created_by: null,
    updated_by: null,
    updated_at: updatedAt ?? null,
    nombre: nombre ?? null,
    cargo: cargo ?? null,
    oficina: oficina ?? null,
  } as ProyectosMemoria;
  const interactive = Boolean(onToggle);
  const reporteRealizado = formatReporteRealizadoParts(createdAt);
  const ultimaActualizacion = formatUltimaActualizacionParts(updatedAt);

  const content = (
    <>
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/5" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="w-full min-w-0 space-y-2 text-left sm:flex-1">
          <div className="flex items-start justify-between gap-2 sm:block">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur">
              <CalendarDays className="h-3 w-3" />
              {formatMemoriaPeriodo(informe)}
            </span>
            {interactive && (
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] sm:hidden",
                  open && "rotate-180",
                )}
              >
                <ChevronDown className="h-5 w-5" />
              </span>
            )}
          </div>
          {oficina?.trim() ? (
            <p className="w-full text-lg font-black leading-snug text-white break-words sm:text-2xl">
              {oficina}
            </p>
          ) : null}
          {nombre?.trim() ? (
            <p className="w-full text-sm font-semibold text-white/95 break-words sm:text-base">
              {nombre}
            </p>
          ) : null}
          {cargo?.trim() ? (
            <p className="w-full text-sm font-medium text-white/80 break-words">
              {cargo}
            </p>
          ) : null}
          {!oficina?.trim() && !nombre?.trim() && !cargo?.trim() ? (
            <h3 className="text-xl font-black tracking-tight text-white leading-snug sm:text-2xl">
              Informe sin oficina asignada
            </h3>
          ) : null}
        </div>
        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:shrink-0 sm:flex-col sm:items-end">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-azul-trifinio">
              <Users className="h-3.5 w-3.5 shrink-0" />
              {totalBeneficiariosCount(proyectos).toLocaleString("es-GT")}{" "}
              beneficiarios
            </span>
            <span className="text-xs font-semibold text-white/80">
              {proyectos.length} proyecto
              {proyectos.length !== 1 ? "s" : ""}
            </span>
          </div>
          {interactive && (
            <span
              className={cn(
                "hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] sm:flex",
                open && "rotate-180",
              )}
            >
              <ChevronDown className="h-5 w-5" />
            </span>
          )}
        </div>
      </div>
      {(reporteRealizado || ultimaActualizacion) && (
        <div className="relative mt-2 space-y-0.5 text-right text-[10px] font-medium text-white/75 sm:absolute sm:bottom-4 sm:right-6 sm:mt-0 sm:text-[11px]">
          {reporteRealizado && (
            <p>
              Realizado:{" "}
              <span className="font-bold text-white/90">
                {formatInformeFechaLinea(reporteRealizado)}
              </span>
            </p>
          )}
          {ultimaActualizacion &&
            (!reporteRealizado ||
              ultimaActualizacion.dia !== reporteRealizado.dia ||
              ultimaActualizacion.fecha !== reporteRealizado.fecha ||
              ultimaActualizacion.hora !== reporteRealizado.hora) && (
              <p>
                Última actualización:{" "}
                <span className="font-bold text-white/90">
                  {formatInformeFechaLinea(ultimaActualizacion)}
                </span>
              </p>
            )}
        </div>
      )}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="relative w-full overflow-hidden bg-gradient-to-r from-azul-trifinio to-celeste-trifinio px-3 pt-5 pb-3 text-left transition-opacity hover:opacity-95 sm:px-8 sm:pt-7 sm:pb-7 cursor-pointer"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-azul-trifinio to-celeste-trifinio px-3 pt-5 pb-3 sm:px-8 sm:pt-7 sm:pb-7">
      {content}
    </div>
  );
}

function InformeMemoriaCuerpo({
  proyectos,
  imagenes = [],
  footer,
  nombre,
  oficina,
  cargo,
  periodo,
  createdAt,
  chartsAnimate = true,
}: {
  proyectos: ProyectoItem[];
  imagenes?: string[][];
  footer?: React.ReactNode;
  nombre?: string | null;
  oficina?: string | null;
  cargo?: string | null;
  periodo?: string;
  createdAt?: string | null;
  chartsAnimate?: boolean;
}) {
  const periodoLabel = formatMemoriaPeriodo({
    id: "",
    periodo: periodo ?? "",
    proyectos,
    beneficiarios: sumBeneficiariosProyectos(proyectos),
    imagenes: [],
    created_at: createdAt ?? "",
    created_by: null,
    updated_by: null,
    updated_at: null,
    nombre: nombre ?? null,
    cargo: cargo ?? null,
    oficina: oficina ?? null,
  });

  const excelContext: MemoriaProyectoExcelContext = {
    nombre,
    oficina,
    cargo,
    periodoLabel,
    reporteRealizado: formatReporteRealizadoText(createdAt),
  };

  return (
    <div>
      <div className="space-y-6">
        {proyectos.map((proyecto, i) => (
          <ProyectoInformeDetalle
            key={`proyecto-${i}`}
            proyecto={proyecto}
            index={i}
            imagenes={imagenes[i] ?? []}
            excelContext={excelContext}
            chartsAnimate={chartsAnimate}
          />
        ))}
      </div>

      {footer ? (
        <div className="border-t border-slate-100 px-4 pb-4 pt-4 dark:border-zinc-800 sm:px-5 sm:pb-5">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

const accordionPanelTransition =
  "transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none";

export function InformeMemoriaVista({
  cargo,
  nombre,
  oficina,
  proyectos,
  imagenes = [],
  createdAt,
  updatedAt,
  footer,
  className,
  periodo,
  accordionOpen,
  onAccordionToggle,
}: {
  cargo?: string | null;
  nombre?: string | null;
  oficina?: string | null;
  proyectos: ProyectoItem[];
  imagenes?: string[][];
  createdAt?: string | null;
  updatedAt?: string | null;
  footer?: React.ReactNode;
  className?: string;
  periodo?: string;
  accordionOpen?: boolean;
  onAccordionToggle?: () => void;
}) {
  const isAccordion = onAccordionToggle !== undefined;
  const chartsAnimate = !isAccordion || Boolean(accordionOpen);
  const cuerpo = (
    <InformeMemoriaCuerpo
      proyectos={proyectos}
      imagenes={imagenes}
      footer={footer}
      nombre={nombre}
      oficina={oficina}
      cargo={cargo}
      periodo={periodo}
      createdAt={createdAt}
      chartsAnimate={chartsAnimate}
    />
  );

  return (
    <div className={cn(informeCardClass, "w-full overflow-hidden", className)}>
      <InformeMemoriaEncabezado
        cargo={cargo}
        nombre={nombre}
        oficina={oficina}
        proyectos={proyectos}
        periodo={periodo}
        createdAt={createdAt}
        updatedAt={updatedAt}
        open={accordionOpen}
        onToggle={onAccordionToggle}
      />

      {isAccordion ? (
        <div
          className={cn(
            "grid",
            accordionPanelTransition,
            accordionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="min-h-0 overflow-hidden">{cuerpo}</div>
        </div>
      ) : (
        cuerpo
      )}
    </div>
  );
}

function ProyectoInformeDetalle({
  proyecto,
  index,
  imagenes = [],
  excelContext,
  chartsAnimate = true,
}: {
  proyecto: ProyectoItem;
  index: number;
  imagenes?: string[];
  excelContext: MemoriaProyectoExcelContext;
  chartsAnimate?: boolean;
}) {
  const avances = proyecto.avances.filter(
    (a) => a.descripcion.trim() || a.logrado > 0 || a.meta > 0,
  );
  const resultados = proyecto.resultados.filter((r) => r.trim());
  const efectos = proyecto.efectos.filter((e) => e.trim());

  const { directos, indirectos } = proyecto.beneficiarios;
  const totalDirectos = directos.hombres + directos.mujeres + directos.jovenes;
  const totalIndirectos =
    indirectos.hombres + indirectos.mujeres + indirectos.jovenes;
  const totalBeneficiarios = totalDirectos + totalIndirectos;

  const grupoData = [
    {
      name: "Hombres",
      value: directos.hombres + indirectos.hombres,
      color: GRUPO_COLORS.hombres,
    },
    {
      name: "Mujeres",
      value: directos.mujeres + indirectos.mujeres,
      color: GRUPO_COLORS.mujeres,
    },
    {
      name: "Jóvenes",
      value: directos.jovenes + indirectos.jovenes,
      color: GRUPO_COLORS.jovenes,
    },
  ];
  const tipoData = [
    { name: "Directos", value: totalDirectos, color: TIPO_COLORS.directos },
    {
      name: "Indirectos",
      value: totalIndirectos,
      color: TIPO_COLORS.indirectos,
    },
  ];
  const desgloseData = [
    { name: "Hombres directos", value: directos.hombres, color: "#1d4ed8" },
    { name: "Mujeres directas", value: directos.mujeres, color: "#db2777" },
    { name: "Jóvenes directos", value: directos.jovenes, color: "#15803d" },
    { name: "Hombres indirectos", value: indirectos.hombres, color: "#60a5fa" },
    { name: "Mujeres indirectas", value: indirectos.mujeres, color: "#f9a8d4" },
    { name: "Jóvenes indirectos", value: indirectos.jovenes, color: "#86efac" },
  ];

  return (
    <article className="rounded-2xl border border-slate-200/70 bg-slate-50/40 dark:border-zinc-800 dark:bg-zinc-900/30">
      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-azul-trifinio text-sm font-black text-white">
              {formatoOrdinalCortoEs(index + 1)}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Proyecto
              </p>
              <h4 className="text-xl font-black tracking-tight text-foreground leading-tight sm:text-2xl">
                {proyecto.nombre.trim() || "Sin nombre"}
              </h4>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              downloadProyectoMemoriaExcel(proyecto, index, excelContext)
            }
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-emerald-100 px-3 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-200 cursor-pointer dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel
          </button>
        </div>

        {proyecto.descripcion.trim() && (
          <p className="mb-0 w-full text-sm leading-relaxed text-muted-foreground sm:text-base">
            {proyecto.descripcion}
          </p>
        )}
      </div>

      <div className="space-y-5">
        {avances.length > 0 && (
          <SeccionPanel
            title="Avances por proyecto"
            icon={<TrendingUp className="h-4 w-4" />}
            tone="amber"
          >
            <div className="flex w-full flex-col gap-3">
              {avances.map((a, j) => (
                <AvanceProgreso
                  key={j}
                  descripcion={a.descripcion}
                  logrado={a.logrado}
                  meta={a.meta}
                />
              ))}
            </div>
          </SeccionPanel>
        )}

        {totalBeneficiarios > 0 && (
          <SeccionPanel
            title="Beneficiarios alcanzados"
            icon={<Users className="h-4 w-4" />}
            tone="sky"
          >
            <div className="space-y-5">
              <DonutPanel
                title="Por grupo"
                data={grupoData}
                total={totalBeneficiarios}
                legendColumns={2}
                size={220}
                animateFill={chartsAnimate}
              />
              <DonutPanel
                title="Directos vs indirectos"
                data={tipoData}
                total={totalBeneficiarios}
                size={220}
                animateFill={chartsAnimate}
              />
              <DonutDesglosePanel
                data={desgloseData}
                total={totalBeneficiarios}
                animateFill={chartsAnimate}
              />
            </div>
          </SeccionPanel>
        )}

        {imagenes.length > 0 && (
          <SeccionPanel
            title="Imágenes del proyecto"
            icon={<Images className="h-4 w-4" />}
            tone="sky"
          >
            <ProyectoImagenes paths={imagenes} readOnly />
          </SeccionPanel>
        )}

        <div className="flex w-full flex-col gap-5">
          {resultados.length > 0 && (
            <SeccionPanel
              title="Principales resultados"
              icon={<ListChecks className="h-4 w-4" />}
              tone="violet"
            >
              <ul className="space-y-3 text-base font-bold leading-relaxed text-foreground sm:text-lg">
                {resultados.map((r, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="mt-0.5 flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-black text-white">
                      {formatoOrdinalCortoEs(j + 1)}
                    </span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </SeccionPanel>
          )}

          {efectos.length > 0 && (
            <SeccionPanel
              title="Efectos alcanzados"
              icon={<Sparkles className="h-4 w-4" />}
              tone="emerald"
            >
              <ul className="space-y-3 text-base font-bold leading-relaxed text-foreground sm:text-lg">
                {efectos.map((e, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="mt-0.5 flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black text-white">
                      {formatoOrdinalCortoEs(j + 1)}
                    </span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </SeccionPanel>
          )}
        </div>
      </div>
    </article>
  );
}

type SeccionTone = "amber" | "sky" | "violet" | "emerald";

const seccionToneStyles: Record<
  SeccionTone,
  { panel: string; iconWrap: string; title: string }
> = {
  amber: {
    panel:
      "border-2 border-amber-500 bg-amber-50/40 dark:border-amber-400 dark:bg-amber-950/15",
    iconWrap: "bg-amber-500 text-white",
    title: "text-amber-700 dark:text-amber-300",
  },
  sky: {
    panel: "border-2 border-celeste-trifinio bg-sky-50/40 dark:bg-sky-950/15",
    iconWrap: "bg-celeste-trifinio text-white",
    title: "text-sky-700 dark:text-sky-300",
  },
  violet: {
    panel:
      "border-2 border-violet-500 bg-violet-50/40 dark:border-violet-400 dark:bg-violet-950/15",
    iconWrap: "bg-violet-500 text-white",
    title: "text-violet-700 dark:text-violet-300",
  },
  emerald: {
    panel:
      "border-2 border-emerald-500 bg-emerald-50/40 dark:border-emerald-400 dark:bg-emerald-950/15",
    iconWrap: "bg-emerald-500 text-white",
    title: "text-emerald-700 dark:text-emerald-300",
  },
};

function SeccionPanel({
  title,
  icon,
  tone,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tone: SeccionTone;
  children: React.ReactNode;
}) {
  const styles = seccionToneStyles[tone];
  return (
    <section className={cn("rounded-2xl p-3 sm:p-4", styles.panel)}>
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            styles.iconWrap,
          )}
        >
          {icon}
        </span>
        <h5
          className={cn(
            "text-base font-black tracking-tight sm:text-lg",
            styles.title,
          )}
        >
          {title}
        </h5>
      </div>
      {children}
    </section>
  );
}

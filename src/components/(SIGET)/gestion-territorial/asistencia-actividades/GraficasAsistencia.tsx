"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import { cn } from "@/lib/utils";
import type { EdadGeneroBar, StatSegment } from "./lib/stats";

type DonutDatum = { name: string; value: number; color: string };

const COLOR_MASCULINO = "#2563eb";
const COLOR_FEMENINO = "#ec4899";

const donutDetailEase = [0.4, 0, 0.2, 1] as const;
const donutFillDurationMs = 1400;
const donutFillBeginMs = 280;

const panelClass =
  "rounded-3xl border border-slate-200/70 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-card";

const chartSectionTitleClass =
  "text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground sm:text-sm";

function useDonutColumnSize(
  containerRef: React.RefObject<HTMLDivElement | null>,
  min = 160,
  max = 420,
  scale = 1,
) {
  const [size, setSize] = useState(184);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const width = el.getBoundingClientRect().width;
      setSize(
        Math.min(max, Math.max(min, Math.floor(width * scale))),
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, min, max, scale]);

  return size;
}

function DonutChart({
  data,
  centerValue,
  centerLabel,
  size = 184,
  detailTotal,
  animateFill = true,
}: {
  data: DonutDatum[];
  centerValue: number;
  centerLabel: string;
  size?: number;
  detailTotal?: number;
  animateFill?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const slices = data
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const sliceSum = slices.reduce((sum, item) => sum + item.value, 0);
  const totalForPct = detailTotal ?? sliceSum;
  const active = activeIndex != null ? slices[activeIndex] : null;
  const activePct =
    active && totalForPct > 0
      ? Math.round((active.value / totalForPct) * 100)
      : 0;

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
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
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
          <span
            className={cn(
              "font-black leading-none text-foreground",
              size >= 260
                ? "text-5xl"
                : size >= 220
                  ? "text-4xl"
                  : size >= 168
                    ? "text-3xl"
                    : "text-2xl",
            )}
          >
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
  compact = false,
  mini = false,
}: {
  items: DonutDatum[];
  total: number;
  columns?: 1 | 2;
  compact?: boolean;
  mini?: boolean;
}) {
  const visibles = items
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value);
  if (visibles.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground sm:text-left">
        Sin datos
      </p>
    );
  }
  return (
    <div
      className={cn(
        mini
          ? "flex w-full flex-col items-center gap-1"
          : compact
            ? "flex w-full min-w-0 flex-col gap-2"
            : cn(
                "flex w-full flex-col gap-2.5",
                columns === 2 &&
                  "sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2.5",
              ),
      )}
    >
      {visibles.map((item) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <div
            key={item.name}
            className={cn(
              "flex items-center rounded-full bg-slate-50 dark:bg-zinc-800/60",
              mini
                ? "w-fit max-w-full gap-1 py-0.5 pl-0.5 pr-2"
                : compact
                  ? "w-full min-w-0 gap-2 py-1.5 pl-1.5 pr-3"
                  : "w-full gap-3 py-1.5 pl-1.5 pr-4",
            )}
          >
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full font-black leading-none text-white",
                mini
                  ? "h-5 w-5 text-[8px]"
                  : compact
                    ? "h-7 w-7 text-[9px]"
                    : "h-9 w-9 px-0.5 text-[10px]",
              )}
              style={{ backgroundColor: item.color }}
            >
              {item.value.toLocaleString("es-GT")}
            </span>
            <span
              className={cn(
                "font-semibold text-foreground",
                mini
                  ? "text-[10px]"
                  : compact
                    ? "text-xs"
                    : "min-w-0 flex-1 truncate text-sm",
              )}
            >
              {item.name}
            </span>
            <span
              className={cn(
                "shrink-0 font-black tabular-nums",
                mini ? "text-[10px]" : compact ? "text-xs" : "text-sm",
              )}
              style={{ color: item.color }}
            >
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SegmentosBarrasHorizontales({
  title,
  data,
}: {
  title: string;
  data: StatSegment[];
}) {
  const visibles = data.filter((d) => d.value > 0);
  const total = visibles.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="w-full">
      <p className={cn("mb-5 text-center", chartSectionTitleClass)}>
        {title}
      </p>
      {visibles.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin datos</p>
      ) : (
        <div className="space-y-4">
          {visibles.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-semibold text-foreground">
                    {item.name}
                  </span>
                  <span
                    className="shrink-0 tabular-nums text-sm font-black"
                    style={{ color: item.color }}
                  >
                    {item.value.toLocaleString("es-GT")} · {pct}%
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DonutPanel({
  title,
  data,
  legendColumns = 1,
  embedded = false,
  chartSize = 184,
  className,
}: {
  title?: string;
  data: StatSegment[];
  legendColumns?: 1 | 2;
  embedded?: boolean;
  chartSize?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const responsiveSize = useDonutColumnSize(
    chartRef,
    embedded ? 136 : 168,
    embedded ? 196 : 260,
    embedded ? 0.92 : 1,
  );
  const resolvedSize = embedded ? responsiveSize : chartSize;
  const donutData: DonutDatum[] = data
    .map((d) => ({
      name: d.name,
      value: d.value,
      color: d.color,
    }))
    .sort((a, b) => b.value - a.value);
  const total = donutData.reduce((acc, d) => acc + d.value, 0);

  return (
    <div
      ref={containerRef}
      className={cn(
        embedded ? "w-full" : cn(panelClass, "w-fit overflow-hidden"),
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full flex-col items-center",
          resolvedSize < 160 ? "gap-2" : "gap-3",
        )}
      >
        {title ? (
          <p className={cn("text-center", chartSectionTitleClass)}>{title}</p>
        ) : null}
        <div ref={chartRef} className="flex w-full justify-center">
          <DonutChart
            data={donutData}
            centerValue={total}
            centerLabel="Total"
            size={resolvedSize}
            detailTotal={total}
          />
        </div>
        <div className="flex w-full min-w-0 justify-center">
          <DonutLeyenda
            items={donutData}
            total={total}
            columns={legendColumns}
            compact={embedded}
            mini={embedded}
          />
        </div>
      </div>
    </div>
  );
}

function EdadGeneroBarrasHorizontales({
  data,
  compact = false,
  showTopBorder = true,
}: {
  data: EdadGeneroBar[];
  compact?: boolean;
  showTopBorder?: boolean;
}) {
  const totalHombres = data.reduce((acc, d) => acc + d.masculino, 0);
  const totalMujeres = data.reduce((acc, d) => acc + d.femenino, 0);
  const filas = [
    ...data,
    {
      rango: "Total",
      masculino: totalHombres,
      femenino: totalMujeres,
    },
  ];

  return (
    <div
      className={cn(
        "space-y-4",
        showTopBorder &&
          "mt-4 border-t border-slate-200/80 pt-5 dark:border-zinc-800",
        !showTopBorder && compact && "mt-0",
        !showTopBorder && !compact && "mt-6",
      )}
    >
      <div className="grid grid-cols-[minmax(2.5rem,1fr)_auto_minmax(2.5rem,1fr)] items-center gap-2 px-1 text-[10px] font-black uppercase tracking-widest">
        <span className="text-left" style={{ color: COLOR_MASCULINO }}>
          Hombres
        </span>
        <span className="text-center text-muted-foreground">Rango</span>
        <span className="text-right" style={{ color: COLOR_FEMENINO }}>
          Mujeres
        </span>
      </div>

      {filas.map((fila) => {
        const total = fila.masculino + fila.femenino;
        const pctH = total > 0 ? (fila.masculino / total) * 100 : 0;
        const pctM = total > 0 ? (fila.femenino / total) * 100 : 0;
        const esTotal = fila.rango === "Total";

        return (
          <div key={fila.rango} className="space-y-1.5">
            <div className="grid grid-cols-[minmax(2.5rem,1fr)_auto_minmax(2.5rem,1fr)] items-end gap-2 px-1">
              <span
                className={cn(
                  "text-left tabular-nums font-black",
                  esTotal ? "text-base" : "text-sm",
                )}
                style={{ color: COLOR_MASCULINO }}
              >
                {fila.masculino.toLocaleString("es-GT")}
              </span>
              <span
                className={cn(
                  "text-center font-bold uppercase tracking-wide text-foreground",
                  esTotal ? "text-xs" : "text-[11px]",
                )}
              >
                {fila.rango}
              </span>
              <span
                className={cn(
                  "text-right tabular-nums font-black",
                  esTotal ? "text-base" : "text-sm",
                )}
                style={{ color: COLOR_FEMENINO }}
              >
                {fila.femenino.toLocaleString("es-GT")}
              </span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
              <div
                className="h-full transition-[width] duration-500"
                style={{
                  width: `${pctH}%`,
                  backgroundColor: COLOR_MASCULINO,
                }}
              />
              <div
                className="h-full transition-[width] duration-500"
                style={{
                  width: `${pctM}%`,
                  backgroundColor: COLOR_FEMENINO,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function parseRangoLabel(value: string): { title: string; range: string } {
  const match = value.match(/^(.+?)\s*(\([^)]+\))$/);
  if (!match) return { title: value, range: "" };
  return { title: match[1].trim(), range: match[2] };
}

function EdadRangoTick({
  x,
  y,
  payload,
}: {
  x?: string | number;
  y?: string | number;
  payload?: { value?: string };
}) {
  const nx = typeof x === "number" ? x : Number(x ?? 0);
  const ny = typeof y === "number" ? y : Number(y ?? 0);
  const { title } = parseRangoLabel(payload?.value ?? "");

  return (
    <g transform={`translate(${nx},${ny})`}>
      <text
        x={0}
        y={0}
        dy={10}
        textAnchor="middle"
        className="fill-foreground text-[9px] font-bold"
      >
        {title.toUpperCase()}
      </text>
    </g>
  );
}

function BarEdadGeneroBarrasVerticales({
  data,
  compact = false,
  fillHeight = false,
}: {
  data: EdadGeneroBar[];
  compact?: boolean;
  fillHeight?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const chartData = data.length > 0 ? data : [];
  const hasAnyValue = chartData.some((d) => d.masculino > 0 || d.femenino > 0);
  const yMax = chartData.reduce(
    (max, row) => Math.max(max, row.masculino, row.femenino),
    0,
  );
  const yTop = Math.max(yMax + 1, 4);

  if (!hasAnyValue) {
    return (
      <p className="flex min-h-[200px] items-center justify-center text-center text-sm text-muted-foreground">
        Sin datos
      </p>
    );
  }

  return (
    <div className={cn(fillHeight && "flex h-full min-h-0 flex-col")}>
      <div
        className={cn(
          "w-full min-w-0 overflow-hidden",
          fillHeight
            ? "min-h-[200px] flex-1"
            : compact
              ? "h-[280px]"
              : "h-[240px] sm:h-[280px]",
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            barSize={compact ? 28 : undefined}
            margin={
              compact
                ? { top: 16, right: 8, left: 0, bottom: -4 }
                : { top: 22, right: 12, left: 4, bottom: 4 }
            }
            barGap={compact ? 2 : 6}
            barCategoryGap={compact ? "16%" : "22%"}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-slate-200 dark:stroke-zinc-700"
            />
            <XAxis
              dataKey="rango"
              axisLine={false}
              tickLine={false}
              interval={0}
              height={compact ? 28 : 30}
              tick={compact ? EdadRangoTick : { fontSize: 11, fontWeight: 700 }}
            />
            <YAxis
              allowDecimals={false}
              width={compact ? 22 : 32}
              domain={[0, yTop]}
              tick={{ fontSize: compact ? 9 : 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Bar
              dataKey="masculino"
              name="Hombres"
              fill={COLOR_MASCULINO}
              radius={[4, 4, 0, 0]}
              maxBarSize={compact ? 28 : 56}
              isAnimationActive={!reduceMotion}
            >
              <LabelList
                dataKey="masculino"
                position="top"
                offset={4}
                className="fill-foreground text-[10px] font-bold"
                formatter={(value) =>
                  typeof value === "number" && value > 0 ? String(value) : ""
                }
              />
            </Bar>
            <Bar
              dataKey="femenino"
              name="Mujeres"
              fill={COLOR_FEMENINO}
              radius={[4, 4, 0, 0]}
              maxBarSize={compact ? 28 : 56}
              isAnimationActive={!reduceMotion}
            >
              <LabelList
                dataKey="femenino"
                position="top"
                offset={4}
                className="fill-foreground text-[10px] font-bold"
                formatter={(value) =>
                  typeof value === "number" && value > 0 ? String(value) : ""
                }
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BarEdadGeneroContenido({
  data,
  compact = false,
}: {
  data: EdadGeneroBar[];
  compact?: boolean;
}) {
  const dataVisible = data.filter((d) => d.masculino > 0 || d.femenino > 0);
  const hasData = dataVisible.length > 0;

  return (
    <>
      <p className={cn("mb-1 text-center", chartSectionTitleClass)}>
        Segregación por edad y género
      </p>
      {!compact ? (
        <p className="mb-4 text-center text-xs text-muted-foreground">
          Jóvenes (18-30) · Adultos (31-60) · Mayores (61+)
        </p>
      ) : null}

      {!hasData ? (
        <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-muted-foreground">
          Sin datos
        </p>
      ) : (
        <>
          <BarEdadGeneroBarrasVerticales data={data} compact={compact} />
          <EdadGeneroBarrasHorizontales
            data={dataVisible}
            compact={compact}
          />
        </>
      )}
    </>
  );
}

export function BarEdadGeneroPanel({ data }: { data: EdadGeneroBar[] }) {
  return (
    <div className={cn(panelClass, "flex h-full w-full flex-col overflow-hidden")}>
      <BarEdadGeneroContenido data={data} />
    </div>
  );
}

export function GraficasAsistencia({
  porGenero,
  porInstitucion,
  edadPorGenero,
  className,
}: {
  porGenero: StatSegment[];
  porInstitucion: StatSegment[];
  edadPorGenero: EdadGeneroBar[];
  className?: string;
}) {
  const dataVisible = edadPorGenero.filter(
    (d) => d.masculino > 0 || d.femenino > 0,
  );
  const hasRangoData = dataVisible.length > 0;
  const rangosCompletos = edadPorGenero.length > 0 ? edadPorGenero : dataVisible;

  return (
    <div
      className={cn(
        panelClass,
        "w-full",
        className,
      )}
    >
      <p className={cn("mb-4 text-center", chartSectionTitleClass)}>
        Segregación por edad y género
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[3fr_1fr] sm:items-start">
        <div className="min-h-[280px] min-w-0">
          <BarEdadGeneroBarrasVerticales data={edadPorGenero} compact />
        </div>
        <div className="flex min-w-0 flex-col items-center overflow-hidden sm:pt-1">
          <DonutPanel data={porGenero} embedded className="w-full" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 border-t border-slate-200/80 pt-5 dark:border-zinc-800 sm:grid-cols-[3fr_1fr] sm:items-start">
        {hasRangoData ? (
          <EdadGeneroBarrasHorizontales
            data={rangosCompletos}
            compact
            showTopBorder={false}
          />
        ) : null}
        <SegmentosBarrasHorizontales title="Instituciones" data={porInstitucion} />
      </div>
    </div>
  );
}

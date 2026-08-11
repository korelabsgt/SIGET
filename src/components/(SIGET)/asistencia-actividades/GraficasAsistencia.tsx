"use client";

import { useState } from "react";
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
  const slices = data.filter((d) => d.value > 0);
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
}: {
  items: DonutDatum[];
  total: number;
  columns?: 1 | 2;
}) {
  const visibles = items.filter((i) => i.value > 0);
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
        "flex w-full flex-col gap-2.5",
        columns === 2 && "sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2.5",
      )}
    >
      {visibles.map((item) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <div
            key={item.name}
            className="flex items-center gap-3 rounded-full bg-slate-50 py-1.5 pl-1.5 pr-4 dark:bg-zinc-800/60"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full px-0.5 text-[10px] font-black leading-none text-white"
              style={{ backgroundColor: item.color }}
            >
              {item.value.toLocaleString("es-GT")}
            </span>
            <span className="flex-1 truncate text-sm font-semibold text-foreground">
              {item.name}
            </span>
            <span
              className="text-sm font-black tabular-nums"
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

function DonutPanel({
  title,
  data,
  legendColumns = 1,
}: {
  title: string;
  data: StatSegment[];
  legendColumns?: 1 | 2;
}) {
  const donutData: DonutDatum[] = data.map((d) => ({
    name: d.name,
    value: d.value,
    color: d.color,
  }));
  const total = donutData.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className={panelClass}>
      <div className="flex flex-col items-center gap-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          {title}
        </p>
        <DonutChart
          data={donutData}
          centerValue={total}
          centerLabel="Total"
          size={184}
          detailTotal={total}
        />
        <div className="w-full max-w-sm">
          <DonutLeyenda items={donutData} total={total} columns={legendColumns} />
        </div>
      </div>
    </div>
  );
}

function EdadGeneroBarrasHorizontales({ data }: { data: EdadGeneroBar[] }) {
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
    <div className="mt-6 space-y-4 border-t border-slate-200/80 pt-5 dark:border-zinc-800">
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

export function BarEdadGeneroPanel({ data }: { data: EdadGeneroBar[] }) {
  const reduceMotion = useReducedMotion();
  const dataVisible = data.filter((d) => d.masculino > 0 || d.femenino > 0);
  const hasData = dataVisible.length > 0;

  return (
    <div className={cn(panelClass, "flex h-full flex-col")}>
      <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Segregación por edad y género
      </p>
      <p className="mb-4 text-center text-xs text-muted-foreground">
        Jóvenes (18-30) · Adultos (31-60) · Mayores (61+)
      </p>

      {!hasData ? (
        <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-muted-foreground">
          Sin datos
        </p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap justify-center gap-4">
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: COLOR_MASCULINO }}
              />
              Hombres
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: COLOR_FEMENINO }}
              />
              Mujeres
            </span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={dataVisible}
                margin={{ top: 22, right: 12, left: 0, bottom: 4 }}
                barGap={6}
                barCategoryGap="22%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-slate-200 dark:stroke-zinc-700"
                />
                <XAxis
                  dataKey="rango"
                  tick={{ fontSize: 11, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar
                  dataKey="masculino"
                  name="Hombres"
                  fill={COLOR_MASCULINO}
                  radius={[8, 8, 0, 0]}
                  maxBarSize={56}
                  isAnimationActive={!reduceMotion}
                >
                  <LabelList
                    dataKey="masculino"
                    position="top"
                    className="fill-foreground text-[11px] font-bold"
                    formatter={(value) =>
                      typeof value === "number" && value > 0 ? String(value) : ""
                    }
                  />
                </Bar>
                <Bar
                  dataKey="femenino"
                  name="Mujeres"
                  fill={COLOR_FEMENINO}
                  radius={[8, 8, 0, 0]}
                  maxBarSize={56}
                  isAnimationActive={!reduceMotion}
                >
                  <LabelList
                    dataKey="femenino"
                    position="top"
                    className="fill-foreground text-[11px] font-bold"
                    formatter={(value) =>
                      typeof value === "number" && value > 0 ? String(value) : ""
                    }
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <EdadGeneroBarrasHorizontales data={dataVisible} />
        </>
      )}
    </div>
  );
}

export function GraficasAsistencia({
  porGenero,
  porTrifinio,
}: {
  porGenero: StatSegment[];
  porTrifinio: StatSegment[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DonutPanel title="Por género" data={porGenero} />
      <DonutPanel title="Trifinio" data={porTrifinio} />
    </div>
  );
}

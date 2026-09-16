"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { modalFieldClass } from "@/components/ui/general-modal";
import { CRITICIDAD_META, JA_PALETA, type Criticidad } from "./catalogos";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { JaMapGaleriaSlider } from "../JaMapGaleriaSlider";

export function JaMesInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex h-10 items-center gap-2 rounded-lg bg-white px-3 text-[12px] font-medium text-zinc-500 dark:bg-zinc-900",
        modalFieldClass,
      )}
    >
      {label}
      <input
        id={id}
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 min-w-36 cursor-pointer border-0 bg-transparent px-0 text-sm font-semibold text-zinc-900 outline-none dark:text-zinc-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
      />
    </label>
  );
}

export function JaSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "flex h-10 w-full rounded-lg bg-white px-3 py-2 text-sm text-foreground outline-none dark:bg-zinc-900",
        modalFieldClass,
        className,
      )}
    >
      {children}
    </select>
  );
}

export function JaPestanas<T extends string>({
  value,
  onChange,
  items,
  layoutId = "ja-pestanas",
}: {
  value: T;
  onChange: (value: T) => void;
  items: Array<{ id: T; label: string; count?: number; bgClass?: string; textClass?: string }>;
  layoutId?: string;
}) {
  return (
    <div className="inline-flex h-10 max-w-full items-center overflow-x-auto rounded-full bg-white p-1 dark:bg-zinc-900">
      {items.map((item) => {
        const activa = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className="relative h-8 shrink-0 cursor-pointer rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap"
          >
            {activa ? (
              <motion.span
                layoutId={layoutId}
                className={cn(
                  "absolute inset-0 rounded-full",
                  item.bgClass ?? "bg-zinc-200 dark:bg-zinc-700",
                )}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 inline-flex items-center gap-1.5",
                activa
                  ? (item.textClass ?? "text-zinc-800 dark:text-zinc-200")
                  : "text-zinc-900 dark:text-zinc-100",
              )}
            >
              {item.label}
              {typeof item.count === "number" ? (
                <span className="tabular-nums">{item.count}</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SemaforoBadge({ criticidad }: { criticidad: Criticidad }) {
  const meta = CRITICIDAD_META[criticidad];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ring-1",
        meta.bg,
        meta.color,
        meta.ring,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          criticidad === "alerta_verde" && "bg-emerald-500",
          criticidad === "alerta_amarilla" && "bg-amber-400",
          criticidad === "latente" && "bg-orange-500",
          criticidad === "manifiesto" && "bg-red-500",
        )}
      />
      {meta.label}
    </span>
  );
}

const TONO = {
  cobalt: {
    mark: "bg-[#3B9EFF]",
    ink: "#3B9EFF",
    text: "text-sky-600 dark:text-sky-300",
  },
  jade: {
    mark: "bg-[#2DD4A8]",
    ink: "#2DD4A8",
    text: "text-emerald-600 dark:text-emerald-300",
  },
  gold: {
    mark: "bg-[#F5B942]",
    ink: "#F5B942",
    text: "text-amber-600 dark:text-amber-300",
  },
} as const;

export function JaKpiStrip({
  items,
}: {
  items: Array<{
    label: string;
    value: string;
    hint?: string;
  }>;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] bg-white dark:bg-zinc-900">
      <div className="flex flex-col sm:flex-row sm:flex-wrap">
        {items.map((item) => (
          <div
            key={item.label}
            className="min-w-40 flex-1 border-b border-zinc-100 px-7 py-7 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0 dark:border-zinc-800"
          >
            <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">{item.label}</p>
            <p className="mt-3 text-[40px] leading-none font-semibold tracking-tight text-zinc-900 dark:text-white">
              {item.value}
            </p>
            {item.hint ? (
              <p className="mt-2.5 text-[13px] leading-snug text-zinc-400 dark:text-zinc-500">{item.hint}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function JaKpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: keyof typeof TONO;
}) {
  return <JaKpiStrip items={[{ label, value, hint }]} />;
}

export function JaPanel({
  title,
  children,
  className,
  action,
  flush = false,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <section
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[28px] bg-white dark:bg-zinc-900",
        className,
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 px-6 pt-6 pb-1">
        <h3 className="text-[17px] font-semibold tracking-tight text-zinc-900 dark:text-white">
          {title}
        </h3>
        {action}
      </header>
      <div className={flush ? "pt-2" : "flex min-h-0 flex-1 flex-col px-6 pt-2 pb-6"}>{children}</div>
    </section>
  );
}

export type JaSlice = { name: string; value: number; color: string };

function etiquetasEnRodaja(data: JaSlice[]) {
  const total = data.reduce((acc, row) => acc + row.value, 0);
  if (total <= 0) return [];
  let acumulado = 0;
  return data.map((row) => {
    const inicio = acumulado / total;
    acumulado += row.value;
    const medio = (inicio + acumulado / total) / 2;
    const theta = medio * 2 * Math.PI;
    return {
      name: row.name,
      value: row.value,
      x: 50 + 34 * Math.cos(theta),
      y: 50 - 34 * Math.sin(theta),
    };
  });
}

export function JaDonut({
  title,
  data,
  centro,
  altura = "min-h-72 flex-1",
}: {
  title: string;
  data: JaSlice[];
  centro?: string;
  altura?: string;
}) {
  const [activo, setActivo] = useState<JaSlice | null>(null);
  const total = data.reduce((acc, row) => acc + row.value, 0);
  const visible = data.filter((row) => row.value > 0);
  const etiquetas = etiquetasEnRodaja(visible);
  const mostrado = activo ?? { name: centro ?? "Total", value: total, color: JA_PALETA.sky };

  return (
    <JaPanel title={title}>
      {visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">Sin datos para este filtro.</p>
      ) : (
        <div className={cn("relative", altura)}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={visible}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="54%"
                outerRadius="82%"
                startAngle={0}
                endAngle={360}
                paddingAngle={visible.length > 1 ? 3 : 0}
                cornerRadius={8}
                stroke="none"
                label={false}
                labelLine={false}
                isAnimationActive={false}
                onMouseEnter={(_, index) => setActivo(visible[index] ?? null)}
                onMouseLeave={() => setActivo(null)}
              >
                {visible.map((row) => (
                  <Cell
                    key={row.name}
                    fill={row.color}
                    fillOpacity={activo && activo.name !== row.name ? 0.45 : 1}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            {etiquetas.map((item) => (
              <text
                key={item.name}
                x={item.x}
                y={item.y}
                fill="#ffffff"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="5.4"
                fontWeight={800}
                style={{ paintOrder: "stroke" }}
                stroke="rgba(0,0,0,0.28)"
                strokeWidth="0.45"
              >
                {item.value}
              </text>
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={mostrado.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="flex w-[4.75rem] flex-col items-center text-center"
              >
                <p
                  className="font-mono text-3xl leading-none font-black tabular-nums"
                  style={{ color: activo?.color ?? JA_PALETA.sky }}
                >
                  {mostrado.value}
                </p>
                <p className="mt-1 text-[10px] leading-tight font-bold text-zinc-500">
                  {mostrado.name}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
      {visible.length > 0 ? (
        <ul className="mt-2 grid shrink-0 gap-1.5 sm:grid-cols-2">
          {visible.map((row) => (
            <li
              key={row.name}
              className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-300"
              onMouseEnter={() => setActivo(row)}
              onMouseLeave={() => setActivo(null)}
            >
              <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: row.color }} />
              <span className="min-w-0 truncate">{row.name}</span>
              <span className="ml-auto font-mono tabular-nums text-zinc-900 dark:text-white">
                {row.value}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </JaPanel>
  );
}

function EjeCategoria({
  x = 0,
  y = 0,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string | number };
}) {
  const texto = String(payload?.value ?? "");
  const partes = texto.split(" ");
  return (
    <text x={x} y={y} textAnchor="middle" fill="#71717a" fontSize={11} fontWeight={700}>
      {partes.length > 1 ? (
        <>
          <tspan x={x} dy="0.9em">
            {partes[0]}
          </tspan>
          <tspan x={x} dy="1.15em">
            {partes.slice(1).join(" ")}
          </tspan>
        </>
      ) : (
        <tspan x={x} dy="0.9em">
          {texto}
        </tspan>
      )}
    </text>
  );
}

export function JaBarras({
  title,
  data,
  series,
  altura = "min-h-80 flex-1",
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  series: { key: string; color: string }[];
  altura?: string;
}) {
  return (
    <JaPanel title={title}>
      <div className={cn("min-h-0", altura)}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 22, right: 8, left: 0, bottom: 4 }}
            barCategoryGap="22%"
            barGap={series.length > 1 ? 4 : 0}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" vertical={false} className="dark:opacity-40" />
            <XAxis dataKey="name" tick={EjeCategoria} interval={0} height={42} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} axisLine={false} tickLine={false} />
            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                fill={s.color}
                radius={[999, 999, 999, 999]}
                maxBarSize={series.length > 1 ? 36 : 48}
              >
                <LabelList
                  dataKey={s.key}
                  position="top"
                  offset={6}
                  className="fill-zinc-800 text-[11px] font-black dark:fill-zinc-100"
                  formatter={(value) =>
                    typeof value === "number" && value > 0 ? String(value) : ""
                  }
                />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </JaPanel>
  );
}

export function JaTable({
  title,
  children,
  minWidthClass = "min-w-180",
  action,
}: {
  title?: string;
  children: React.ReactNode;
  minWidthClass?: string;
  action?: React.ReactNode;
}) {
  const tabla = (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-left text-sm", minWidthClass)}>{children}</table>
    </div>
  );

  if (!title) {
    return (
      <div className="overflow-hidden rounded-[28px] bg-white dark:bg-zinc-900">
        {tabla}
      </div>
    );
  }

  return (
    <JaPanel title={title} action={action} flush>
      {tabla}
    </JaPanel>
  );
}

export function JaTh({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-4 py-2.5 text-[11px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-400",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function JaTd({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <td className={cn("border-t border-zinc-100 px-4 py-3 dark:border-zinc-800", className)}>
      {children}
    </td>
  );
}

export function JaRecordCard({
  kicker,
  title,
  meta,
  fecha,
  tone = "cobalt",
  fotos,
  children,
}: {
  kicker: string;
  title: string;
  meta?: string;
  fecha?: string;
  tone?: keyof typeof TONO | string;
  fotos?: string[];
  children: React.ReactNode;
}) {
  void tone;
  return (
    <article className="flex h-full min-h-72 flex-col overflow-hidden rounded-[28px] bg-white dark:bg-zinc-900">
      {fotos && fotos.length > 0 ? (
        <div className="px-3 pt-3">
          <JaMapGaleriaSlider fotos={fotos} compact />
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate text-[12px] font-medium text-zinc-400 dark:text-zinc-500">
            {kicker}
          </p>
          {fecha ? (
            <p className="shrink-0 text-[12px] font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
              {fecha}
            </p>
          ) : null}
        </div>
        <h3 className="mt-1 line-clamp-2 min-h-11 text-[17px] font-semibold leading-snug tracking-tight text-zinc-900 dark:text-white">
          {title}
        </h3>
        {meta ? (
          <p className="mt-1 truncate text-[13px] text-zinc-500 dark:text-zinc-400">{meta}</p>
        ) : (
          <p className="mt-1 h-5" />
        )}
        <div className="mt-3 flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </article>
  );
}

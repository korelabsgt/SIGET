"use client";

import { useRef, useMemo, useState, useLayoutEffect, useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Save, AlertCircle, CheckCircle2, Calendar, Loader2, Plus, Trash2, BarChart3, Table2, Users, ChevronDown, Wand2, PieChart as PieChartIcon, Check, ArrowRight } from "lucide-react";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  useFormulario,
  SIN_ESPECIFICAR,
  indicadorOmiteNacPerfil,
} from "./lib/hooks";
import type { ObsIndicador, ObsOrganizacion, ObsPolitica, RegistroEntrada } from "./lib/zod";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { useOrgLogoDisplayUrl } from "@/components/(uploads)/imgs/useOrgLogoDisplayUrl";
import { ORG_LOGO_SURFACE_CLASS, ORG_LOGO_DARK_PLATE_CLASS } from "@/components/(uploads)/imgs/constants";
import { cn } from "@/lib/utils";

interface FormulariosProps {
  onBack: () => void;
  initialPolitica?: ObsPolitica | null;
  canChooseOrg?: boolean;
  userOrganizacionId?: string;
}

function PoliticaDescripcionAccordion({ codigo, descripcion }: { codigo: string; descripcion: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [heights, setHeights] = useState({ collapsed: 0, full: 0 });

  const text = `${codigo} — ${descripcion}`;
  const textClassName = "text-sm font-semibold text-purple-700 dark:text-purple-400 leading-relaxed";

  useLayoutEffect(() => {
    setIsExpanded(false);
  }, [codigo, descripcion]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const clampedEl = container.querySelector<HTMLElement>("[data-measure-clamped]");
      const fullEl = container.querySelector<HTMLElement>("[data-measure-full]");
      if (!clampedEl || !fullEl) return;

      const collapsed = clampedEl.getBoundingClientRect().height;
      const full = fullEl.getBoundingClientRect().height;
      setHeights({ collapsed, full });
      setIsTruncated(full > collapsed + 2);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [codigo, descripcion]);

  return (
    <div ref={containerRef} className="relative">
      {/* Elementos ocultos para medir alturas reales con el mismo ancho del contenedor */}
      <div
        aria-hidden
        className="pointer-events-none invisible absolute inset-x-0 top-0 -z-10 flex flex-col"
      >
        <p data-measure-clamped className={`${textClassName} line-clamp-1`}>
          {text}
        </p>
        <p data-measure-full className={textClassName}>
          {text}
        </p>
      </div>

      {!isTruncated ? (
        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
          <p className={textClassName}>{text}</p>
        </div>
      ) : (
        <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-100 dark:border-purple-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="w-full flex items-start gap-3 p-4 text-left cursor-pointer hover:bg-purple-100/60 dark:hover:bg-purple-900/40 transition-colors"
            aria-expanded={isExpanded}
          >
            <motion.div
              initial={false}
              animate={{ height: isExpanded ? heights.full : heights.collapsed }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="flex-1 min-w-0 overflow-hidden"
            >
              <p className={textClassName}>{text}</p>
            </motion.div>
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="shrink-0 mt-0.5 text-purple-600 dark:text-purple-400"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.span>
          </button>
        </div>
      )}
    </div>
  );
}

const purpleCardIdle =
  "bg-purple-50/40 dark:bg-purple-900/10 text-slate-600 dark:text-slate-300 border border-purple-200 dark:border-purple-800/70 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20";
const purpleCardSelected =
  "bg-purple-600 text-white border border-purple-600 shadow-md shadow-purple-500/20";

function FormOrgLogoOption({
  org,
  selected = false,
  onSelect,
  locked = false,
}: {
  org: Pick<ObsOrganizacion, "id" | "nombre" | "logo">;
  selected?: boolean;
  onSelect?: () => void;
  locked?: boolean;
}) {
  const { url } = useOrgLogoDisplayUrl(org.logo ?? null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [url]);

  const showLogo = Boolean(url) && !imgError;

  const nameClass =
    "font-bold text-azul-trifinio text-center leading-tight line-clamp-2 uppercase tracking-wide w-full px-1 text-[9px] md:text-[10px]";

  const logoAreaClass = cn(
    "flex w-full items-center justify-center transition-transform duration-300 ease-out group-hover:-translate-y-1 p-3 md:p-4",
    locked ? "h-[8rem] md:h-[10rem]" : "h-[6.5rem] md:h-[7.5rem]"
  );

  const imgClass = cn(
    "block w-auto h-auto max-w-full object-contain pointer-events-none",
    locked ? "max-h-[7rem] md:max-h-[9rem]" : "max-h-[5.5rem] md:max-h-[6.5rem]"
  );

  const nameOnlySlotClass = cn(
    "flex w-full items-center justify-center rounded-xl dark:bg-white dark:shadow-[0_2px_14px_rgba(0,0,0,0.35)]",
    locked ? "h-[8rem] md:h-[10rem]" : "h-[6.5rem] md:h-[7.5rem]"
  );

  const containerClass = cn(
    "group relative flex flex-col items-center shrink-0 w-full",
    locked && "max-w-md mx-auto"
  );

  const tileClass = cn(
    "rounded-xl transition-all w-full flex items-center justify-center border-0 bg-transparent shadow-none outline-none",
    locked
      ? "cursor-default"
      : cn(
          "cursor-pointer",
          selected
            ? "scale-[1.03] shadow-md dark:shadow-black/40"
            : "opacity-90 hover:opacity-100 hover:scale-[1.02]"
        )
  );

  const logoContent = showLogo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url!}
      alt={org.nombre}
      className={imgClass}
      onError={() => setImgError(true)}
    />
  ) : (
    <p className={cn(nameClass, "line-clamp-3")}>{org.nombre}</p>
  );

  const logoArea = (
    <div
      className={cn(
        logoAreaClass,
        ORG_LOGO_SURFACE_CLASS,
        ORG_LOGO_DARK_PLATE_CLASS,
        "overflow-hidden w-full"
      )}
    >
      {showLogo ? logoContent : <div className={nameOnlySlotClass}>{logoContent}</div>}
    </div>
  );

  const hoverName = showLogo ? (
    <p
      className={cn(
        nameClass,
        "min-h-7 pt-1.5 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out pointer-events-none"
      )}
    >
      {org.nombre}
    </p>
  ) : (
    <div className="min-h-7 pt-1.5" aria-hidden />
  );

  if (locked) {
    return (
      <div className={containerClass}>
        <div className={tileClass}>{logoArea}</div>
        {hoverName}
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <button type="button" onClick={onSelect} className={tileClass} aria-label={org.nombre}>
        {logoArea}
      </button>
      {hoverName}
    </div>
  );
}

type CrosstabRow = {
  nacionalidadId: string;
  perfilId: string;
  valores: Record<string, number>;
  registroCount: number;
};

function crossKey(nacionalidadId: string, perfilId: string) {
  return `${nacionalidadId}::${perfilId}`;
}

function filterRegistrosConNacPerfil(
  regs: RegistroEntrada[],
  indicadores: ObsIndicador[],
) {
  return regs.filter((r) => {
    const ind = indicadores.find((i) => i.id === r.indicadorId);
    return !indicadorOmiteNacPerfil(ind);
  });
}

function aggregateByNacPerfil(regs: RegistroEntrada[], campoIds: string[]): CrosstabRow[] {
  const map = new Map<string, CrosstabRow>();
  for (const r of regs) {
    const key = crossKey(r.nacionalidadId, r.perfilId);
    let row = map.get(key);
    if (!row) {
      row = {
        nacionalidadId: r.nacionalidadId,
        perfilId: r.perfilId,
        valores: Object.fromEntries(campoIds.map((id) => [id, 0])),
        registroCount: 0,
      };
      map.set(key, row);
    }
    row.registroCount += 1;
    for (const cid of campoIds) {
      row.valores[cid] = (row.valores[cid] || 0) + parseInt(r.valores[cid] || "0", 10);
    }
  }
  return Array.from(map.values());
}

const CHART_PALETTE = [
  "#9333ea", "#3b82f6", "#f59e0b", "#10b981", "#f43f5e", "#6366f1", "#14b8a6", "#ec4899",
];

const ALL_INDICADORES_ID = "__all_ind__";

function getRegistroFilteredValue(
  r: RegistroEntrada,
  indicadores: ObsIndicador[],
  selectedCatalogCampoIds: Set<string>
): number {
  if (selectedCatalogCampoIds.size === 0) return 0;
  const ind = indicadores.find((i) => i.id === r.indicadorId);
  let sum = 0;
  for (const ic of ind?.obs_indicador_campos || []) {
    const catalogId = ic.obs_campos?.id || ic.campo_id;
    if (!catalogId || !selectedCatalogCampoIds.has(catalogId)) continue;
    sum += parseInt(r.valores[ic.id] || "0", 10);
  }
  return sum;
}

function buildNacPerfilTotals(regs: RegistroEntrada[], getValue?: (r: RegistroEntrada) => number) {
  const valueOf =
    getValue ??
    ((r: RegistroEntrada) =>
      Object.values(r.valores).reduce((s, v) => s + parseInt(v || "0", 10), 0));
  const totals = new Map<string, number>();
  for (const r of regs) {
    const key = crossKey(r.nacionalidadId, r.perfilId);
    totals.set(key, (totals.get(key) || 0) + valueOf(r));
  }
  return totals;
}

function aggregateChartSlices(
  regs: RegistroEntrada[],
  indicadores: ObsIndicador[],
  selectedCatalogCampoIds: Set<string>,
  dimension: "nacionalidad" | "perfil" | "indicador",
  getLabel: (id: string) => string
) {
  const totals = new Map<string, number>();
  for (const r of regs) {
    const dimId = dimension === "indicador" ? r.indicadorId : dimension === "nacionalidad" ? r.nacionalidadId : r.perfilId;
    totals.set(dimId, (totals.get(dimId) || 0) + getRegistroFilteredValue(r, indicadores, selectedCatalogCampoIds));
  }
  return Array.from(totals.entries())
    .filter(([, v]) => v > 0)
    .map(([id, value], i) => ({
      id,
      name: getLabel(id),
      value,
      color: CHART_PALETTE[i % CHART_PALETTE.length],
    }))
    .sort((a, b) => b.value - a.value);
}

const tooltipStyle = {
  backgroundColor: "#ffffff",
  color: "#0f172a",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  fontWeight: "bold" as const,
  fontSize: "12px",
};

function formatChartNumber(value: number) {
  return new Intl.NumberFormat("es-GT").format(value);
}

const LEGEND_ACCORDION_MIN_LEN = 42;

const PROGRESS_BAR_COLORS = [
  "bg-blue-500", "bg-rose-500", "bg-emerald-500", "bg-purple-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
];

function totalsToDonutData(
  entries: Map<string, number>,
  getLabel: (id: string) => string,
  colorOffset = 0
) {
  return Array.from(entries.entries())
    .filter(([, value]) => value > 0)
    .map(([id, value], i) => ({
      name: getLabel(id),
      value,
      color: CHART_PALETTE[(colorOffset + i) % CHART_PALETTE.length],
    }))
    .sort((a, b) => b.value - a.value);
}

function ProgressBarList({
  items,
  maxValue,
}: {
  items: { id: string; label: string; sublabel?: string; value: number }[];
  maxValue?: number;
}) {
  const max = maxValue ?? Math.max(...items.map((i) => i.value), 1);
  if (items.length === 0) {
    return <p className="text-xs text-slate-400 font-semibold py-4 text-center">Sin datos</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const pct = (item.value / max) * 100;
        const color = PROGRESS_BAR_COLORS[idx % PROGRESS_BAR_COLORS.length];
        return (
          <div key={item.id} className="space-y-1.5">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block leading-snug">
                  {item.label}
                </span>
                {item.sublabel && (
                  <span className="text-[9px] font-semibold text-purple-600 dark:text-purple-400 block mt-0.5">
                    {item.sublabel}
                  </span>
                )}
              </div>
              <span className="text-xs font-black text-foreground shrink-0">
                {formatChartNumber(item.value)}
              </span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-accent rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: "easeOut", delay: idx * 0.05 }}
                className={`h-full ${color} rounded-full`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProgressBarChartCard({
  title,
  icon: Icon,
  iconClass,
  children,
  contentAutoHeight = false,
}: {
  title: string;
  icon: typeof BarChart3;
  iconClass: string;
  children: ReactNode;
  contentAutoHeight?: boolean;
}) {
  return (
    <div
      className={`bg-card dark:bg-background p-6 rounded-2xl border border-border space-y-4 ${
        contentAutoHeight ? "" : "h-full flex flex-col"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconClass}`} />
        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</h5>
      </div>
      <div className={contentAutoHeight ? "pr-1" : "flex-1 min-h-0 max-h-[280px] overflow-y-auto pr-1"}>{children}</div>
    </div>
  );
}

function buildCampoDimensionCross(
  registros: RegistroEntrada[],
  indicadores: ObsIndicador[],
  campos: { catalogId: string; nombre: string; orden: number }[],
  dimension: "nacionalidad" | "perfil" | "indicador"
) {
  const grid = new Map<string, Map<string, number>>();
  for (const c of campos) grid.set(c.catalogId, new Map());

  for (const r of registros) {
    const ind = indicadores.find((i) => i.id === r.indicadorId);
    const dimId =
      dimension === "nacionalidad" ? r.nacionalidadId : dimension === "perfil" ? r.perfilId : r.indicadorId;
    for (const ic of ind?.obs_indicador_campos || []) {
      const catalogId = ic.obs_campos?.id || ic.campo_id;
      if (!catalogId || !grid.has(catalogId)) continue;
      const row = grid.get(catalogId)!;
      row.set(dimId, (row.get(dimId) || 0) + parseInt(r.valores[ic.id] || "0", 10));
    }
  }

  const colIds = [
    ...new Set(
      Array.from(grid.values()).flatMap((row) => [...row.keys()])
    ),
  ];

  return { campos, colIds, grid };
}

function CampoDimensionMatrix({
  title,
  cornerLabel,
  campos,
  colIds,
  grid,
  getColLabel,
  accentClass = "text-purple-600 dark:text-purple-400",
}: {
  title: string;
  cornerLabel: string;
  campos: { catalogId: string; nombre: string }[];
  colIds: string[];
  grid: Map<string, Map<string, number>>;
  getColLabel: (id: string) => string;
  accentClass?: string;
}) {
  const { maxCell, grandTotal } = useMemo(() => {
    let maxCell = 1;
    let grandTotal = 0;
    for (const row of grid.values()) {
      for (const val of row.values()) {
        maxCell = Math.max(maxCell, val);
        grandTotal += val;
      }
    }
    return { maxCell, grandTotal };
  }, [grid]);

  if (campos.length === 0 || colIds.length === 0) return null;

  return (
    <div className="bg-card dark:bg-background rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800/50">
        <Table2 className="w-4 h-4 text-purple-500" />
        <h5 className={`text-xs font-black uppercase tracking-widest ${accentClass}`}>{title}</h5>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider sticky left-0 bg-card dark:bg-background min-w-28">
                {cornerLabel}
              </th>
              {colIds.map((colId) => (
                <th
                  key={colId}
                  title={getColLabel(colId)}
                  className="px-3 py-3 text-center text-[10px] font-black text-purple-500 uppercase tracking-wider min-w-20 max-w-32 truncate"
                >
                  {getColLabel(colId)}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-[10px] font-black text-purple-500 uppercase tracking-wider">Σ</th>
            </tr>
          </thead>
          <tbody>
            {campos.map((campo, rIdx) => {
              const rowMap = grid.get(campo.catalogId) || new Map();
              let rowSum = 0;
              return (
                <tr
                  key={campo.catalogId}
                  className={`border-b border-slate-50 dark:border-border/50 ${
                    rIdx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/50 dark:bg-secondary/30"
                  }`}
                >
                  <td className="px-4 py-2.5 font-semibold text-purple-600 dark:text-purple-400 sticky left-0 bg-inherit whitespace-nowrap">
                    {campo.nombre}
                  </td>
                  {colIds.map((colId) => {
                    const val = rowMap.get(colId) || 0;
                    rowSum += val;
                    const intensity = val > 0 ? Math.max(0.12, val / maxCell) : 0;
                    return (
                      <td
                        key={colId}
                        className="px-3 py-2.5 text-center font-mono font-bold text-foreground"
                        style={val > 0 ? { backgroundColor: `rgba(147, 51, 234, ${intensity * 0.35})` } : undefined}
                      >
                        {val > 0 ? val : "—"}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-right font-black text-purple-600">{rowSum}</td>
                </tr>
              );
            })}
            <tr className="bg-purple-50/50 dark:bg-purple-900/10 border-t-2 border-purple-200 dark:border-purple-800">
              <td className="px-4 py-3 font-black text-xs text-slate-500 uppercase tracking-wider sticky left-0 bg-inherit">Σ</td>
              {colIds.map((colId) => {
                const colSum = campos.reduce((s, c) => s + (grid.get(c.catalogId)?.get(colId) || 0), 0);
                return (
                  <td key={colId} className="px-3 py-3 text-center font-black text-foreground">
                    {colSum}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-right font-black text-purple-700 dark:text-purple-400">{grandTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChartLegendRow({
  item,
  total,
  index,
  expanded,
  onToggle,
  useAccordion,
}: {
  item: { name: string; value: number; color: string };
  total: number;
  index: number;
  expanded: boolean;
  onToggle: (index: number) => void;
  useAccordion: boolean;
}) {
  const pct = total > 0 ? `${((item.value / total) * 100).toFixed(0)}%` : "0%";

  if (!useAccordion) {
    return (
      <div className="flex items-start justify-between gap-2 text-[10px]">
        <div className="flex items-start gap-1.5 min-w-0 flex-1">
          <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: item.color }} />
          <span className="font-semibold text-slate-600 dark:text-slate-400 leading-snug">{item.name}</span>
        </div>
        <span className="font-black text-foreground font-mono shrink-0">{pct}</span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border transition-colors ${
        expanded ? "border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-900/20" : "border-transparent"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(index)}
        className="w-full flex items-start gap-1.5 p-1.5 text-left cursor-pointer"
        aria-expanded={expanded}
      >
        <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: item.color }} />
        <div className="flex-1 min-w-0">
          <p
            className={`text-[10px] font-semibold text-slate-600 dark:text-slate-400 leading-snug ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            {item.name}
          </p>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform mt-0.5 ${expanded ? "rotate-180" : ""}`}
        />
        <span className="font-black text-foreground font-mono shrink-0 text-[10px]">{pct}</span>
      </button>
    </div>
  );
}

function DonutChartCard({
  title,
  icon: Icon,
  iconClass,
  data,
  chartKey,
  legendAccordion = false,
  compact = false,
}: {
  title: string;
  icon: typeof PieChartIcon;
  iconClass: string;
  data: { name: string; value: number; color: string }[];
  chartKey: string;
  legendAccordion?: boolean;
  compact?: boolean;
}) {
  const [expandedLegendIndex, setExpandedLegendIndex] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);

  useEffect(() => {
    setExpandedLegendIndex(null);
  }, [chartKey]);

  const handleLegendToggle = (index: number) => {
    setExpandedLegendIndex((prev) => (prev === index ? null : index));
  };

  if (data.length === 0) {
    return (
      <div className="bg-card dark:bg-background p-6 rounded-2xl border border-border flex items-center justify-center min-h-[180px]">
        <p className="text-xs text-slate-400 font-semibold">Sin datos para este filtro</p>
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-border bg-slate-50/50 dark:bg-secondary/30 p-3 space-y-2 h-full flex flex-col"
          : "bg-card dark:bg-background p-4 rounded-2xl border border-border space-y-3"
      }
    >
      <div className="flex items-center gap-2">
        {compact ? (
          <p className={`text-[10px] font-black uppercase tracking-widest ${iconClass}`}>{title}</p>
        ) : (
          <>
            <Icon className={`w-4 h-4 ${iconClass}`} />
            <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</h5>
          </>
        )}
        <span className="text-xs font-black text-purple-600 dark:text-purple-400 ml-auto font-mono">{formatChartNumber(total)}</span>
      </div>

      <div className={`flex gap-2 items-center flex-1 min-h-0 ${compact ? "min-h-[150px]" : "min-h-[140px]"}`}>
        <div className={`shrink-0 ${compact ? "w-[88px] h-[88px]" : "w-[120px] h-[120px]"}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={chartKey}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={compact ? 28 : 38}
                    outerRadius={compact ? 42 : 56}
                    paddingAngle={data.length > 1 ? 3 : 0}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatChartNumber(Number(value))}
                    contentStyle={tooltipStyle}
                    itemStyle={{ color: "#0f172a" }}
                    labelStyle={{ color: "#0f172a" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5 max-h-[200px] overflow-y-auto pr-0.5">
          {data.map((item, idx) => (
            <ChartLegendRow
              key={`${item.name}-${idx}`}
              item={item}
              total={total}
              index={idx}
              expanded={expandedLegendIndex === idx}
              onToggle={handleLegendToggle}
              useAccordion={legendAccordion || item.name.length > LEGEND_ACCORDION_MIN_LEN}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function GlobalCrossSection({
  registros,
  indicadores,
  globalCrossStats,
  getNacionalidadNombre,
  getPerfilNombre,
  getIndicadorNombre,
}: {
  registros: RegistroEntrada[];
  indicadores: ObsIndicador[];
  globalCrossStats: { comboCount: number; mergedCount: number };
  getNacionalidadNombre: (id: string) => string;
  getPerfilNombre: (id: string) => string;
  getIndicadorNombre: (id: string) => string;
}) {
  const [selectedIndicadorId, setSelectedIndicadorId] = useState(ALL_INDICADORES_ID);
  const [selectedCatalogCampoIds, setSelectedCatalogCampoIds] = useState<Set<string>>(new Set());

  const indicadoresEnUso = useMemo(() => {
    const ids = [...new Set(registros.map((r) => r.indicadorId))];
    return ids
      .map((id) => indicadores.find((i) => i.id === id))
      .filter((i): i is NonNullable<typeof i> => !!i);
  }, [registros, indicadores]);

  const registrosFiltrados = useMemo(
    () =>
      selectedIndicadorId === ALL_INDICADORES_ID
        ? registros
        : registros.filter((r) => r.indicadorId === selectedIndicadorId),
    [registros, selectedIndicadorId]
  );

  const availableCampos = useMemo(() => {
    const byCatalog = new Map<string, { catalogId: string; nombre: string; orden: number }>();
    for (const r of registrosFiltrados) {
      const ind = indicadores.find((i) => i.id === r.indicadorId);
      for (const ic of ind?.obs_indicador_campos || []) {
        const catalogId = ic.obs_campos?.id || ic.campo_id;
        if (!catalogId || byCatalog.has(catalogId)) continue;
        byCatalog.set(catalogId, {
          catalogId,
          nombre: ic.obs_campos?.nombre || "Campo",
          orden: parseInt(ic.orden || "0", 10),
        });
      }
    }
    return Array.from(byCatalog.values()).sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));
  }, [registrosFiltrados, indicadores]);

  useEffect(() => {
    setSelectedCatalogCampoIds(new Set(availableCampos.map((c) => c.catalogId)));
  }, [availableCampos]);

  const filterKey = useMemo(
    () => `${selectedIndicadorId}:${[...selectedCatalogCampoIds].sort().join(",")}`,
    [selectedIndicadorId, selectedCatalogCampoIds]
  );

  const toggleCampo = (catalogId: string) => {
    setSelectedCatalogCampoIds((prev) => {
      const next = new Set(prev);
      if (next.has(catalogId)) next.delete(catalogId);
      else next.add(catalogId);
      return next;
    });
  };

  const selectAllCampos = () => setSelectedCatalogCampoIds(new Set(availableCampos.map((c) => c.catalogId)));
  const clearAllCampos = () => setSelectedCatalogCampoIds(new Set());

  const getValue = useMemo(
    () => (r: RegistroEntrada) => getRegistroFilteredValue(r, indicadores, selectedCatalogCampoIds),
    [indicadores, selectedCatalogCampoIds]
  );

  const registrosNacPerfil = useMemo(
    () => filterRegistrosConNacPerfil(registrosFiltrados, indicadores),
    [registrosFiltrados, indicadores],
  );
  const showNacPerfilCharts = registrosNacPerfil.length > 0;

  const nacData = useMemo(
    () =>
      showNacPerfilCharts
        ? aggregateChartSlices(
            registrosNacPerfil,
            indicadores,
            selectedCatalogCampoIds,
            "nacionalidad",
            getNacionalidadNombre,
          )
        : [],
    [showNacPerfilCharts, registrosNacPerfil, indicadores, selectedCatalogCampoIds, getNacionalidadNombre],
  );
  const perfilData = useMemo(
    () =>
      showNacPerfilCharts
        ? aggregateChartSlices(
            registrosNacPerfil,
            indicadores,
            selectedCatalogCampoIds,
            "perfil",
            getPerfilNombre,
          )
        : [],
    [showNacPerfilCharts, registrosNacPerfil, indicadores, selectedCatalogCampoIds, getPerfilNombre],
  );
  const indicadorData = useMemo(
    () => aggregateChartSlices(registrosFiltrados, indicadores, selectedCatalogCampoIds, "indicador", getIndicadorNombre),
    [registrosFiltrados, indicadores, selectedCatalogCampoIds, getIndicadorNombre]
  );

  const comboProgressItems = useMemo(() => {
    if (!showNacPerfilCharts) return [];
    const totals = buildNacPerfilTotals(registrosNacPerfil, getValue);
    return Array.from(totals.entries())
      .map(([key, value]) => {
        const [nacId, perfilId] = key.split("::");
        return {
          id: key,
          label: getNacionalidadNombre(nacId),
          sublabel: getPerfilNombre(perfilId),
          value,
        };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [showNacPerfilCharts, registrosNacPerfil, getValue, getNacionalidadNombre, getPerfilNombre]);

  const campoProgressItems = useMemo(() => {
    const totals = new Map<string, { catalogId: string; nombre: string; orden: number; value: number }>();
    for (const opt of availableCampos) {
      if (!selectedCatalogCampoIds.has(opt.catalogId)) continue;
      totals.set(opt.catalogId, { ...opt, value: 0 });
    }
    for (const r of registrosFiltrados) {
      const ind = indicadores.find((i) => i.id === r.indicadorId);
      for (const ic of ind?.obs_indicador_campos || []) {
        const catalogId = ic.obs_campos?.id || ic.campo_id;
        if (!catalogId) continue;
        const entry = totals.get(catalogId);
        if (!entry) continue;
        entry.value += parseInt(r.valores[ic.id] || "0", 10);
      }
    }
    return Array.from(totals.values())
      .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre))
      .map((d) => ({
        id: d.catalogId,
        label: d.nombre,
        value: d.value,
      }));
  }, [availableCampos, selectedCatalogCampoIds, registrosFiltrados, indicadores]);

  const camposSeleccionados = useMemo(
    () => availableCampos.filter((c) => selectedCatalogCampoIds.has(c.catalogId)),
    [availableCampos, selectedCatalogCampoIds]
  );

  const crossCampoNac = useMemo(
    () =>
      showNacPerfilCharts
        ? buildCampoDimensionCross(registrosNacPerfil, indicadores, camposSeleccionados, "nacionalidad")
        : { campos: [], colIds: [], grid: new Map() },
    [showNacPerfilCharts, registrosNacPerfil, indicadores, camposSeleccionados],
  );
  const crossCampoPerfil = useMemo(
    () =>
      showNacPerfilCharts
        ? buildCampoDimensionCross(registrosNacPerfil, indicadores, camposSeleccionados, "perfil")
        : { campos: [], colIds: [], grid: new Map() },
    [showNacPerfilCharts, registrosNacPerfil, indicadores, camposSeleccionados],
  );
  const crossCampoInd = useMemo(
    () => buildCampoDimensionCross(registrosFiltrados, indicadores, camposSeleccionados, "indicador"),
    [registrosFiltrados, indicadores, camposSeleccionados]
  );

  const allCamposSelected =
    selectedCatalogCampoIds.size === availableCampos.length && availableCampos.length > 0;

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-2 h-7 bg-purple-600 rounded-full shrink-0" />
          <h4 className="text-base font-black text-foreground uppercase tracking-tight">
            Cruce global
          </h4>
          {showNacPerfilCharts && (
            <span className="text-xs font-bold text-slate-400 ml-auto sm:ml-2 shrink-0">
              {globalCrossStats.comboCount} combinaciones
              {globalCrossStats.mergedCount > 0 && (
                <span className="text-purple-600 dark:text-purple-400 ml-2">
                  ({globalCrossStats.mergedCount} agrupados)
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-900/15 border border-purple-100 dark:border-purple-800/50">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <label className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">
              Indicador
            </label>
            <select
              value={selectedIndicadorId}
              onChange={(e) => setSelectedIndicadorId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-card dark:bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer truncate"
            >
              <option value={ALL_INDICADORES_ID}>Todos los indicadores</option>
              {indicadoresEnUso.map((ind) => (
                <option key={ind.id} value={ind.id} title={ind.nombre}>
                  {ind.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 shrink-0 pb-0.5">
            <button
              type="button"
              onClick={selectAllCampos}
              disabled={allCamposSelected}
              className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 hover:underline disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Todos
            </button>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <button
              type="button"
              onClick={clearAllCampos}
              disabled={selectedCatalogCampoIds.size === 0}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:underline disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Ninguno
            </button>
            <span className="text-[10px] font-black text-slate-400">
              ({selectedCatalogCampoIds.size}/{availableCampos.length})
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">
            Campos
          </span>
          <div className="flex flex-wrap gap-2">
            {availableCampos.map((opt) => {
              const checked = selectedCatalogCampoIds.has(opt.catalogId);
              return (
                <button
                  key={opt.catalogId}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => toggleCampo(opt.catalogId)}
                  className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    checked
                      ? "border-purple-500 bg-white dark:bg-purple-950/50 text-purple-800 dark:text-purple-200"
                      : "border-purple-100 dark:border-purple-900/60 bg-white/70 dark:bg-background text-slate-600 dark:text-slate-400 hover:border-purple-300"
                  }`}
                >
                  <span
                    className={`w-4 h-4 shrink-0 rounded-[4px] border-2 flex items-center justify-center ${
                      checked ? "bg-purple-600 border-purple-600" : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </span>
                  <span className="text-xs font-semibold whitespace-nowrap">{opt.nombre}</span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          {selectedCatalogCampoIds.size === 0
            ? "Marca al menos un campo para ver las gráficas."
            : selectedIndicadorId === ALL_INDICADORES_ID
              ? "Suma los campos marcados en todos los indicadores (p. ej. todas las «Mujeres»)."
              : "Suma solo los campos marcados del indicador seleccionado."}
        </p>
      </div>

      <div
        className={`grid grid-cols-1 gap-4 ${
          showNacPerfilCharts ? "md:grid-cols-3" : "max-w-md mx-auto w-full"
        }`}
      >
        {showNacPerfilCharts && (
          <>
            <DonutChartCard
              title="Por Nacionalidad"
              icon={Users}
              iconClass="text-amber-500"
              data={nacData}
              chartKey={`nac-${filterKey}`}
            />
            <DonutChartCard
              title="Por Perfil"
              icon={Users}
              iconClass="text-purple-500"
              data={perfilData}
              chartKey={`perfil-${filterKey}`}
            />
          </>
        )}
        <DonutChartCard
          title="Por Indicador"
          icon={PieChartIcon}
          iconClass="text-purple-500"
          data={indicadorData}
          chartKey={`ind-${filterKey}`}
          legendAccordion
        />
      </div>

      <div
        className={`grid grid-cols-1 gap-6 items-stretch ${
          showNacPerfilCharts ? "lg:grid-cols-12" : ""
        }`}
      >
        {showNacPerfilCharts && (
          <div className="lg:col-span-4">
            <ProgressBarChartCard
              title="Combinaciones Nac. × Perfil"
              icon={BarChart3}
              iconClass="text-purple-500"
            >
              <AnimatePresence mode="wait">
                <motion.div key={`combo-${filterKey}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ProgressBarList items={comboProgressItems} />
                </motion.div>
              </AnimatePresence>
            </ProgressBarChartCard>
          </div>
        )}

        <div className={showNacPerfilCharts ? "lg:col-span-8" : "w-full"}>
          <ProgressBarChartCard title="Por Campo" icon={BarChart3} iconClass="text-purple-500" contentAutoHeight>
            <AnimatePresence mode="wait">
              <motion.div key={`campos-${filterKey}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {selectedCatalogCampoIds.size === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold py-8 text-center">
                    Marca al menos un campo para ver el resumen.
                  </p>
                ) : (
                  <ProgressBarList items={campoProgressItems} />
                )}
              </motion.div>
            </AnimatePresence>
          </ProgressBarChartCard>
        </div>
      </div>

      {selectedCatalogCampoIds.size > 0 && (
        <div className="space-y-6 w-full">
          {showNacPerfilCharts && (
            <>
              <CampoDimensionMatrix
                title="Campos × Nacionalidad"
                cornerLabel="Campo ↓ / Nacionalidad →"
                campos={crossCampoNac.campos}
                colIds={crossCampoNac.colIds}
                grid={crossCampoNac.grid}
                getColLabel={getNacionalidadNombre}
                accentClass="text-amber-600 dark:text-amber-400"
              />
              <CampoDimensionMatrix
                title="Campos × Perfil"
                cornerLabel="Campo ↓ / Perfil →"
                campos={crossCampoPerfil.campos}
                colIds={crossCampoPerfil.colIds}
                grid={crossCampoPerfil.grid}
                getColLabel={getPerfilNombre}
                accentClass="text-purple-600 dark:text-purple-400"
              />
            </>
          )}
          <CampoDimensionMatrix
            title="Campos × Indicador"
            cornerLabel="Campo ↓ / Indicador →"
            campos={crossCampoInd.campos}
            colIds={crossCampoInd.colIds}
            grid={crossCampoInd.grid}
            getColLabel={getIndicadorNombre}
            accentClass="text-purple-600 dark:text-purple-400"
          />
        </div>
      )}
    </div>
  );
}

function NacPerfilMatrix({
  registros,
  getNacionalidadNombre,
  getPerfilNombre,
  title,
  getValue,
}: {
  registros: RegistroEntrada[];
  getNacionalidadNombre: (id: string) => string;
  getPerfilNombre: (id: string) => string;
  title: string;
  getValue?: (r: RegistroEntrada) => number;
}) {
  const { nacIds, perfilIds, totals, maxCell, grandTotal } = useMemo(() => {
    const nacIds = [...new Set(registros.map((r) => r.nacionalidadId))];
    const perfilIds = [...new Set(registros.map((r) => r.perfilId))];
    const totals = buildNacPerfilTotals(registros, getValue);
    const values = Array.from(totals.values());
    const maxCell = Math.max(...values, 1);
    const grandTotal = values.reduce((a, b) => a + b, 0);
    return { nacIds, perfilIds, totals, maxCell, grandTotal };
  }, [registros, getValue]);

  if (nacIds.length === 0 || perfilIds.length === 0) return null;

  return (
    <div className="bg-card dark:bg-background rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800/50">
        <Table2 className="w-4 h-4 text-purple-500" />
        <h5 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">{title}</h5>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider sticky left-0 bg-card dark:bg-background">
                Nacionalidad ↓ / Perfil →
              </th>
              {perfilIds.map((pid) => (
                <th key={pid} className="px-3 py-3 text-center text-[10px] font-black text-purple-500 uppercase tracking-wider min-w-20">
                  {getPerfilNombre(pid)}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-[10px] font-black text-purple-500 uppercase tracking-wider">Σ fila</th>
            </tr>
          </thead>
          <tbody>
            {nacIds.map((nid, nIdx) => {
              let rowSum = 0;
              return (
                <tr key={nid} className={`border-b border-slate-50 dark:border-border/50 ${nIdx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/50 dark:bg-secondary/30"}`}>
                  <td className="px-4 py-2.5 font-semibold text-amber-600 dark:text-amber-400 sticky left-0 bg-inherit">{getNacionalidadNombre(nid)}</td>
                  {perfilIds.map((pid) => {
                    const val = totals.get(crossKey(nid, pid)) || 0;
                    rowSum += val;
                    const intensity = val > 0 ? Math.max(0.12, val / maxCell) : 0;
                    return (
                      <td
                        key={pid}
                        className="px-3 py-2.5 text-center font-mono font-bold text-foreground"
                        style={val > 0 ? { backgroundColor: `rgba(147, 51, 234, ${intensity * 0.35})` } : undefined}
                      >
                        {val > 0 ? val : "—"}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-right font-black text-purple-600">{rowSum}</td>
                </tr>
              );
            })}
            <tr className="bg-purple-50/50 dark:bg-purple-900/10 border-t-2 border-purple-200 dark:border-purple-800">
              <td className="px-4 py-3 font-black text-xs text-slate-500 uppercase tracking-wider">Σ columna</td>
              {perfilIds.map((pid) => {
                const colSum = nacIds.reduce((s, nid) => s + (totals.get(crossKey(nid, pid)) || 0), 0);
                return (
                  <td key={pid} className="px-3 py-3 text-center font-black text-foreground">
                    {colSum}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-right font-black text-purple-700 dark:text-purple-400 text-base">{grandTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const skeletonBar = "animate-pulse rounded-lg bg-slate-200/80 dark:bg-accent/80";
const skeletonPurpleBlock =
  "animate-pulse rounded-lg bg-purple-100/50 dark:bg-purple-900/20 border border-purple-200/40 dark:border-purple-800/30";

function OrganizacionesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`h-28 md:h-32 ${skeletonPurpleBlock}`} />
      ))}
    </div>
  );
}

function Step2Skeleton({ withMonth }: { withMonth: boolean }) {
  return (
    <div className="flex flex-col space-y-8 w-full max-w-5xl mx-auto animate-pulse">
      {withMonth && (
        <div className="flex flex-col items-center space-y-2 w-full">
          <div className={`h-3 w-44 ${skeletonBar}`} />
          <div className={`h-12 w-full max-w-sm ${skeletonPurpleBlock}`} />
        </div>
      )}
      <div className="flex flex-col items-center space-y-3 w-full">
        <div className={`h-3 w-28 ${skeletonBar}`} />
        <OrganizacionesSkeleton />
      </div>
      <div className="w-full flex justify-center gap-4 pt-6 border-t border-border">
        <div className={`h-10 w-28 rounded-xl ${skeletonBar}`} />
        <div className={`h-10 w-44 rounded-xl ${skeletonBar}`} />
      </div>
    </div>
  );
}

export default function Formularios({
  onBack,
  initialPolitica,
  canChooseOrg = false,
  userOrganizacionId,
}: FormulariosProps) {
  const {
    sectores,
    organizaciones,
    politicas,
    indicadores,
    nacionalidades,
    perfiles,
    loadingSectores,
    loadingOrgsPols,
    loadingInds,
    isSaving,
    isSaved,
    step,
    setStep,
    formData,
    setFormData,
    registros,
    editingRegistroId,
    currentEntry,
    setCurrentEntry,
    addRegistro,
    autofillCurrentEntry,
    selectRegistroForEdit,
    removeRegistro,
    handleNext,
    handlePrev,
    handleSectorChange,
    handlePoliticaChange,
    handleSubmit,
    isOrgLocked,
  } = useFormulario(onBack, initialPolitica, {
    canChooseOrg,
    userOrganizacionId,
  });

  const { effectiveRole } = useUserContext();
  const isSuper = effectiveRole?.toLowerCase() === "super";
  const [expandedIndicadorId, setExpandedIndicadorId] = useState<string | null>(null);

  // When a policy is pre-selected we skip step 1 (sector) and step 3 (policy)
  // Effective steps: 2 (org) -> 4 (data) -> 5 (summary) => display as 1,2,3
  const displayTotalSteps = initialPolitica ? 3 : 5;
  const displayStep = useMemo(() => {
    if (!initialPolitica) return step;
    if (step === 2) return 1;
    if (step === 4) return 2;
    if (step === 5) return 3;
    return step;
  }, [step, initialPolitica]);
  
  const monthInputRef = useRef<HTMLInputElement>(null);

  const mesFormateado = formData.mesAnio
    ? new Date(formData.mesAnio + "-01T00:00:00")
        .toLocaleDateString("es-ES", { month: "long", year: "numeric" })
        .replace(/^\w/, (c) => c.toUpperCase())
    : null;

  const isStep2Loading = initialPolitica
    ? loadingSectores || loadingOrgsPols
    : loadingOrgsPols;

  const editingRegistroIndex = editingRegistroId
    ? registros.findIndex((r) => r.id === editingRegistroId) + 1
    : 0;

  // Get the current selected indicator object
  const selectedIndicador = useMemo(() => 
    indicadores.find(i => i.id === currentEntry.indicadorId) || null
  , [indicadores, currentEntry.indicadorId]);

  const omitNacPerfil = indicadorOmiteNacPerfil(selectedIndicador);

  // Helper to resolve names
  const getIndicadorNombre = (id: string) => indicadores.find(i => i.id === id)?.nombre || "—";
  const getNacionalidadNombre = (id: string) =>
    !id || id === SIN_ESPECIFICAR ? "Sin especificar" : nacionalidades.find(n => n.id === id)?.nombre || "—";
  const getPerfilNombre = (id: string) =>
    !id || id === SIN_ESPECIFICAR ? "Sin especificar" : perfiles.find(p => p.id === id)?.nombre || "—";
  const getCampoNombre = (indicadorId: string, campoId: string) => {
    const ind = indicadores.find(i => i.id === indicadorId);
    const campo = ind?.obs_indicador_campos?.find(ic => ic.id === campoId);
    return campo?.obs_campos?.nombre || campoId;
  };

  // Summary data grouped by indicator
  const summaryByIndicador = useMemo(() => {
    const grouped = new Map<string, typeof registros>();
    registros.forEach(r => {
      if (!grouped.has(r.indicadorId)) grouped.set(r.indicadorId, []);
      grouped.get(r.indicadorId)!.push(r);
    });
    return grouped;
  }, [registros]);

  const registrosConNacPerfil = useMemo(
    () => filterRegistrosConNacPerfil(registros, indicadores),
    [registros, indicadores],
  );
  const hayRegistrosNacPerfil = registrosConNacPerfil.length > 0;

  const globalCrossStats = useMemo(() => {
    const combos = new Set(
      registrosConNacPerfil.map((r) => crossKey(r.nacionalidadId, r.perfilId)),
    );
    const rawCount = registrosConNacPerfil.length;
    return { comboCount: combos.size, rawCount, mergedCount: rawCount - combos.size };
  }, [registrosConNacPerfil]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full pb-10"
    >
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl bg-card border border-border hover:bg-accent transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Formulario de Captura</h2>
          <p className="text-sm text-muted-foreground">Ingreso dinámico de indicadores del observatorio</p>
        </div>
      </div>

      <div className="w-full">
        <div className="bg-card rounded-3xl border border-border overflow-hidden px-4 py-6 md:p-8 shadow-xl shadow-slate-200/20 dark:shadow-none">
          
          {/* Header (Above Progress Bar) */}
          <div className="mb-4 flex flex-col md:flex-row md:items-baseline md:justify-between gap-4">
            <h3 className="text-xl font-bold text-foreground">
              {step === 1 ? "Paso 1: Información Inicial" :
               step === 2 ? (initialPolitica ? "Paso 1: Período y Organización" : "Paso 2: Organización Responsable") :
               step === 3 ? "Paso 3: Selección de Política Migratoria" :
               step === 4 ? "Paso " + (displayStep) + ": Ingreso de Datos" :
               "Paso " + (displayStep) + ": Confirmar Reporte"}
            </h3>
            <p className="text-sm font-medium text-slate-500 text-right">
              {step === 1 ? "Seleccione el período y sector a reportar." :
               step === 2 ? (initialPolitica ? "Seleccione el mes/año que reporta y la organización responsable." : "Seleccione la organización correspondiente al sector.") :
               step === 3 ? "¿Sobre qué política migratoria desea realizar el reporte?" :
               step === 4 ? "Seleccione indicador y complete los campos para agregar registros." :
               "Revise la información antes del guardado definitivo."}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-2 bg-slate-100 dark:bg-accent rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 transition-all duration-500"
                style={{ width: `${(displayStep / displayTotalSteps) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">Paso {displayStep} de {displayTotalSteps}</span>
          </div>

          {/* Policy Info (Below Progress Bar) */}
          {initialPolitica && (
            <div className="mb-8">
              <PoliticaDescripcionAccordion
                codigo={initialPolitica.codigo}
                descripcion={initialPolitica.descripcion}
              />
            </div>
          )}

          {isSaved ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <CheckCircle2 className="w-20 h-20 text-purple-600 mb-8" />
              <h3 className="text-3xl font-bold text-foreground mb-4">¡Datos guardados con éxito!</h3>
              <p className="text-slate-500 text-lg">Los indicadores han sido registrados en el sistema.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-10">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 flex flex-col items-center"
                  >
                    <div className="flex flex-col space-y-8 w-full max-w-2xl mx-auto">
                      {/* Top: Mes y Año */}
                      <div className="flex flex-col items-center space-y-2 w-full">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] text-center w-full">Mes y año que se reporta</label>
                        <div className="relative w-full max-w-sm">
                          <button
                            type="button"
                            onClick={() => {
                              if (monthInputRef.current) {
                                try { monthInputRef.current.showPicker(); } catch { monthInputRef.current.focus(); }
                              }
                            }}
                            className={`flex items-center justify-center gap-3 w-full px-4 py-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer group focus:ring-2 focus:ring-purple-500 outline-none ${
                              formData.mesAnio ? purpleCardSelected : purpleCardIdle
                            }`}
                          >
                            <Calendar className={`w-4 h-4 shrink-0 group-hover:scale-110 transition-transform ${
                              formData.mesAnio ? "text-purple-200" : "text-purple-600 dark:text-purple-400"
                            }`} />
                            {mesFormateado || "Seleccionar mes"}
                          </button>
                          <input
                            ref={monthInputRef}
                            type="month"
                            required
                            value={formData.mesAnio}
                            onChange={(e) => setFormData({ ...formData, mesAnio: e.target.value })}
                            className="absolute opacity-0 w-0 h-0 pointer-events-none"
                            tabIndex={-1}
                          />
                        </div>
                      </div>

                      {/* Bottom: Sector - Dynamic from DB */}
                      <div className="flex flex-col items-center space-y-3 w-full">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] w-full text-center">Sector</label>
                        {loadingSectores ? (
                          <div className="py-6">
                            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                            {sectores.map((sector) => (
                              <button
                                key={sector.id}
                                type="button"
                                onClick={() => handleSectorChange(sector)}
                                className={`px-4 py-3 rounded-lg text-xs font-bold transition-all border cursor-pointer h-full ${
                                  formData.sector?.id === sector.id
                                    ? "bg-purple-600 text-white border-transparent shadow-md shadow-purple-500/20"
                                    : "bg-card dark:bg-background text-slate-600 dark:text-slate-400 border-border hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/10"
                                }`}
                              >
                                {sector.nombre}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full flex justify-center pt-6 border-t border-border">
                      <button
                        type="button"
                        disabled={!formData.mesAnio || !formData.sector}
                        onClick={handleNext}
                        className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Continuar al Paso 2
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 flex flex-col items-center"
                  >
                    {isStep2Loading ? (
                      <Step2Skeleton withMonth={!!initialPolitica} />
                    ) : (
                      <>
                    {!initialPolitica && (
                      <div className="w-full pb-4 border-b border-border text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-100 dark:border-purple-800">
                          Sector: {formData.sector?.nombre}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col space-y-8 w-full max-w-5xl mx-auto">
                      {/* Month selector only shown when policy is pre-selected (step 1 skipped) */}
                      {initialPolitica && (
                        <div className="flex flex-col items-center space-y-2 w-full">
                          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] text-center w-full">Mes y año que se reporta</label>
                          <div className="relative w-full max-w-sm">
                            <button
                              type="button"
                              onClick={() => {
                                if (monthInputRef.current) {
                                  try { monthInputRef.current.showPicker(); } catch { monthInputRef.current.focus(); }
                                }
                              }}
                              className={`flex items-center justify-center gap-3 w-full px-4 py-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer group focus:ring-2 focus:ring-purple-500 outline-none ${
                                formData.mesAnio ? purpleCardSelected : purpleCardIdle
                              }`}
                            >
                              <Calendar className={`w-4 h-4 shrink-0 group-hover:scale-110 transition-transform ${
                                formData.mesAnio ? "text-purple-200" : "text-purple-600 dark:text-purple-400"
                              }`} />
                              {mesFormateado || "Seleccionar mes"}
                            </button>
                            <input
                              ref={monthInputRef}
                              type="month"
                              required
                              value={formData.mesAnio}
                              onChange={(e) => setFormData({ ...formData, mesAnio: e.target.value })}
                              className="absolute opacity-0 w-0 h-0 pointer-events-none"
                              tabIndex={-1}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col items-center space-y-3 w-full">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] w-full text-center">Organización</label>
                        {organizaciones.length === 0 ? (
                           <p className="text-slate-500 text-sm italic py-6">
                             {isOrgLocked
                               ? "Su organización no está vinculada a este sector."
                               : "No hay organizaciones en este sector."}
                           </p>
                        ) : isOrgLocked ? (
                          <div className="w-full">
                            <FormOrgLogoOption
                              org={formData.organizacion ?? organizaciones[0]}
                              locked
                            />
                            <p className="text-[10px] text-muted-foreground text-center mt-2 italic">
                              Organización asignada a su usuario
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 w-full">
                            {organizaciones.map((org) => (
                              <FormOrgLogoOption
                                key={org.id}
                                org={org}
                                selected={formData.organizacion?.id === org.id}
                                onSelect={() => setFormData({ ...formData, organizacion: org })}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full flex justify-center gap-4 pt-6 border-t border-border">
                      <button
                        type="button"
                        onClick={initialPolitica ? onBack : handlePrev}
                        className="px-8 py-3 rounded-xl border border-border font-bold text-xs text-muted-foreground hover:bg-slate-50 dark:hover:bg-accent transition-all uppercase tracking-widest cursor-pointer"
                      >
                        Atrás
                      </button>
                      <button
                        type="button"
                        disabled={!formData.organizacion || (!!initialPolitica && !formData.mesAnio)}
                        onClick={() => initialPolitica ? setStep(4) : handleNext()}
                        className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {initialPolitica ? "Continuar al Ingreso" : "Continuar al Paso 3"}
                      </button>
                    </div>
                      </>
                    )}
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-16 flex flex-col items-center"
                  >

                    <div className="flex flex-col items-center space-y-8 w-full min-h-[160px]">
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em]">Políticas Migratorias Activas</label>
                      {loadingOrgsPols ? (
                         <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                      ) : politicas.length === 0 ? (
                         <p className="text-slate-500 italic">No hay plantillas disponibles para este sector.</p>
                      ) : (
                        <div className="w-full max-w-3xl space-y-3">
                          {[...politicas]
                            .sort((a, b) => (a.codigo || "").localeCompare(b.codigo || "", "es", { numeric: true }))
                            .map((pol) => {
                              const isSelected = formData.politica?.id === pol.id;
                              return (
                                <div
                                  key={pol.id}
                                  className={`flex rounded-2xl border overflow-hidden transition-colors ${
                                    isSelected
                                      ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10"
                                      : "border-border bg-slate-50 dark:bg-background"
                                  }`}
                                >
                                  <div className={`w-1.5 shrink-0 self-stretch ${isSelected ? "bg-emerald-600" : "bg-purple-600"}`} />
                                  <div className="flex-1 min-w-0 px-5 py-5">
                                    <span className="text-[10px] font-black text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                      {pol.codigo}
                                    </span>
                                    <p className="text-xs font-bold text-foreground leading-relaxed line-clamp-2 mt-2">
                                      {pol.descripcion}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => handlePoliticaChange(pol)}
                                      className="mt-3 pt-2 w-full border-t border-purple-100/80 dark:border-purple-900/30 flex items-center justify-end gap-1 text-[8px] font-bold normal-case tracking-normal text-purple-600 dark:text-purple-400 cursor-pointer"
                                    >
                                      Clic para seleccionar política
                                      <ArrowRight className="w-3 h-3 shrink-0" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>

                    <div className="w-full flex justify-center gap-6 pt-6">
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="px-10 py-3.5 rounded-2xl border border-border font-bold text-sm text-muted-foreground hover:bg-slate-50 dark:hover:bg-accent transition-all uppercase tracking-widest cursor-pointer"
                      >
                        Atrás
                      </button>
                      <button
                        type="button"
                        disabled={!formData.politica}
                        onClick={handleNext}
                        className="px-10 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Continuar al Paso 4
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ═══════════════════════════════════════════════ */}
                {/* STEP 4: MULTI-ENTRY DATA INPUT                 */}
                {/* ═══════════════════════════════════════════════ */}
                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-10"
                  >

                    {loadingInds ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                      </div>
                    ) : indicadores.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        Esta política no tiene grupos de indicadores configurados.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* ── Entry Form Card (Left Column) ── */}
                        <div className="bg-linear-to-br from-slate-50 to-purple-50/40 dark:from-background dark:to-purple-950/10 border border-purple-100 dark:border-purple-900/40 rounded-3xl p-6 space-y-6 sticky top-6">
                          <div className="flex flex-col items-center gap-2">
                            <h4 className="text-xs font-black text-purple-400 dark:text-purple-500 uppercase tracking-[0.4em] text-center">Nuevo Registro</h4>
                            {isSuper && (
                              <button
                                type="button"
                                onClick={autofillCurrentEntry}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
                              >
                                <Wand2 className="w-3.5 h-3.5" />
                                Rellenar automático
                              </button>
                            )}
                          </div>
                          
                          {/* Selectors */}
                          <div className="space-y-4">
                            {/* Indicador Selector (1st line) */}
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Indicador</label>
                              <select
                                value={currentEntry.indicadorId}
                                onChange={(e) => {
                                  const indicadorId = e.target.value;
                                  const ind = indicadores.find((i) => i.id === indicadorId);
                                  const omit = indicadorOmiteNacPerfil(ind);
                                  setCurrentEntry({
                                    ...currentEntry,
                                    indicadorId,
                                    valores: {},
                                    nacionalidadId: omit ? SIN_ESPECIFICAR : currentEntry.nacionalidadId,
                                    perfilId: omit ? SIN_ESPECIFICAR : currentEntry.perfilId,
                                  });
                                }}
                                className="w-full px-4 py-3.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-card dark:bg-background text-foreground font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                              >
                                <option value="">Seleccionar indicador...</option>
                                {indicadores.map((ind) => (
                                  <option key={ind.id} value={ind.id}>{ind.nombre}</option>
                                ))}
                              </select>
                            </div>

                            {!omitNacPerfil && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nacionalidad</label>
                                  <select
                                    value={currentEntry.nacionalidadId}
                                    onChange={(e) => setCurrentEntry({ ...currentEntry, nacionalidadId: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-card dark:bg-background text-foreground font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                                  >
                                    <option value={SIN_ESPECIFICAR}>Sin especificar</option>
                                    {nacionalidades.map((nac) => (
                                      <option key={nac.id} value={nac.id}>{nac.nombre}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Perfil</label>
                                  <select
                                    value={currentEntry.perfilId}
                                    onChange={(e) => setCurrentEntry({ ...currentEntry, perfilId: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-card dark:bg-background text-foreground font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                                  >
                                    <option value={SIN_ESPECIFICAR}>Sin especificar</option>
                                    {perfiles.map((perf) => (
                                      <option key={perf.id} value={perf.id}>{perf.nombre}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Fields for selected indicator */}
                          {selectedIndicador && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-4"
                            >
                              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                {(selectedIndicador.obs_indicador_campos || [])
                                  .sort((a, b) => parseInt(a.orden || "0") - parseInt(b.orden || "0"))
                                  .map((ic) => (
                                    <div key={ic.id} className="space-y-1.5">
                                      <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 min-h-[28px] flex items-end">
                                        <span className="line-clamp-2 leading-tight">{ic.obs_campos?.nombre}</span>
                                      </label>
                                      <input
                                        type="number"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        min="0"
                                        value={currentEntry.valores[ic.id] || ""}
                                        onChange={(e) => setCurrentEntry({
                                          ...currentEntry,
                                          valores: { ...currentEntry.valores, [ic.id]: e.target.value }
                                        })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-card dark:bg-background focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-base font-mono text-foreground"
                                        placeholder="0"
                                      />
                                    </div>
                                  ))}
                              </div>
                              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed pt-1">
                                Complete los campos con las cantidades correspondientes. Si un dato no aplica, déjelo en cero.
                              </p>
                            </motion.div>
                          )}

                          {/* Add / Save Button */}
                          <div className="flex justify-center pt-2">
                            <button
                              type="button"
                              onClick={addRegistro}
                              disabled={!currentEntry.indicadorId}
                              className="inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-purple-600/20"
                            >
                              {editingRegistroId ? (
                                <>
                                  <Save className="w-5 h-5" />
                                  Guardar cambios de registro {editingRegistroIndex}
                                </>
                              ) : (
                                <>
                                  <Plus className="w-5 h-5" />
                                  Agregar Registro
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* ── Registros List (Right Column) ── */}
                        <div className="space-y-4 h-full">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-purple-400 dark:text-purple-500 uppercase tracking-[0.4em]">
                              Registros Agregados
                            </h4>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-black">
                              {registros.length} {registros.length === 1 ? "registro" : "registros"}
                            </span>
                          </div>

                          {registros.length === 0 ? (
                            <div className="text-center py-10 bg-purple-50/30 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/40 h-[300px] flex flex-col items-center justify-center">
                              <Users className="w-10 h-10 text-purple-300 dark:text-purple-700 mx-auto mb-3" />
                              <p className="text-sm text-slate-400 dark:text-slate-600 font-medium">Aún no hay registros agregados.</p>
                              <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Seleccione un indicador para comenzar.</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {registros.map((reg, idx) => {
                                const totalValores = Object.values(reg.valores).reduce((sum, v) => sum + parseInt(v || "0", 10), 0);
                                const isEditing = editingRegistroId === reg.id;
                                const regIndicador = indicadores.find((i) => i.id === reg.indicadorId);
                                const regOmiteNacPerfil = indicadorOmiteNacPerfil(regIndicador);
                                return (
                                  <motion.div
                                    key={reg.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => selectRegistroForEdit(reg)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        selectRegistroForEdit(reg);
                                      }
                                    }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className={`flex items-start gap-3 p-4 bg-card dark:bg-background border rounded-2xl group transition-all shadow-sm cursor-pointer ${
                                      isEditing
                                        ? "border-purple-500 ring-2 ring-purple-500/30 bg-purple-50/50 dark:bg-purple-900/20"
                                        : "border-purple-100 dark:border-purple-900/40 hover:border-purple-300 dark:hover:border-purple-700"
                                    }`}
                                  >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                      isEditing
                                        ? "bg-purple-600 text-white"
                                        : "bg-purple-100 dark:bg-purple-900/30"
                                    }`}>
                                      <span className={`text-xs font-black ${isEditing ? "text-white" : "text-purple-600"}`}>{idx + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-2">
                                      <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Indicador</p>
                                        <p className="text-sm font-bold text-foreground line-clamp-2 leading-tight">{getIndicadorNombre(reg.indicadorId)}</p>
                                      </div>
                                      {!regOmiteNacPerfil && (
                                        <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-accent/50 p-2 rounded-xl border border-border">
                                          <div className="min-w-0">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nacionalidad</p>
                                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 truncate">{getNacionalidadNombre(reg.nacionalidadId)}</p>
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Perfil</p>
                                            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 truncate">{getPerfilNombre(reg.perfilId)}</p>
                                          </div>
                                        </div>
                                      )}
                                      <div className="flex justify-between items-center pt-1 border-t border-border">
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Elementos</p>
                                          <p className="text-sm font-black text-purple-600 dark:text-purple-400">{totalValores}</p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeRegistro(reg.id);
                                      }}
                                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                                      title="Eliminar registro"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="w-full flex justify-center gap-6 pt-10">
                      <button
                        type="button"
                        onClick={() => initialPolitica ? setStep(2) : handlePrev()}
                        className="px-10 py-3.5 rounded-2xl border border-border font-bold text-sm text-muted-foreground hover:bg-slate-50 dark:hover:bg-accent transition-all uppercase tracking-widest cursor-pointer"
                      >
                        Atrás
                      </button>
                      <button
                        type="button"
                        disabled={registros.length === 0}
                        onClick={handleNext}
                        className="px-10 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Continuar al Resumen
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ═══════════════════════════════════════════════ */}
                {/* STEP 5: SUMMARY WITH CHARTS & TABLES           */}
                {/* ═══════════════════════════════════════════════ */}
                {step === 5 && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-10 flex flex-col items-center"
                  >

                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* General Info Card */}
                      <div className="bg-slate-50 dark:bg-background p-6 rounded-3xl border border-border space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Información General</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Periodo:</span>
                            <span className="text-sm font-bold text-foreground">{mesFormateado}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Sector:</span>
                            <span className="text-sm font-bold text-purple-600">{formData.sector?.nombre}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Organización:</span>
                            <span className="text-sm font-bold text-foreground">{formData.organizacion?.nombre}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Política Migratoria:</span>
                            <span className="text-sm font-bold text-emerald-600">{formData.politica?.codigo}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Registros capturados:</span>
                            <span className="text-sm font-bold text-foreground">{registros.length}</span>
                          </div>
                          {hayRegistrosNacPerfil && (
                            <div className="flex justify-between items-center pt-2 border-t border-border">
                              <span className="text-sm font-bold text-slate-500">Combinaciones (Nac. × Perfil):</span>
                              <span className="text-lg font-black text-purple-600">{globalCrossStats.comboCount}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats Card */}
                      <div className="bg-slate-50 dark:bg-background p-6 rounded-3xl border border-border space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" /> Resumen Estadístico
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Indicadores usados:</span>
                            <span className="text-sm font-bold text-foreground">{summaryByIndicador.size}</span>
                          </div>
                          {hayRegistrosNacPerfil && (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Nacionalidades:</span>
                                <span className="text-sm font-bold text-amber-600">
                                  {new Set(registrosConNacPerfil.map((r) => r.nacionalidadId)).size}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Perfiles:</span>
                                <span className="text-sm font-bold text-purple-600">
                                  {new Set(registrosConNacPerfil.map((r) => r.perfilId)).size}
                                </span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between items-center pt-2 border-t border-border">
                            <span className="text-sm font-bold text-slate-500">Gran Total:</span>
                            <span className="text-lg font-black text-purple-600">
                              {registros.reduce((sum, r) => sum + Object.values(r.valores).reduce((s, v) => s + parseInt(v || "0", 10), 0), 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Global cross: charts, campo filter, matrix ── */}
                    {registros.length > 0 && (
                      <GlobalCrossSection
                        registros={registros}
                        indicadores={indicadores}
                        globalCrossStats={globalCrossStats}
                        getNacionalidadNombre={getNacionalidadNombre}
                        getPerfilNombre={getPerfilNombre}
                        getIndicadorNombre={getIndicadorNombre}
                      />
                    )}

                    {/* ── Detalle por indicador (acordeón) ── */}
                    <div className="w-full space-y-3 pt-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-7 bg-purple-600 rounded-full" />
                        <h4 className="text-base font-black text-foreground uppercase tracking-tight">
                          Detalle por indicador
                        </h4>
                      </div>

                    {Array.from(summaryByIndicador.entries()).map(([indicadorId, regs]) => {
                      const ind = indicadores.find(i => i.id === indicadorId);
                      const indOmiteNacPerfil = indicadorOmiteNacPerfil(ind);
                      const campos = (ind?.obs_indicador_campos || [])
                        .sort((a, b) => parseInt(a.orden || "0") - parseInt(b.orden || "0"));
                      const campoIds = campos.map((c) => c.id);
                      const crossRows = indOmiteNacPerfil ? [] : aggregateByNacPerfil(regs, campoIds);
                      
                      // Calculate totals per campo
                      const campoTotals: Record<string, number> = {};
                      campos.forEach(c => { campoTotals[c.id] = 0; });
                      if (indOmiteNacPerfil) {
                        regs.forEach((reg) => {
                          campos.forEach((c) => {
                            campoTotals[c.id] =
                              (campoTotals[c.id] || 0) + parseInt(reg.valores[c.id] || "0", 10);
                          });
                        });
                      } else {
                        crossRows.forEach((row) => {
                          campos.forEach(c => {
                            campoTotals[c.id] = (campoTotals[c.id] || 0) + (row.valores[c.id] || 0);
                          });
                        });
                      }
                      const maxCampoTotal = Math.max(...Object.values(campoTotals), 1);

                      // Totals by nacionalidad (from aggregated rows)
                      const nacTotals = new Map<string, number>();
                      crossRows.forEach((row) => {
                        const total = Object.values(row.valores).reduce((s, v) => s + v, 0);
                        nacTotals.set(row.nacionalidadId, (nacTotals.get(row.nacionalidadId) || 0) + total);
                      });
                      const barColors = ["bg-blue-500", "bg-rose-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500"];
                      const mergedInIndicator = regs.length - crossRows.length;
                      const isOpen = expandedIndicadorId === indicadorId;

                      return (
                        <div
                          key={indicadorId}
                          className={`w-full rounded-2xl border overflow-hidden transition-colors ${
                            isOpen
                              ? "border-purple-200 dark:border-purple-800 bg-card dark:bg-background"
                              : "border-border bg-slate-50/50 dark:bg-secondary/30"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedIndicadorId(isOpen ? null : indicadorId)}
                            className="w-full flex items-start gap-3 p-4 text-left cursor-pointer hover:bg-slate-50/80 dark:hover:bg-accent/40 transition-colors"
                            aria-expanded={isOpen}
                          >
                            <div className="w-1.5 h-full min-h-10 bg-purple-600 rounded-full shrink-0 self-stretch" />
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-black text-foreground leading-snug ${
                                  isOpen ? "" : "line-clamp-2"
                                }`}
                              >
                                {ind?.nombre || "Indicador"}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 mt-1">
                                {indOmiteNacPerfil
                                  ? `${regs.length} ${regs.length === 1 ? "registro" : "registros"}`
                                  : (
                                    <>
                                      {crossRows.length} {crossRows.length === 1 ? "combinación" : "combinaciones"}
                                      {mergedInIndicator > 0 && (
                                        <span className="text-purple-600 dark:text-purple-400 ml-1.5">
                                          · {regs.length} registros
                                        </span>
                                      )}
                                    </>
                                  )}
                              </p>
                            </div>
                            <ChevronDown
                              className={`w-5 h-5 shrink-0 text-slate-400 transition-transform mt-0.5 ${isOpen ? "rotate-180" : ""}`}
                            />
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-6 space-y-6 border-t border-border">

                          {!indOmiteNacPerfil && (
                            <NacPerfilMatrix
                              registros={regs}
                              getNacionalidadNombre={getNacionalidadNombre}
                              getPerfilNombre={getPerfilNombre}
                              title="Matriz Nacionalidad × Perfil"
                            />
                          )}
                          <div className="bg-card dark:bg-background rounded-2xl border border-border overflow-hidden">
                            <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 dark:bg-background border-b border-border">
                              <Table2 className="w-4 h-4 text-slate-400" />
                              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                {indOmiteNacPerfil ? "Resumen por campos" : "Resumen cruzado por campos"}
                              </h5>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-border">
                                    {indOmiteNacPerfil ? (
                                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Registro</th>
                                    ) : (
                                      <>
                                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Nacionalidad</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Perfil</th>
                                      </>
                                    )}
                                    {campos.map(c => (
                                      <th key={c.id} className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">{c.obs_campos?.nombre}</th>
                                    ))}
                                    <th className="px-4 py-3 text-right text-[10px] font-black text-purple-500 uppercase tracking-wider">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {indOmiteNacPerfil ? (
                                    <>
                                      {regs.map((reg, rIdx) => {
                                        const rowTotal = Object.values(reg.valores).reduce(
                                          (s, v) => s + parseInt(v || "0", 10),
                                          0,
                                        );
                                        return (
                                          <tr
                                            key={reg.id}
                                            className={`border-b border-slate-50 dark:border-border/50 ${rIdx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/50 dark:bg-secondary/30"}`}
                                          >
                                            <td className="px-4 py-2.5 font-semibold text-purple-600 dark:text-purple-400">
                                              #{rIdx + 1}
                                            </td>
                                            {campos.map((c) => (
                                              <td key={c.id} className="px-4 py-2.5 text-right font-mono font-bold text-foreground">
                                                {parseInt(reg.valores[c.id] || "0", 10)}
                                              </td>
                                            ))}
                                            <td className="px-4 py-2.5 text-right font-black text-purple-600">{rowTotal}</td>
                                          </tr>
                                        );
                                      })}
                                      <tr className="bg-purple-50/50 dark:bg-purple-900/10 border-t-2 border-purple-200 dark:border-purple-800">
                                        <td className="px-4 py-3 font-black text-xs text-slate-500 uppercase tracking-wider">Totales</td>
                                        {campos.map((c) => (
                                          <td key={c.id} className="px-4 py-3 text-right font-black text-foreground">{campoTotals[c.id]}</td>
                                        ))}
                                        <td className="px-4 py-3 text-right font-black text-purple-700 dark:text-purple-400 text-base">
                                          {Object.values(campoTotals).reduce((a, b) => a + b, 0)}
                                        </td>
                                      </tr>
                                    </>
                                  ) : (
                                    <>
                                      {crossRows.map((row, rIdx) => {
                                        const rowTotal = Object.values(row.valores).reduce((s, v) => s + v, 0);
                                        return (
                                          <tr key={crossKey(row.nacionalidadId, row.perfilId)} className={`border-b border-slate-50 dark:border-border/50 ${rIdx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/50 dark:bg-secondary/30"}`}>
                                            <td className="px-4 py-2.5 font-semibold text-amber-600 dark:text-amber-400">{getNacionalidadNombre(row.nacionalidadId)}</td>
                                            <td className="px-4 py-2.5 font-semibold text-purple-600 dark:text-purple-400">
                                              <span>{getPerfilNombre(row.perfilId)}</span>
                                              {row.registroCount > 1 && (
                                                <span className="ml-2 text-[9px] font-black uppercase tracking-wider text-purple-500 bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">
                                                  ×{row.registroCount}
                                                </span>
                                              )}
                                            </td>
                                            {campos.map(c => (
                                              <td key={c.id} className="px-4 py-2.5 text-right font-mono font-bold text-foreground">{row.valores[c.id] ?? 0}</td>
                                            ))}
                                            <td className="px-4 py-2.5 text-right font-black text-purple-600">{rowTotal}</td>
                                          </tr>
                                        );
                                      })}
                                      <tr className="bg-purple-50/50 dark:bg-purple-900/10 border-t-2 border-purple-200 dark:border-purple-800">
                                        <td colSpan={2} className="px-4 py-3 font-black text-xs text-slate-500 uppercase tracking-wider">Totales</td>
                                        {campos.map(c => (
                                          <td key={c.id} className="px-4 py-3 text-right font-black text-foreground">{campoTotals[c.id]}</td>
                                        ))}
                                        <td className="px-4 py-3 text-right font-black text-purple-700 dark:text-purple-400 text-base">
                                          {Object.values(campoTotals).reduce((a, b) => a + b, 0)}
                                        </td>
                                      </tr>
                                    </>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className={`grid grid-cols-1 gap-6 ${indOmiteNacPerfil ? "" : "md:grid-cols-2"}`}>
                            {/* Chart: Totals by Campo */}
                            <div className="bg-card dark:bg-background p-6 rounded-2xl border border-border space-y-5">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-purple-500" />
                                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">Por Campo</h5>
                              </div>
                              <div className="space-y-4">
                                {campos.map((c, cIdx) => {
                                  const val = campoTotals[c.id];
                                  const pct = (val / maxCampoTotal) * 100;
                                  const color = barColors[cIdx % barColors.length];
                                  return (
                                    <div key={c.id} className="space-y-1.5">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[70%]">{c.obs_campos?.nombre}</span>
                                        <span className="text-xs font-black text-foreground">{val}</span>
                                      </div>
                                      <div className="h-3 w-full bg-slate-100 dark:bg-accent rounded-full overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${pct}%` }}
                                          transition={{ duration: 0.8, ease: "easeOut", delay: cIdx * 0.1 }}
                                          className={`h-full ${color} rounded-full`}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {!indOmiteNacPerfil && (
                              <DonutChartCard
                                title="Por Nacionalidad"
                                icon={Users}
                                iconClass="text-amber-500"
                                data={totalsToDonutData(nacTotals, getNacionalidadNombre, 3)}
                                chartKey={`ind-nac-${indicadorId}`}
                              />
                            )}
                          </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                    </div>

                    <div className="w-full flex justify-center gap-6 pt-10">
                      <button
                        type="button"
                        onClick={handlePrev}
                        disabled={isSaving}
                        className="px-10 py-3.5 rounded-2xl border border-border font-bold text-sm text-muted-foreground hover:bg-slate-50 dark:hover:bg-accent transition-all uppercase tracking-widest cursor-pointer disabled:opacity-50"
                      >
                        Corregir
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-10 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm uppercase tracking-widest transition-all active:scale-95 cursor-pointer shadow-lg shadow-purple-600/20 flex items-center gap-3 disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? "Guardando..." : "Guardar Definitivo"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}

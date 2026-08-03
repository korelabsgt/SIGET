"use client";

import { useState, useMemo, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ReportExcelButton } from "./ReportExcelButton";
import {
  buildCampoDimensionCrossRows,
  buildOmiteNacPerfilSectionRows,
  downloadCampoIndicadorExcel,
  downloadIndicadorDetailExcel,
  downloadSingleSheet,
  safeFilename,
} from "./lib/reportes-excel";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Users,
  PieChart as PieChartIcon,
  BarChart3,
  Table2,
  Check,
  ChevronDown,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ReportRow } from "./lib/reportes-actions";
import {
  ALL_INDICADORES_ID,
  filterReportRows,
  getAvailableCampos,
  getIndicadoresEnUso,
  getPoliticasEnDatos,
  computeGlobalCrossStats,
  aggregateReportSlices,
  buildNacPerfilProgressItems,
  buildCampoProgressItems,
  buildReportCampoDimensionCross,
  aggregateReportByNacPerfil,
  getCampoTotalsForIndicador,
  buildNacTotalsMap,
  nacPerfilMatrixFromRows,
  rowsConNacPerfil,
  rowsOmiteNacPerfil,
  indicadorOmiteNacPerfil,
  OMITE_NAC_PERFIL_SECTION_TITLE,
  type ReportChartSlice,
  type ReportCampoOption,
} from "./lib/cross-report-lib";
import { HEATMAP_RGB, GUATEMALTECO_CELESTE, isGuatemalteco, nationalityColor, nacPerfilBarColor, softBarColor } from "./lib/chart-colors";
import { AnimatedNumber } from "@/components/ui/animated-number";

const LEGEND_ACCORDION_MIN_LEN = 42;

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

function DonutCenterTotal({
  value,
  compact = false,
  isLg = false,
  active,
  runId,
}: {
  value: number;
  compact?: boolean;
  isLg?: boolean;
  active: boolean;
  runId: string | number;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-0.5 text-center">
      <AnimatedNumber
        value={value}
        active={active}
        runId={runId}
        className={`font-black leading-none font-mono text-slate-900 dark:text-white ${
          compact ? "text-[10px]" : isLg ? "text-xl" : "text-sm"
        }`}
      />
      {!compact && (
        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          total
        </span>
      )}
    </div>
  );
}

function ProgressBarList({
  items,
  maxValue,
  getBarColor,
}: {
  items: { id: string; label: string; sublabel?: string; value: number }[];
  maxValue?: number;
  getBarColor?: (item: { id: string; label: string; sublabel?: string; value: number }, idx: number) => string;
}) {
  const max = maxValue ?? Math.max(...items.map((i) => i.value), 1);
  if (items.length === 0) {
    return <p className="text-xs text-slate-400 font-semibold py-4 text-center">Sin datos</p>;
  }
  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const pct = (item.value / max) * 100;
        const barColor = getBarColor ? getBarColor(item, idx) : softBarColor(idx);
        return (
          <div key={item.id} className="space-y-1.5">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block leading-snug">
                  {item.label}
                </span>
                {item.sublabel && (
                  <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 block mt-0.5">
                    {item.sublabel}
                  </span>
                )}
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white shrink-0">
                {formatChartNumber(item.value)}
              </span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: "easeOut", delay: idx * 0.05 }}
                className="h-full rounded-full"
                style={{ backgroundColor: barColor }}
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
      className={`bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 ${
        contentAutoHeight ? "" : "h-full flex flex-col"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconClass}`} />
        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</h5>
      </div>
      <div className={contentAutoHeight ? "pr-1" : "flex-1 min-h-0 max-h-[280px] overflow-y-auto pr-1"}>
        {children}
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
  active,
  runId,
}: {
  item: { name: string; value: number; color: string };
  total: number;
  index: number;
  expanded: boolean;
  onToggle: (index: number) => void;
  useAccordion: boolean;
  active: boolean;
  runId: string | number;
}) {
  const pct = total > 0 ? `${((item.value / total) * 100).toFixed(0)}%` : "0%";
  if (!useAccordion) {
    return (
      <div className="flex items-start justify-between gap-2 text-[10px]">
        <div className="flex items-start gap-1.5 min-w-0 flex-1">
          <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: item.color }} />
          <span className="font-semibold text-slate-600 dark:text-slate-400 leading-snug">{item.name}</span>
        </div>
        <div className="flex flex-col items-end shrink-0 leading-tight">
          <AnimatedNumber
            value={item.value}
            active={active}
            runId={`${runId}-${index}`}
            className="font-black text-slate-800 dark:text-slate-200 font-mono"
          />
          <span className="font-bold text-slate-400 dark:text-slate-500 tabular-nums">{pct}</span>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`rounded-lg border transition-colors ${
        expanded ? "border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-900/20" : "border-transparent"
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
          <p className={`text-[10px] font-semibold text-slate-600 dark:text-slate-400 leading-snug ${expanded ? "" : "line-clamp-2"}`}>
            {item.name}
          </p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform mt-0.5 ${expanded ? "rotate-180" : ""}`} />
        <div className="flex flex-col items-end shrink-0 leading-tight">
          <AnimatedNumber
            value={item.value}
            active={active}
            runId={`${runId}-${index}`}
            className="font-black text-slate-800 dark:text-slate-200 font-mono text-[10px]"
          />
          <span className="font-bold text-slate-400 dark:text-slate-500 tabular-nums text-[10px]">{pct}</span>
        </div>
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
  size = "default",
}: {
  title: string;
  icon: typeof PieChartIcon;
  iconClass: string;
  data: ReportChartSlice[];
  chartKey: string;
  legendAccordion?: boolean;
  compact?: boolean;
  size?: "default" | "lg";
}) {
  const [expandedLegendIndex, setExpandedLegendIndex] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInView = useInView(chartRef, { once: true, margin: "-20px" });
  const total = data.reduce((s, d) => s + d.value, 0);
  const isLg = size === "lg";

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[180px]">
        <p className="text-xs text-slate-400 font-semibold">Sin datos para este filtro</p>
      </div>
    );
  }

  const chartBoxClass = compact
    ? "w-[88px] h-[88px]"
    : isLg
      ? "w-[168px] h-[168px] sm:w-[188px] sm:h-[188px]"
      : "w-[120px] h-[120px]";
  const innerRadius = compact ? 24 : isLg ? 48 : 34;
  const outerRadius = compact ? 36 : isLg ? 74 : 50;
  const chartRowMinH = compact ? "min-h-[150px]" : isLg ? "min-h-[240px]" : "min-h-[140px]";

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-3 space-y-2 h-full flex flex-col"
          : isLg
            ? "bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 h-full flex flex-col"
            : "bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3"
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
      </div>
      <div
        className={`flex gap-3 sm:gap-4 items-center flex-1 min-h-0 ${chartRowMinH} ${
          isLg ? "justify-center" : ""
        }`}
      >
        <div ref={chartRef} className={`relative shrink-0 ${chartBoxClass}`}>
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
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
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
          <DonutCenterTotal
            value={total}
            compact={compact}
            isLg={isLg}
            active={chartInView}
            runId={chartKey}
          />
        </div>
        <div className={`flex-1 min-w-0 space-y-1.5 pr-0.5 ${isLg ? "max-w-56" : "max-h-[200px] overflow-y-auto"}`}>
          {data.map((item, idx) => (
            <ChartLegendRow
              key={`${item.name}-${idx}`}
              item={item}
              total={total}
              index={idx}
              expanded={expandedLegendIndex === idx}
              onToggle={(i) => setExpandedLegendIndex((prev) => (prev === i ? null : i))}
              useAccordion={legendAccordion || item.name.length > LEGEND_ACCORDION_MIN_LEN}
              active={chartInView}
              runId={chartKey}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function IndRefTooltip({
  index,
  nombre,
  className = "",
}: {
  index: number;
  nombre: string;
  className?: string;
}) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const showTooltip = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    setVisible(true);
  };

  return (
    <>
      <span
        ref={triggerRef}
        className={`inline-block ${className}`}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setVisible(false)}
        onFocus={showTooltip}
        onBlur={() => setVisible(false)}
        tabIndex={0}
        title={nombre}
      >
        <span className="cursor-help underline decoration-dotted decoration-blue-400/50 underline-offset-2">
          Ind. {index + 1}
        </span>
      </span>
      {visible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "fixed",
              left: coords.x,
              top: coords.y,
              transform: "translate(-50%, -100%)",
              zIndex: 9999,
            }}
            className="pointer-events-none w-max max-w-[min(20rem,calc(100vw-2rem))] px-3 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 text-white text-[11px] font-semibold leading-snug shadow-lg text-left normal-case tracking-normal"
          >
            <span className="block text-[9px] font-black uppercase text-blue-300 mb-0.5 tracking-widest">
              Ind. {index + 1}
            </span>
            {nombre}
          </div>,
          document.body
        )}
    </>
  );
}

function CampoDimensionMatrix({
  title,
  cornerLabel,
  campos,
  colIds,
  grid,
  getColLabel,
  accentClass = "text-blue-600 dark:text-blue-400",
  shortColLabels = false,
  onExportExcel,
}: {
  title: string;
  cornerLabel: string;
  campos: { catalogId: string; nombre: string }[];
  colIds: string[];
  grid: Map<string, Map<string, number>>;
  getColLabel: (id: string) => string;
  accentClass?: string;
  shortColLabels?: boolean;
  onExportExcel?: () => void;
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
    <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/50 rounded-t-2xl">
        <Table2 className="w-4 h-4 text-blue-500 shrink-0" />
        <h5 className={`text-xs font-black uppercase tracking-widest flex-1 min-w-0 ${accentClass}`}>{title}</h5>
        {onExportExcel && <ReportExcelButton onClick={onExportExcel} />}
      </div>
      <div className="overflow-x-auto overflow-y-visible rounded-b-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider sticky left-[-1px] bg-white dark:bg-slate-900 z-10 min-w-28 whitespace-normal max-w-[150px]">
                {(() => {
                  if (cornerLabel.includes("Indicador")) {
                    return <span className="whitespace-nowrap">{cornerLabel}</span>;
                  }
                  const words = cornerLabel.trim().split(/\s+/);
                  if (words.length > 2) {
                    return (
                      <>
                        {words.slice(0, 2).join(" ")}
                        <br />
                        {words.slice(2).join(" ")}
                      </>
                    );
                  }
                  return cornerLabel;
                })()}
              </th>
              {colIds.map((colId, colIdx) => {
                const fullLabel = getColLabel(colId);
                return (
                <th
                  key={colId}
                  className={`px-3 py-3 text-center text-[10px] font-black text-blue-500 uppercase tracking-wider whitespace-normal min-w-[120px] max-w-[150px]`}
                >
                  {shortColLabels ? (
                    <IndRefTooltip index={colIdx} nombre={fullLabel} />
                  ) : (
                    (() => {
                      const words = fullLabel.trim().split(/\s+/);
                      if (words.length > 2) {
                        return (
                          <>
                            {words.slice(0, 2).join(" ")}
                            <br />
                            {words.slice(2).join(" ")}
                          </>
                        );
                      }
                      return fullLabel;
                    })()
                  )}
                </th>
                );
              })}
              <th className="px-4 py-3 text-right text-[10px] font-black text-blue-500 uppercase tracking-wider">Σ</th>
            </tr>
          </thead>
          <tbody>
            {campos.map((campo, rIdx) => {
              const rowMap = grid.get(campo.catalogId) || new Map();
              let rowSum = 0;
              return (
                <tr
                  key={campo.catalogId}
                  className={`group border-b border-slate-55 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${
                    rIdx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-55/50 dark:bg-slate-900/30"
                  }`}
                >
                  <td className={`px-4 py-2.5 font-semibold text-blue-600 dark:text-blue-400 sticky left-[-1px] z-10 whitespace-normal min-w-[130px] max-w-[160px] transition-colors ${
                    rIdx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-[#1e293b]"
                  } group-hover:bg-slate-100 dark:group-hover:bg-slate-800`}>
                    {(() => {
                      const words = campo.nombre.trim().split(/\s+/);
                      if (words.length > 2) {
                        return (
                          <>
                            {words.slice(0, 2).join(" ")}
                            <br />
                            {words.slice(2).join(" ")}
                          </>
                        );
                      }
                      return campo.nombre;
                    })()}
                  </td>
                  {colIds.map((colId) => {
                    const val = rowMap.get(colId) || 0;
                    rowSum += val;
                    const intensity = val > 0 ? Math.max(0.12, val / maxCell) : 0;
                    return (
                      <td
                        key={colId}
                        className="px-3 py-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300"
                        style={val > 0 ? { backgroundColor: `rgba(${HEATMAP_RGB}, ${intensity * 0.24})` } : undefined}
                      >
                        {val > 0 ? val : "—"}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-right font-black text-blue-600">{rowSum}</td>
                </tr>
              );
            })}
            <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-200 dark:border-blue-800">
              <td className="px-4 py-3 font-black text-xs text-slate-500 uppercase tracking-wider sticky left-[-1px] bg-blue-50 dark:bg-[#1e3a8a] z-10">Σ</td>
              {colIds.map((colId) => {
                const colSum = campos.reduce((s, c) => s + (grid.get(c.catalogId)?.get(colId) || 0), 0);
                return (
                  <td key={colId} className="px-3 py-3 text-center font-black text-slate-800 dark:text-slate-200">
                    {colSum}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-right font-black text-blue-700 dark:text-blue-400">{grandTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NacPerfilMatrix({ rows }: { rows: ReportRow[] }) {
  const { nacIds, perfilIds, totals, maxCell, grandTotal, nacLabels, perfLabels, crossKey } = useMemo(
    () => nacPerfilMatrixFromRows(rows),
    [rows]
  );

  if (nacIds.length === 0 || perfilIds.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/50">
        <Table2 className="w-4 h-4 text-blue-500 shrink-0" />
        <h5 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex-1 min-w-0">
          Matriz Nacionalidad × Perfil
        </h5>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider sticky left-[-1px] bg-white dark:bg-slate-900 z-10 whitespace-normal max-w-[150px]">
                {(() => {
                  const label = "Nacionalidad ↓ / Perfil →";
                  const words = label.trim().split(/\s+/);
                  if (words.length > 2) {
                    return (
                      <>
                        {words.slice(0, 2).join(" ")}
                        <br />
                        {words.slice(2).join(" ")}
                      </>
                    );
                  }
                  return label;
                })()}
              </th>
              {perfilIds.map((pid) => {
                const label = perfLabels.get(pid) || "";
                return (
                  <th key={pid} className="px-3 py-3 text-center text-[10px] font-black text-blue-500 uppercase tracking-wider min-w-[120px] max-w-[150px] whitespace-normal">
                    {(() => {
                      const words = label.trim().split(/\s+/);
                      if (words.length > 2) {
                        return (
                          <>
                            {words.slice(0, 2).join(" ")}
                            <br />
                            {words.slice(2).join(" ")}
                          </>
                        );
                      }
                      return label;
                    })()}
                  </th>
                );
              })}
              <th className="px-4 py-3 text-right text-[10px] font-black text-blue-500 uppercase tracking-wider">Σ fila</th>
            </tr>
          </thead>
          <tbody>
            {nacIds.map((nid, nIdx) => {
              let rowSum = 0;
              return (
                <tr key={nid} className={`group border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${nIdx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/50 dark:bg-slate-900/30"}`}>
                  <td className={`px-4 py-2.5 font-semibold text-amber-600 dark:text-amber-400 sticky left-[-1px] z-10 whitespace-normal min-w-[130px] max-w-[160px] transition-colors ${
                    nIdx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-[#1e293b]"
                  } group-hover:bg-slate-100 dark:group-hover:bg-slate-800`}>
                    {(() => {
                      const label = nacLabels.get(nid) || "";
                      const words = label.trim().split(/\s+/);
                      if (words.length > 2) {
                        return (
                          <>
                            {words.slice(0, 2).join(" ")}
                            <br />
                            {words.slice(2).join(" ")}
                          </>
                        );
                      }
                      return label;
                    })()}
                  </td>
                  {perfilIds.map((pid) => {
                    const val = totals.get(crossKey(nid, pid)) || 0;
                    rowSum += val;
                    const intensity = val > 0 ? Math.max(0.12, val / maxCell) : 0;
                    return (
                      <td
                        key={pid}
                        className="px-3 py-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300"
                        style={val > 0 ? { backgroundColor: `rgba(${HEATMAP_RGB}, ${intensity * 0.24})` } : undefined}
                      >
                        {val > 0 ? val : "—"}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-right font-black text-blue-600">{rowSum}</td>
                </tr>
              );
            })}
            <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-200 dark:border-blue-800">
              <td className="px-4 py-3 font-black text-xs text-slate-500 uppercase tracking-wider sticky left-[-1px] bg-blue-50 dark:bg-[#1e3a8a] z-10">Σ columna</td>
              {perfilIds.map((pid) => {
                const colSum = nacIds.reduce((s, nid) => s + (totals.get(crossKey(nid, pid)) || 0), 0);
                return (
                  <td key={pid} className="px-3 py-3 text-center font-black text-slate-800 dark:text-slate-200">
                    {colSum}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-right font-black text-blue-700 dark:text-blue-400 text-base">{grandTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Bloque aparte: Reuniones / Empresas / Actores ─── */

function OmiteNacPerfilCrossBlock({ rows }: { rows: ReportRow[] }) {
  const omitRows = useMemo(() => rowsOmiteNacPerfil(rows), [rows]);
  const availableCampos = useMemo(() => getAvailableCampos(omitRows), [omitRows]);
  const selectedCampoIds = useMemo(
    () => new Set(availableCampos.map((c) => c.catalogId)),
    [availableCampos],
  );

  const indicadorData = useMemo(
    () => aggregateReportSlices(omitRows, "indicador"),
    [omitRows],
  );
  const campoProgressItems = useMemo(
    () => buildCampoProgressItems(omitRows, selectedCampoIds, availableCampos),
    [omitRows, selectedCampoIds, availableCampos],
  );
  const crossCampoInd = useMemo(
    () => buildReportCampoDimensionCross(omitRows, availableCampos, "indicador"),
    [omitRows, availableCampos],
  );
  const indicadoresRef = useMemo(
    () =>
      crossCampoInd.colIds.map((id) => ({
        id,
        nombre: crossCampoInd.getColLabel(id),
      })),
    [crossCampoInd],
  );

  if (omitRows.length === 0) return null;

  const omitKey = omitRows.map((r) => r.valorId).join(",").slice(0, 80);

  return (
    <div
      data-report-export-block
      className="space-y-6 pt-6 border-t-2 border-violet-200 dark:border-violet-800/60"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-2 h-7 bg-violet-600 rounded-full shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
            {OMITE_NAC_PERFIL_SECTION_TITLE}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Desglose por indicador y campo, sin comparación por nacionalidad ni perfil.
          </p>
        </div>
        <ReportExcelButton
          label="Excel"
          onClick={() =>
            downloadSingleSheet(
              buildOmiteNacPerfilSectionRows(rows),
              "reuniones-empresas-actores.xlsx",
              OMITE_NAC_PERFIL_SECTION_TITLE,
            )
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DonutChartCard
          key={`omit-ind-${omitKey}`}
          title="Por Indicador"
          icon={PieChartIcon}
          iconClass="text-violet-500"
          data={indicadorData}
          chartKey={`omit-ind-${omitKey}`}
          legendAccordion
        />
        <ProgressBarChartCard title="Por Campo" icon={BarChart3} iconClass="text-violet-500" contentAutoHeight>
          <ProgressBarList items={campoProgressItems} />
        </ProgressBarChartCard>
      </div>

      {crossCampoInd.colIds.length > 0 && (
        <div className="space-y-4">
          <CampoDimensionMatrix
            title="Campos × Indicador"
            cornerLabel="Campo ↓ / Indicador →"
            campos={crossCampoInd.campos}
            colIds={crossCampoInd.colIds}
            grid={crossCampoInd.grid}
            getColLabel={crossCampoInd.getColLabel}
            accentClass="text-violet-600 dark:text-violet-400"
            shortColLabels
            onExportExcel={() =>
              downloadCampoIndicadorExcel(
                crossCampoInd,
                indicadoresRef,
                "reuniones-empresas-actores",
              )
            }
          />
          <IndicadorReferenciaTable indicadores={indicadoresRef} />
        </div>
      )}
    </div>
  );
}

/* ─── Cruce global (misma UI que formularios paso 5) ─── */

export function ReportGlobalCrossSection({
  rows,
  embedded = false,
}: {
  rows: ReportRow[];
  embedded?: boolean;
}) {
  const [isCamposOpen, setIsCamposOpen] = useState(false);

  const stats = useMemo(() => computeGlobalCrossStats(rows), [rows]);
  const availableCampos = useMemo(() => getAvailableCampos(rows), [rows]);
  const availableCampoKey = useMemo(
    () => availableCampos.map((c) => c.catalogId).sort().join("\0"),
    [availableCampos]
  );
  const [campoScopeKey, setCampoScopeKey] = useState(availableCampoKey);
  const [selectedCampoIds, setSelectedCampoIds] = useState<Set<string>>(
    () => new Set(availableCampos.map((c) => c.catalogId))
  );

  if (campoScopeKey !== availableCampoKey) {
    setCampoScopeKey(availableCampoKey);
    setSelectedCampoIds(new Set(availableCampos.map((c) => c.catalogId)));
  }

  const filteredRows = useMemo(
    () => filterReportRows(rows, ALL_INDICADORES_ID, selectedCampoIds),
    [rows, selectedCampoIds]
  );

  const filterKey = [...selectedCampoIds].sort().join(",");

  // ¿Hay filas que apliquen a nacionalidad/perfil? (excluye Reuniones/Empresas/Actores)
  const nacPerfilFilteredRows = useMemo(
    () => rowsConNacPerfil(filteredRows),
    [filteredRows],
  );

  const hasNacPerfil = nacPerfilFilteredRows.length > 0;
  const hasOmiteNacPerfil = useMemo(
    () => rowsOmiteNacPerfil(filteredRows).length > 0,
    [filteredRows],
  );

  const nacData = useMemo(
    () => aggregateReportSlices(nacPerfilFilteredRows, "nacionalidad"),
    [nacPerfilFilteredRows],
  );
  const perfilData = useMemo(
    () => aggregateReportSlices(nacPerfilFilteredRows, "perfil"),
    [nacPerfilFilteredRows],
  );
  const indicadorData = useMemo(
    () => aggregateReportSlices(nacPerfilFilteredRows, "indicador"),
    [nacPerfilFilteredRows],
  );

  const comboProgressItems = useMemo(
    () => buildNacPerfilProgressItems(filteredRows),
    [filteredRows],
  );
  const campoProgressItems = useMemo(
    () => buildCampoProgressItems(nacPerfilFilteredRows, selectedCampoIds, availableCampos),
    [nacPerfilFilteredRows, selectedCampoIds, availableCampos],
  );

  const camposSeleccionados = useMemo(
    () => availableCampos.filter((c) => selectedCampoIds.has(c.catalogId)),
    [availableCampos, selectedCampoIds]
  );

  const crossCampoNac = useMemo(
    () => buildReportCampoDimensionCross(nacPerfilFilteredRows, camposSeleccionados, "nacionalidad"),
    [nacPerfilFilteredRows, camposSeleccionados],
  );
  const crossCampoPerfil = useMemo(
    () => buildReportCampoDimensionCross(nacPerfilFilteredRows, camposSeleccionados, "perfil"),
    [nacPerfilFilteredRows, camposSeleccionados],
  );

  const toggleCampo = (catalogId: string) => {
    setSelectedCampoIds((prev) => {
      const next = new Set(prev);
      if (next.has(catalogId)) next.delete(catalogId);
      else next.add(catalogId);
      return next;
    });
  };

  if (rows.length === 0) return null;

  const inner = (
    <>
      {!embedded && (
        <div className="flex items-center gap-3">
          <div className="w-2 h-7 bg-blue-600 rounded-full shrink-0" />
          <h3 className="text-base font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
            Cruce global
          </h3>
          <span className="text-xs font-bold text-slate-400 ml-auto shrink-0">
            {stats.comboCount} combinaciones · {stats.registroCount} registros
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-800/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button 
            type="button" 
            onClick={() => setIsCamposOpen(!isCamposOpen)}
            className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest cursor-pointer hover:opacity-80"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCamposOpen ? "rotate-180" : ""}`} />
            Campos
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedCampoIds(new Set(availableCampos.map((c) => c.catalogId)))}
              disabled={selectedCampoIds.size === availableCampos.length}
              className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Todos
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => setSelectedCampoIds(new Set())}
              disabled={selectedCampoIds.size === 0}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:underline disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Ninguno
            </button>
            <span className="text-[10px] font-black text-slate-400">
              ({selectedCampoIds.size}/{availableCampos.length})
            </span>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isCamposOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
                  {availableCampos.map((opt) => {
                    const checked = selectedCampoIds.has(opt.catalogId);
                    return (
                      <button
                        key={opt.catalogId}
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        onClick={() => toggleCampo(opt.catalogId)}
                        className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer text-left ${
                          checked
                            ? "border-blue-500 bg-white dark:bg-blue-950/50 text-blue-800 dark:text-blue-200"
                            : "border-blue-100 dark:border-blue-900/60 bg-white/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-blue-300"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 shrink-0 rounded-[4px] border-2 flex items-center justify-center ${
                            checked ? "bg-blue-600 border-blue-600" : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                        </span>
                        <span className="text-xs font-semibold whitespace-normal sm:whitespace-nowrap leading-tight">{opt.nombre}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {selectedCampoIds.size === 0
                    ? "Marca al menos un campo para ver las gráficas."
                    : "Suma los campos marcados en todos los indicadores (p. ej. todas las «Mujeres»). Para ver un indicador en detalle, usa la sección «Detalle por indicador»."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${hasNacPerfil ? "md:grid-cols-3" : hasOmiteNacPerfil ? "hidden" : "md:grid-cols-1"}`}>
        {hasNacPerfil && (
          <>
            <DonutChartCard key={`nac-${filterKey}`} title="Por Nacionalidad" icon={Users} iconClass="text-amber-500" data={nacData} chartKey={`nac-${filterKey}`} />
            <DonutChartCard key={`perfil-${filterKey}`} title="Por Perfil" icon={Users} iconClass="text-blue-500" data={perfilData} chartKey={`perfil-${filterKey}`} />
          </>
        )}
        {hasNacPerfil && (
          <DonutChartCard key={`ind-${filterKey}`} title="Por Indicador" icon={PieChartIcon} iconClass="text-blue-500" data={indicadorData} chartKey={`ind-${filterKey}`} legendAccordion />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {hasNacPerfil && (
          <div className="lg:col-span-4">
            <ProgressBarChartCard title="Combinaciones Nac. × Perfil" icon={BarChart3} iconClass="text-blue-500">
              <AnimatePresence mode="wait">
                <motion.div key={`combo-${filterKey}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ProgressBarList items={comboProgressItems} getBarColor={(item, idx) => nacPerfilBarColor(item.label, idx)} />
                </motion.div>
              </AnimatePresence>
            </ProgressBarChartCard>
          </div>
        )}
        <div className={hasNacPerfil ? "lg:col-span-8" : "lg:col-span-12"}>
          <ProgressBarChartCard title="Por Campo" icon={BarChart3} iconClass="text-blue-500" contentAutoHeight>
            <AnimatePresence mode="wait">
              <motion.div key={`campos-${filterKey}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {selectedCampoIds.size === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold py-8 text-center">Marca al menos un campo para ver el resumen.</p>
                ) : (
                  <ProgressBarList items={campoProgressItems} />
                )}
              </motion.div>
            </AnimatePresence>
          </ProgressBarChartCard>
        </div>
      </div>

      {selectedCampoIds.size > 0 && hasNacPerfil && (
        <div className="space-y-6">
          <CampoDimensionMatrix
            title="Campos × Nacionalidad"
            cornerLabel="Campo ↓ / Nacionalidad →"
            campos={crossCampoNac.campos}
            colIds={crossCampoNac.colIds}
            grid={crossCampoNac.grid}
            getColLabel={crossCampoNac.getColLabel}
            accentClass="text-amber-600 dark:text-amber-400"
            onExportExcel={() =>
              downloadSingleSheet(
                buildCampoDimensionCrossRows(crossCampoNac),
                "campos-nacionalidad.xlsx",
                "Campos x Nacionalidad"
              )
            }
          />
          <CampoDimensionMatrix
            title="Campos × Perfil"
            cornerLabel="Campo ↓ / Perfil →"
            campos={crossCampoPerfil.campos}
            colIds={crossCampoPerfil.colIds}
            grid={crossCampoPerfil.grid}
            getColLabel={crossCampoPerfil.getColLabel}
            onExportExcel={() =>
              downloadSingleSheet(
                buildCampoDimensionCrossRows(crossCampoPerfil),
                "campos-perfil.xlsx",
                "Campos x Perfil"
              )
            }
          />
        </div>
      )}

      <OmiteNacPerfilCrossBlock rows={filteredRows} />
    </>
  );

  if (embedded) {
    return <div className="space-y-6">{inner}</div>;
  }

  return (
    <div data-report-export-block className="bg-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-5 xl:p-6 w-full min-w-0 space-y-6">
      {inner}
    </div>
  );
}

function policyDescriptionStart(text: string, maxLen = 90): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen).trim()}…`;
}

function PoliticaInfoCard({
  politica,
  fullDescription = false,
}: {
  politica: { codigo: string; descripcion: string };
  fullDescription?: boolean;
}) {
  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <div className="w-1.5 min-h-10 bg-blue-600 rounded-full shrink-0 self-stretch" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-blue-600 dark:text-blue-400">{politica.codigo}</p>
          <p
            className={`text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug ${
              fullDescription ? "" : "line-clamp-3"
            }`}
          >
            {politica.descripcion}
          </p>
        </div>
      </div>
    </div>
  );
}

function PoliticaPickerCard({
  politica,
  onClick,
}: {
  politica: { codigo: string; descripcion: string } | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden text-left cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="w-1.5 min-h-10 bg-blue-600 rounded-full shrink-0 self-stretch" />
        <div className="flex-1 min-w-0">
          {politica ? (
            <>
              <p className="text-sm font-black text-blue-600 dark:text-blue-400">{politica.codigo}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug line-clamp-3">
                {politica.descripcion}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-black text-slate-500">Seleccionar política</p>
              <p className="text-xs text-slate-400 mt-1">Elija una política de migración para ver el detalle</p>
            </>
          )}
        </div>
        <ChevronDown className="w-5 h-5 shrink-0 text-slate-400 mt-0.5" />
      </div>
    </button>
  );
}

function PoliticaPickerModal({
  isOpen,
  onClose,
  politicas,
  selectedId,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  politicas: { id: string; codigo: string; descripcion: string }[];
  selectedId: string | null;
  onApply: (id: string) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {isOpen ? (
        <PoliticaPickerModalBody
          key={selectedId ?? "none"}
          onClose={onClose}
          politicas={politicas}
          selectedId={selectedId}
          onApply={onApply}
        />
      ) : null}
    </Dialog>
  );
}

function PoliticaPickerModalBody({
  onClose,
  politicas,
  selectedId,
  onApply,
}: {
  onClose: () => void;
  politicas: { id: string; codigo: string; descripcion: string }[];
  selectedId: string | null;
  onApply: (id: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(selectedId);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return politicas;
    return politicas.filter(
      (p) =>
        p.codigo.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q)
    );
  }, [politicas, search]);

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Seleccionar política de migración</DialogTitle>
        <DialogDescription>
          Elija una política para ver el cruce de datos y el detalle por indicador.
        </DialogDescription>
      </DialogHeader>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
        />
      </div>

      <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-slate-400 font-semibold">
            {search.trim() ? "Sin resultados" : "No hay políticas disponibles"}
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((pol) => {
              const checked = draft === pol.id;
              return (
                <button
                  key={pol.id}
                  type="button"
                  onClick={() => setDraft(pol.id)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                    checked
                      ? "bg-slate-100 dark:bg-slate-800/50"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  }`}
                >
                  <span
                    className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${
                      checked
                        ? "bg-slate-600 dark:bg-slate-500 border-slate-600 dark:border-slate-500"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {checked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-blue-600 dark:text-blue-400">
                      {pol.codigo}
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {policyDescriptionStart(pol.descripcion, 120)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!draft}
          onClick={() => draft && onApply(draft)}
          className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Aplicar
        </button>
      </div>
    </DialogContent>
  );
}

function IndicadorReferenciaTable({
  indicadores,
}: {
  indicadores: { id: string; nombre: string }[];
}) {
  if (indicadores.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/50 rounded-t-2xl">
        <Table2 className="w-4 h-4 text-blue-500 shrink-0" />
        <h5 className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex-1 min-w-0">
          Referencia de indicadores
        </h5>
      </div>
      <div className="overflow-x-auto rounded-b-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider w-24">
                Código
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Indicador
              </th>
            </tr>
          </thead>
          <tbody>
            {indicadores.map((ind, i) => (
              <tr
                key={ind.id}
                className={`border-b border-slate-50 dark:border-slate-800/50 last:border-0 ${
                  i % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/50 dark:bg-slate-900/30"
                }`}
              >
                <td className="px-4 py-2.5 font-black text-blue-600 dark:text-blue-400 whitespace-nowrap align-top">
                  Ind. {i + 1}
                </td>
                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 leading-snug align-top">
                  {ind.nombre}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Por política + detalle por indicador ─── */

export function ReportPoliticaIndicadorSection({ rows }: { rows: ReportRow[] }) {
  const politicas = useMemo(() => getPoliticasEnDatos(rows), [rows]);
  const [selectedPoliticaId, setSelectedPoliticaId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const effectivePoliticaId = useMemo(() => {
    if (politicas.length === 0) return null;
    if (selectedPoliticaId && politicas.some((p) => p.id === selectedPoliticaId)) {
      return selectedPoliticaId;
    }
    return politicas[0].id;
  }, [politicas, selectedPoliticaId]);

  const selectedPolitica = useMemo(
    () => politicas.find((p) => p.id === effectivePoliticaId) ?? null,
    [politicas, effectivePoliticaId]
  );

  const polRows = useMemo(
    () => (effectivePoliticaId ? rows.filter((r) => r.politicaId === effectivePoliticaId) : []),
    [rows, effectivePoliticaId]
  );

  const camposPolitica = useMemo(() => getAvailableCampos(polRows), [polRows]);

  const crossCampoIndPolitica = useMemo(
    () => buildReportCampoDimensionCross(polRows, camposPolitica, "indicador"),
    [polRows, camposPolitica]
  );

  const indicadoresPolitica = useMemo(
    () =>
      crossCampoIndPolitica.colIds.map((id) => ({
        id,
        nombre: crossCampoIndPolitica.getColLabel(id),
      })),
    [crossCampoIndPolitica]
  );

  const allPoliticaCross = useMemo(
    () =>
      politicas
        .map((pol) => {
          const pr = rows.filter((r) => r.politicaId === pol.id);
          const campos = getAvailableCampos(pr);
          const cross = buildReportCampoDimensionCross(pr, campos, "indicador");
          const indicadores = cross.colIds.map((id) => ({
            id,
            nombre: cross.getColLabel(id),
          }));
          return { politica: pol, cross, indicadores };
        })
        .filter((p) => p.cross.colIds.length > 0),
    [rows, politicas]
  );

  if (politicas.length === 0) return null;

  const sectionTitle = (
    <div className="flex items-center gap-3 px-1">
      <div className="w-2 h-7 bg-blue-600 rounded-full shrink-0" />
      <h3 className="text-base font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
        Por política de migración
      </h3>
    </div>
  );

  return (
    <div className="w-full space-y-8">
      <div className="report-export-hide space-y-4">
        {sectionTitle}

        <PoliticaPickerCard
          politica={selectedPolitica}
          onClick={() => setModalOpen(true)}
        />

        {polRows.length > 0 && crossCampoIndPolitica.colIds.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <ReportExcelButton
                label="Excel"
                onClick={() =>
                  downloadCampoIndicadorExcel(
                    crossCampoIndPolitica,
                    indicadoresPolitica,
                    selectedPolitica?.codigo ?? "politica"
                  )
                }
              />
            </div>
            <CampoDimensionMatrix
              title="Campos × Indicador"
              cornerLabel="Campo ↓ / Indicador →"
              campos={crossCampoIndPolitica.campos}
              colIds={crossCampoIndPolitica.colIds}
              grid={crossCampoIndPolitica.grid}
              getColLabel={crossCampoIndPolitica.getColLabel}
              shortColLabels
            />
            <IndicadorReferenciaTable indicadores={indicadoresPolitica} />
          </div>
        )}
      </div>

      <div className="report-export-only hidden space-y-6">
        {sectionTitle}
        {allPoliticaCross.map(({ politica, cross, indicadores }) => (
          <div key={politica.id} data-report-export-block className="space-y-4">
            <PoliticaInfoCard politica={politica} fullDescription />
            <CampoDimensionMatrix
              title="Campos × Indicador"
              cornerLabel="Campo ↓ / Indicador →"
              campos={cross.campos}
              colIds={cross.colIds}
              grid={cross.grid}
              getColLabel={cross.getColLabel}
              shortColLabels
            />
            <IndicadorReferenciaTable indicadores={indicadores} />
          </div>
        ))}
      </div>

      <ReportIndicadorDetailSection rows={polRows} />

      <PoliticaPickerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        politicas={politicas}
        selectedId={effectivePoliticaId}
        onApply={(id) => {
          setSelectedPoliticaId(id);
          setModalOpen(false);
        }}
      />
    </div>
  );
}

/* ─── Detalle por indicador ─── */

export function ReportIndicadorDetailSection({ rows }: { rows: ReportRow[] }) {
  const indicadores = useMemo(() => getIndicadoresEnUso(rows), [rows]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (indicadores.length === 0) return null;

  return (
    <div className="w-full space-y-3 report-export-hide">
      {indicadores.map((ind, indIdx) => {
        const indRows = rows.filter((r) => r.indicadorId === ind.id);
        const omite = indicadorOmiteNacPerfil(indRows);
        const crossRows = aggregateReportByNacPerfil(indRows);
        const campos = getCampoTotalsForIndicador(indRows);
        const maxCampoTotal = Math.max(...campos.map((c) => c.total), 1);
        const nacTotals = buildNacTotalsMap(indRows);
        const nacSorted = Array.from(nacTotals.values())
          .filter((d) => d.value > 0)
          .sort((a, b) => b.value - a.value);
        let nacOtherIdx = 0;
        const nacDonut: ReportChartSlice[] = nacSorted.map((d) => ({
          ...d,
          color: isGuatemalteco(d.name)
            ? GUATEMALTECO_CELESTE
            : nationalityColor(d.name, nacOtherIdx++),
        }));
        const isOpen = expandedId === ind.id;

        return (
          <div key={ind.id} className="space-y-3">
            {indIdx === 0 && (
              <div className="flex items-center gap-3 px-1">
                <div className="w-2 h-7 bg-blue-600 rounded-full shrink-0" />
                <h3 className="text-base font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                  Detalle por indicador
                </h3>
              </div>
            )}
            <div
              className={`rounded-2xl border overflow-hidden ${
              isOpen ? "border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900/50" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
            }`}
          >
            <button
              type="button"
              onClick={() => setExpandedId(isOpen ? null : ind.id)}
              className="w-full flex items-start gap-3 p-4 text-left cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              aria-expanded={isOpen}
            >
              <div className="w-1.5 min-h-10 bg-blue-600 rounded-full shrink-0 self-stretch" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-black text-slate-800 dark:text-slate-200 leading-snug ${isOpen ? "" : "line-clamp-2"}`}>
                  {ind.nombre}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">
                  {omite
                    ? `${OMITE_NAC_PERFIL_SECTION_TITLE} — sin nacionalidad/perfil`
                    : `${crossRows.length} ${crossRows.length === 1 ? "combinación" : "combinaciones"}`}
                </p>
              </div>
              <ChevronDown className={`w-5 h-5 shrink-0 text-slate-400 transition-transform mt-0.5 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-6 space-y-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex justify-end report-export-hide">
                      <ReportExcelButton
                        label="Excel"
                        onClick={() => downloadIndicadorDetailExcel(ind.nombre, indRows)}
                      />
                    </div>

                    {!omite && <NacPerfilMatrix rows={indRows} />}

                    <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <Table2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest flex-1 min-w-0">
                          Resumen cruzado por campos
                        </h5>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                              {!omite && (
                                <>
                                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Nacionalidad</th>
                                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Perfil</th>
                                </>
                              )}
                              {campos.map((c) => (
                                <th key={c.id} className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                  {c.nombre}
                                </th>
                              ))}
                              <th className="px-4 py-3 text-right text-[10px] font-black text-blue-500 uppercase tracking-wider">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {omite ? (
                              <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-200 dark:border-blue-800">
                                <td className="px-4 py-3 font-black text-xs text-slate-500 uppercase tracking-wider">Totales</td>
                                {campos.map((c) => (
                                  <td key={c.id} className="px-4 py-3 text-right font-black text-slate-800 dark:text-slate-200">{c.total}</td>
                                ))}
                                <td className="px-4 py-3 text-right font-black text-blue-700 dark:text-blue-400 text-base">
                                  {campos.reduce((s, c) => s + c.total, 0)}
                                </td>
                              </tr>
                            ) : (
                              <>
                                {crossRows.map((row, rIdx) => {
                                  const nacLabel = indRows.find((r) => (r.nacionalidadId || "__none__") === row.nacionalidadId)?.nacionalidadNombre || "Sin especificar";
                                  const perfLabel = indRows.find((r) => (r.perfilId || "__none__") === row.perfilId)?.perfilNombre || "Sin especificar";
                                  const rowTotal = Object.values(row.valores).reduce((s, v) => s + v, 0);
                                  return (
                                    <tr key={`${row.nacionalidadId}-${row.perfilId}`} className={`border-b border-slate-50 dark:border-slate-800/50 ${rIdx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/50 dark:bg-slate-900/30"}`}>
                                      <td className="px-4 py-2.5 font-semibold text-amber-600 dark:text-amber-400">{nacLabel}</td>
                                      <td className="px-4 py-2.5 font-semibold text-blue-600 dark:text-blue-400">{perfLabel}</td>
                                      {campos.map((c) => (
                                        <td key={c.id} className="px-4 py-2.5 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                          {row.valores[c.id] ?? 0}
                                        </td>
                                      ))}
                                      <td className="px-4 py-2.5 text-right font-black text-blue-600">{rowTotal}</td>
                                    </tr>
                                  );
                                })}
                                <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-200 dark:border-blue-800">
                                  <td colSpan={2} className="px-4 py-3 font-black text-xs text-slate-500 uppercase tracking-wider">Totales</td>
                                  {campos.map((c) => (
                                    <td key={c.id} className="px-4 py-3 text-right font-black text-slate-800 dark:text-slate-200">{c.total}</td>
                                  ))}
                                  <td className="px-4 py-3 text-right font-black text-blue-700 dark:text-blue-400 text-base">
                                    {campos.reduce((s, c) => s + c.total, 0)}
                                  </td>
                                </tr>
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className={`grid grid-cols-1 gap-6 items-stretch ${omite ? "" : "md:grid-cols-2"}`}>
                      <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-blue-500" />
                          <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">Por Campo</h5>
                        </div>
                        <div className="space-y-4">
                          {campos.map((c, cIdx) => {
                            const pct = (c.total / maxCampoTotal) * 100;
                            const barColor = softBarColor(cIdx);
                            return (
                              <div key={c.id} className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[70%]">{c.nombre}</span>
                                  <span className="text-xs font-black text-slate-900 dark:text-white">{c.total}</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut", delay: cIdx * 0.1 }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: barColor }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {!omite && (
                        <DonutChartCard
                          key={`ind-nac-${ind.id}`}
                          title="Por Nacionalidad"
                          icon={Users}
                          iconClass="text-amber-500"
                          data={nacDonut}
                          chartKey={`ind-nac-${ind.id}`}
                          size="lg"
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}

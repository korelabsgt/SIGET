"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ChevronLeft,
  Calendar,
  PieChart as PieChartIcon,
  Users,
  Building2,
  BarChart3,
  Loader2,
  TrendingUp,
  Filter,
  Check,
  Search,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getReportData,
  getReportSectores,
  getReportOrganizaciones,
  getReportPoliticas,
  type ReportRow,
} from "./lib/reportes-actions";
import {
  ReportGlobalCrossSection,
  ReportPoliticaIndicadorSection,
} from "./ReportCrossSections";
import { rowsConNacPerfil, rowsOmiteNacPerfil } from "./lib/cross-report-lib";
import { ReportExcelButton } from "./ReportExcelButton";
import { ReportExportHeader } from "./ReportExportHeader";
import {
  buildOrgSummaryRows,
  downloadCompleteReportExcel,
  downloadSingleSheet,
} from "./lib/reportes-excel";
import { DownloadMenu, type DownloadMenuOption } from "./DownloadMenu";
import {
  downloadNodeAsJpeg,
  downloadNodeAsPdf,
  printNode,
} from "./lib/reportes-export";

/* ──────────────────────────────────────────────────────────────
   Constants & Helpers
   ────────────────────────────────────────────────────────────── */

import {
  GUATEMALTECO_CELESTE,
  chartColor,
  isGuatemalteco,
  nationalityColor,
  perfilColor,
  softBarColor,
} from "./lib/chart-colors";

const MONTH_NAMES = [
  "", "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const MONTH_FULL = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const SIN_ESPECIFICAR_LABEL = "Sin especificar";

function sortNacionalidadNames(names: string[], totals?: Map<string, number>): string[] {
  return [...names].sort((a, b) => {
    if (a === SIN_ESPECIFICAR_LABEL) return -1;
    if (b === SIN_ESPECIFICAR_LABEL) return 1;
    if (totals) return (totals.get(b) ?? 0) - (totals.get(a) ?? 0);
    return a.localeCompare(b, "es");
  });
}

const tooltipStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  color: "#0f172a",
  fontSize: "12px",
  fontWeight: 600,
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-GT").format(n);
}

/** Ancho del eje Y según la etiqueta más larga (evita hueco a la izquierda en barras horizontales) */
function truncateLabel(label: string, maxLen = 32): string {
  return label.length > maxLen ? `${label.slice(0, maxLen)}…` : label;
}

type FilterModalKind = "politica" | "sector" | "org";

interface FilterPickerItem {
  id: string;
  label: string;
  sublabel?: string;
}

interface FilterPickerGroup {
  groupId: string;
  groupLabel: string;
  items: FilterPickerItem[];
}

function policyDescriptionStart(text: string, maxLen = 90): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen).trim()}…`;
}

function filterButtonSubtitle(
  selectedIds: string[],
  items: { id: string; label: string }[],
  allLabel: string
): string {
  if (selectedIds.length === 0) return allLabel;
  if (selectedIds.length === 1) {
    const item = items.find((i) => i.id === selectedIds[0]);
    return item ? truncateLabel(item.label, 28) : "1 seleccionado";
  }
  return `${selectedIds.length} seleccionados`;
}

function currentMonthInputValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/* ──────────────────────────────────────────────────────────────
   Interfaces
   ────────────────────────────────────────────────────────────── */

interface ReportesProps {
  onBack: () => void;
}

interface CatalogItem {
  id: string;
  nombre: string;
}

interface PoliticaItem {
  id: string;
  codigo: string;
  descripcion: string;
  sector_id: string;
}

/* ──────────────────────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────────────────────── */

export default function Reportes({ onBack }: ReportesProps) {
  // ── Data state ──
  const [allRows, setAllRows] = useState<ReportRow[]>([]);
  const [sectores, setSectores] = useState<CatalogItem[]>([]);
  const [organizaciones, setOrganizaciones] = useState<CatalogItem[]>([]);
  const [politicas, setPoliticas] = useState<PoliticaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filter state ──
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([]);
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [selectedPoliticaIds, setSelectedPoliticaIds] = useState<string[]>([]);
  const [openFilterModal, setOpenFilterModal] = useState<FilterModalKind | null>(null);
  const [dateMode, setDateMode] = useState<"Año" | "Mes" | "Rango" | "Todo">("Año");
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [singleMonth, setSingleMonth] = useState(currentMonthInputValue);
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");

  // ── Chart tab state ──
  const [activeChartTab, setActiveChartTab] = useState<"campos" | "nacionalidad" | "perfil" | "todo">("campos");

  // ── Estado animación reset ──
  const [isResetting, setIsResetting] = useState(false);

  // ── Refs para captura (PDF / JPEG) ──
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [isMobileExport, setIsMobileExport] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobileExport(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // ── Load data ──
  useEffect(() => {
    async function load() {
      try {
        const [rows, secs, orgs, pols] = await Promise.all([
          getReportData(),
          getReportSectores(),
          getReportOrganizaciones(),
          getReportPoliticas(),
        ]);
        setAllRows(rows);
        setSectores(secs);
        setOrganizaciones(orgs);
        setPoliticas(pols);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Filtered organizations & politicas based on sector ──
  const filteredOrgs = useMemo(() => {
    if (selectedSectorIds.length === 0) return organizaciones;
    const orgIds = new Set(
      allRows.filter((r) => selectedSectorIds.includes(r.sectorId)).map((r) => r.organizacionId)
    );
    return organizaciones.filter((o) => orgIds.has(o.id));
  }, [organizaciones, allRows, selectedSectorIds]);


  const politicaPickerGroups = useMemo<FilterPickerGroup[]>(() => {
    if (selectedSectorIds.length === 0) return [];

    return selectedSectorIds
      .map((sectorId) => {
        const sector = sectores.find((s) => s.id === sectorId);
        const items = politicas
          .filter((p) => p.sector_id === sectorId)
          .sort((a, b) => a.codigo.localeCompare(b.codigo, "es"))
          .map((p) => ({
            id: p.id,
            label: p.codigo,
            sublabel: policyDescriptionStart(p.descripcion),
          }));

        return {
          groupId: sectorId,
          groupLabel: sector?.nombre ?? "Sector",
          items,
        };
      })
      .filter((g) => g.items.length > 0);
  }, [selectedSectorIds, sectores, politicas]);

  const politicaPickerItems = useMemo<FilterPickerItem[]>(
    () => politicaPickerGroups.flatMap((g) => g.items),
    [politicaPickerGroups]
  );

  const sectorPickerItems = useMemo<FilterPickerItem[]>(
    () => sectores.map((s) => ({ id: s.id, label: s.nombre })),
    [sectores]
  );

  const orgPickerItems = useMemo<FilterPickerItem[]>(
    () => filteredOrgs.map((o) => ({ id: o.id, label: o.nombre })),
    [filteredOrgs]
  );

  // ── Available years from data ──
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    for (const r of allRows) yearSet.add(r.anio);
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [allRows]);

  const effectiveYear = useMemo(() => {
    if (availableYears.length === 0) return selectedYear;
    return availableYears.includes(selectedYear) ? selectedYear : availableYears[0];
  }, [availableYears, selectedYear]);

  // ── Apply all filters ──
  const filteredRows = useMemo(() => {
    let rows = allRows;

    if (selectedSectorIds.length > 0) {
      rows = rows.filter((r) => selectedSectorIds.includes(r.sectorId));
    }
    if (selectedOrgIds.length > 0) {
      rows = rows.filter((r) => selectedOrgIds.includes(r.organizacionId));
    }
    if (selectedPoliticaIds.length > 0) {
      rows = rows.filter((r) => selectedPoliticaIds.includes(r.politicaId));
    }

    if (dateMode === "Año") {
      rows = rows.filter(r => r.anio === effectiveYear);
    } else if (dateMode === "Mes" && singleMonth) {
      const [y, m] = singleMonth.split("-").map(Number);
      rows = rows.filter(r => r.anio === y && r.mes === m);
    } else if (dateMode === "Rango" && startMonth && endMonth) {
      const [sy, sm] = startMonth.split("-").map(Number);
      const [ey, em] = endMonth.split("-").map(Number);
      const startVal = sy * 12 + sm;
      const endVal = ey * 12 + em;
      rows = rows.filter(r => {
        const val = r.anio * 12 + r.mes;
        return val >= startVal && val <= endVal;
      });
    }

    return rows;
  }, [allRows, selectedSectorIds, selectedOrgIds, selectedPoliticaIds, dateMode, effectiveYear, singleMonth, startMonth, endMonth]);

  // Filas que aplican a nacionalidad/perfil (excluye Reuniones/Empresas/Actores).
  const nacPerfilRows = useMemo(() => rowsConNacPerfil(filteredRows), [filteredRows]);
  const omitRows = useMemo(() => rowsOmiteNacPerfil(filteredRows), [filteredRows]);
  const hasOmiteNacPerfil = omitRows.length > 0;
  const hasNacPerfilData = nacPerfilRows.length > 0;

  // ── KPIs ──
  const kpis = useMemo(() => {
    const totalAtenciones = filteredRows.reduce((s, r) => s + r.cantidad, 0);
    const totalRegistros = new Set(filteredRows.map(r => r.registroId)).size;
    const totalOrgs = new Set(filteredRows.map(r => r.organizacionId)).size;
    return { totalAtenciones, totalRegistros, totalOrgs };
  }, [filteredRows]);

  // ── Donut chart data by different dimensions ──
  const campoDonutData = useMemo(() => {
    const map = new Map<string, { nombre: string; total: number; orden: number }>();
    for (const r of nacPerfilRows) {
      const key = r.campoId;
      const existing = map.get(key);
      if (existing) {
        existing.total += r.cantidad;
      } else {
        map.set(key, { nombre: r.campoNombre, total: r.cantidad, orden: r.campoOrden });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => a.orden - b.orden)
      .map((d, i) => ({ name: d.nombre, value: d.total, color: softBarColor(i) }));
  }, [nacPerfilRows]);

  const omitIndicadorDonutData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of omitRows) {
      map.set(r.indicadorNombre, (map.get(r.indicadorNombre) || 0) + r.cantidad);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: softBarColor(i) }));
  }, [omitRows]);

  const omitCampoDonutData = useMemo(() => {
    const map = new Map<string, { nombre: string; total: number; orden: number }>();
    for (const r of omitRows) {
      const key = r.campoId;
      const existing = map.get(key);
      if (existing) {
        existing.total += r.cantidad;
      } else {
        map.set(key, { nombre: r.campoNombre, total: r.cantidad, orden: r.campoOrden });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => a.orden - b.orden)
      .map((d, i) => ({ name: d.nombre, value: d.total, color: softBarColor(i) }));
  }, [omitRows]);

  const nacDonutData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of nacPerfilRows) {
      const key = r.nacionalidadNombre || "Sin especificar";
      map.set(key, (map.get(key) || 0) + r.cantidad);
    }
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    let otherIdx = 0;
    return sorted.map(([name, value]) => ({
      name,
      value,
      color: isGuatemalteco(name) ? GUATEMALTECO_CELESTE : nationalityColor(name, otherIdx++),
    }));
  }, [nacPerfilRows]);

  const perfilDonutData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of nacPerfilRows) {
      const key = r.perfilNombre || "Sin especificar";
      map.set(key, (map.get(key) || 0) + r.cantidad);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: perfilColor(i) }));
  }, [nacPerfilRows]);

  const activeDonutData = activeChartTab === "campos" ? campoDonutData
    : activeChartTab === "nacionalidad" ? nacDonutData
    : perfilDonutData;

  const activeDonutTotal = activeDonutData.reduce((s, d) => s + d.value, 0);

  // ── Bar chart: by organization ──
  const orgBarData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filteredRows) {
      map.set(r.organizacionNombre, (map.get(r.organizacionNombre) || 0) + r.cantidad);
    }
    return Array.from(map.entries())
      .map(([org, total]) => ({ org, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredRows]);

  // ── Tendencia mensual apilada: registros + nacionalidades por mes ──
  const monthlyStackChart = useMemo(() => {
    // El apilado por nacionalidad excluye Reuniones/Empresas/Actores; los
    // registros (línea) siguen contando todas las filas.
    const nacTotals = new Map<string, number>();
    for (const r of nacPerfilRows) {
      const n = r.nacionalidadNombre || "Sin especificar";
      nacTotals.set(n, (nacTotals.get(n) || 0) + r.cantidad);
    }
    const nacNames = sortNacionalidadNames(
      Array.from(nacTotals.keys()),
      nacTotals
    );

    type MonthRow = Record<string, number | string>;
    const monthMap = new Map<string, MonthRow>();
    const registroSets = new Map<string, Set<string>>();

    const ensureMonthRow = (r: ReportRow) => {
      const key = `${r.anio}-${String(r.mes).padStart(2, "0")}`;
      if (!monthMap.has(key)) {
        const row: MonthRow = {
          key,
          label: `${MONTH_NAMES[r.mes]} ${r.anio}`,
          sortVal: r.anio * 100 + r.mes,
          registros: 0,
        };
        for (const n of nacNames) row[n] = 0;
        monthMap.set(key, row);
        registroSets.set(key, new Set());
      }
      return key;
    };

    for (const r of filteredRows) {
      const key = ensureMonthRow(r);
      registroSets.get(key)!.add(r.registroId);
    }

    for (const r of nacPerfilRows) {
      const key = ensureMonthRow(r);
      const nac = r.nacionalidadNombre || "Sin especificar";
      const row = monthMap.get(key)!;
      row[nac] = Number(row[nac]) + r.cantidad;
    }

    for (const [key, set] of registroSets) {
      const row = monthMap.get(key);
      if (row) row.registros = set.size;
    }

    const data = Array.from(monthMap.values()).sort(
      (a, b) => Number(a.sortVal) - Number(b.sortVal)
    );

    const indicatorTotals: Record<string, number> = { registros: 0 };
    for (const n of nacNames) indicatorTotals[n] = 0;
    for (const row of data) {
      indicatorTotals.registros += Number(row.registros ?? 0);
      for (const n of nacNames) {
        indicatorTotals[n] += Number(row[n] ?? 0);
      }
    }

    return { data, nacNames, indicatorTotals };
  }, [filteredRows, nacPerfilRows]);

  const monthlyNacColors = useMemo(() => {
    let otherIdx = 0;
    return monthlyStackChart.nacNames.map((name) =>
      isGuatemalteco(name) ? GUATEMALTECO_CELESTE : nationalityColor(name, otherIdx++)
    );
  }, [monthlyStackChart.nacNames]);

  // ── Bar chart: by organization ──
  const orgSummaryData = useMemo(() => {
    const map = new Map<string, {
      sectorNombre: string;
      orgNombre: string;
      total: number;
      campos: Map<string, number>;
    }>();

    // Collect unique campo names in order
    const campoNamesOrdered: string[] = [];
    const campoNameSet = new Set<string>();

    for (const r of filteredRows) {
      const key = r.organizacionId;
      const existing = map.get(key);
      if (existing) {
        existing.total += r.cantidad;
        existing.campos.set(r.campoNombre, (existing.campos.get(r.campoNombre) || 0) + r.cantidad);
      } else {
        const campos = new Map<string, number>();
        campos.set(r.campoNombre, r.cantidad);
        map.set(key, {
          sectorNombre: r.sectorNombre,
          orgNombre: r.organizacionNombre,
          total: r.cantidad,
          campos,
        });
      }
      if (!campoNameSet.has(r.campoNombre)) {
        campoNameSet.add(r.campoNombre);
        campoNamesOrdered.push(r.campoNombre);
      }
    }

    const rows = Array.from(map.values()).sort((a, b) => {
      const isUnspecifiedA = a.sectorNombre.toLowerCase().includes("sin especificar") || a.orgNombre.toLowerCase().includes("sin especificar");
      const isUnspecifiedB = b.sectorNombre.toLowerCase().includes("sin especificar") || b.orgNombre.toLowerCase().includes("sin especificar");
      if (isUnspecifiedA && !isUnspecifiedB) return 1;
      if (!isUnspecifiedA && isUnspecifiedB) return -1;
      return b.total - a.total;
    });
    return { rows, campoNames: campoNamesOrdered };
  }, [filteredRows]);

  const applySectorFilter = useCallback(
    (ids: string[]) => {
      setSelectedSectorIds(ids);
      if (ids.length === 0) {
        setSelectedPoliticaIds([]);
        return;
      }
      const validOrgIds = new Set(
        allRows.filter((r) => ids.includes(r.sectorId)).map((r) => r.organizacionId)
      );
      setSelectedOrgIds((prev) => prev.filter((id) => validOrgIds.has(id)));
      const validPolIds = new Set(
        politicas.filter((p) => ids.includes(p.sector_id)).map((p) => p.id)
      );
      setSelectedPoliticaIds((prev) => prev.filter((id) => validPolIds.has(id)));
    },
    [allRows, politicas]
  );

  const dateFilterLabel = useMemo(() => {
    if (dateMode === "Año") return `${effectiveYear}`;
    if (dateMode === "Mes" && singleMonth) {
      const [y, m] = singleMonth.split("-").map(Number);
      return `${MONTH_FULL[m]} ${y}`;
    }
    if (dateMode === "Rango" && startMonth && endMonth) {
      const [sy, sm] = startMonth.split("-").map(Number);
      const [ey, em] = endMonth.split("-").map(Number);
      return `${MONTH_NAMES[sm]} ${sy} – ${MONTH_NAMES[em]} ${ey}`;
    }
    return null;
  }, [dateMode, effectiveYear, singleMonth, startMonth, endMonth]);

  const exportDateLabel = useMemo(() => {
    if (dateMode === "Año") return `${effectiveYear}`;
    if (dateMode === "Mes" && singleMonth) {
      const [y, m] = singleMonth.split("-").map(Number);
      return `${MONTH_FULL[m]} ${y}`;
    }
    if (dateMode === "Rango" && startMonth && endMonth) {
      const [sy, sm] = startMonth.split("-").map(Number);
      const [ey, em] = endMonth.split("-").map(Number);
      return `${MONTH_FULL[sm]} ${sy} – ${MONTH_FULL[em]} ${ey}`;
    }
    return "Todo el periodo";
  }, [dateMode, effectiveYear, singleMonth, startMonth, endMonth]);

  const modalConfig = useMemo(() => {
    if (openFilterModal === "politica") {
      return {
        title: "Filtrar por política de migración",
        description:
          selectedSectorIds.length === 0
            ? "Primero seleccione uno o más sectores."
            : "Políticas de migración disponibles según los sectores elegidos.",
        groups: politicaPickerGroups,
        items: [] as FilterPickerItem[],
        selectedIds: selectedPoliticaIds,
        onApply: setSelectedPoliticaIds,
        wide: true,
        emptyMessage:
          selectedSectorIds.length === 0
            ? "Seleccione al menos un sector para ver las políticas de migración."
            : "No hay políticas de migración activas en los sectores seleccionados.",
      };
    }
    if (openFilterModal === "sector") {
      return {
        title: "Filtrar por sector",
        description: "Seleccione uno o varios sectores. Las políticas de migración dependen de esta selección.",
        groups: [] as FilterPickerGroup[],
        items: sectorPickerItems,
        selectedIds: selectedSectorIds,
        onApply: applySectorFilter,
        wide: false,
        emptyMessage: "No hay sectores disponibles.",
      };
    }
    if (openFilterModal === "org") {
      return {
        title: "Filtrar por organización",
        description: "Seleccione una o varias organizaciones.",
        groups: [] as FilterPickerGroup[],
        items: orgPickerItems,
        selectedIds: selectedOrgIds,
        onApply: setSelectedOrgIds,
        wide: false,
        emptyMessage: "No hay organizaciones para los sectores seleccionados.",
      };
    }
    return null;
  }, [
    openFilterModal,
    politicaPickerGroups,
    sectorPickerItems,
    orgPickerItems,
    selectedPoliticaIds,
    selectedSectorIds,
    selectedOrgIds,
    applySectorFilter,
  ]);

  const downloadOptions = useMemo(
    () =>
      buildDownloadOptions({
        filteredRows,
        getNode: () => reportContentRef.current,
        isMobile: isMobileExport,
      }),
    [filteredRows, isMobileExport]
  );

  /* ──────────────────────────────────────────────────────────────
     RENDER
     ────────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        <p className="text-sm font-bold text-slate-500">Cargando reportes...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-sm font-bold text-red-500">Error: {error}</p>
        <button onClick={onBack} className="px-6 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm cursor-pointer">Volver</button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full min-w-0 max-w-none pb-10 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-2 flex-wrap">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl bg-card border border-border hover:bg-muted transition-colors shadow-sm cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Análisis de Datos</h2>
          <p className="text-xs sm:text-sm text-slate-500">Reportes y cruce de variables del observatorio</p>
        </div>
        {filteredRows.length > 0 && (
          <DownloadMenu
            label="Descargar"
            options={downloadOptions}
          />
        )}
      </div>

      {/* ═══ FILTERS ═══ */}
      <div className="bg-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 md:p-4">

        {/* Fila principal: título + switch + selector de fecha inline */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Ícono de filtro */}
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />

          <div className="w-px h-5 bg-border/60 hidden sm:block shrink-0" />

          {/* Switch Año | Mes | Rango | Todo | Restablecer */}
          <div className="flex w-full sm:w-auto bg-muted/70 dark:bg-muted/30 p-1 rounded-xl border border-border/40 shrink-0 items-center">
            {(["Año", "Mes", "Rango", "Todo"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setDateMode(mode)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  dateMode === mode
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-muted/50"
                }`}
              >
                {mode}
              </button>
            ))}
            <div className="w-px h-4 bg-border/60 mx-0.5 shrink-0" />
            <button
              onClick={() => {
                setIsResetting(true);
                setSingleMonth(currentMonthInputValue);
                setStartMonth("");
                setEndMonth("");
                setSelectedSectorIds([]);
                setSelectedOrgIds([]);
                setSelectedPoliticaIds([]);
                setTimeout(() => setIsResetting(false), 500);
              }}
              className="flex-1 sm:flex-none flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer shrink-0"
              title="Restablecer filtros"
            >
              <RotateCcw className={`w-3 h-3 transition-transform ${isResetting ? "animate-spin" : ""}`} />
              <span className="text-[8px] font-bold leading-none">Restablecer</span>
            </button>
          </div>

          {/* Selector inline: solo Mes y Rango */}
          <AnimatePresence mode="wait">
            {dateMode === "Mes" && (
              <motion.div key="mes" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden shrink-0">
                <div className="relative flex items-center">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none z-10" />
                  {!singleMonth && (
                    <span className="absolute left-8 text-slate-400 text-xs font-bold pointer-events-none z-10 whitespace-nowrap">Seleccionar mes</span>
                  )}
                  <input
                    type="month"
                    value={singleMonth}
                    onChange={(e) => setSingleMonth(e.target.value)}
                    className={`pl-8 pr-3 py-1.5 rounded-xl border border-border bg-muted/40 dark:bg-background text-xs font-bold focus:outline-none focus:ring-2 focus:ring-muted-foreground/30 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${singleMonth ? "text-foreground" : "text-transparent"}`}
                  />
                </div>
              </motion.div>
            )}
            {dateMode === "Rango" && (
              <motion.div
                key="rango"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex sm:flex-row flex-col items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto"
              >
                <div className="relative flex items-center w-full sm:w-auto">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none z-10" />
                  {!startMonth && <span className="absolute left-8 text-slate-400 text-[10px] font-bold pointer-events-none z-10">Inicio</span>}
                  <input
                    type="month"
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    className={`w-full sm:w-auto pl-8 pr-2 py-1.5 rounded-xl border border-border bg-muted/40 dark:bg-background text-xs font-bold focus:outline-none focus:ring-2 focus:ring-muted-foreground/30 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${startMonth ? "text-foreground" : "text-transparent"}`}
                  />
                </div>
                <span className="text-xs font-bold text-slate-400 shrink-0 hidden sm:block">al</span>
                <div className="relative flex items-center w-full sm:w-auto">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none z-10" />
                  {!endMonth && <span className="absolute left-8 text-slate-400 text-[10px] font-bold pointer-events-none z-10">Final</span>}
                  <input
                    type="month"
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
                    className={`w-full sm:w-auto pl-8 pr-2 py-1.5 rounded-xl border border-border bg-muted/40 dark:bg-background text-xs font-bold focus:outline-none focus:ring-2 focus:ring-muted-foreground/30 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${endMonth ? "text-foreground" : "text-transparent"}`}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sector / Política / Organización — solo en lg+ */}
          <div className="hidden lg:flex items-center gap-2 ml-auto shrink-0">
            <div className="w-px h-5 bg-border/60 shrink-0" />
            <FilterPickerButton
              label="Sector"
              subtitle={filterButtonSubtitle(selectedSectorIds, sectorPickerItems, "Todos los sectores")}
              active={selectedSectorIds.length > 0}
              onClick={() => setOpenFilterModal("sector")}
            />
            <FilterPickerButton
              label="Política"
              subtitle={
                selectedSectorIds.length === 0
                  ? "Seleccione sector"
                  : filterButtonSubtitle(selectedPoliticaIds, politicaPickerItems, "Todas")
              }
              active={selectedPoliticaIds.length > 0}
              dimmed={selectedSectorIds.length === 0}
              onClick={() => {
                if (selectedSectorIds.length === 0) { setOpenFilterModal("sector"); return; }
                setOpenFilterModal("politica");
              }}
            />
            <FilterPickerButton
              label="Organización"
              subtitle={filterButtonSubtitle(selectedOrgIds, orgPickerItems, "Todas")}
              active={selectedOrgIds.length > 0}
              onClick={() => setOpenFilterModal("org")}
            />
          </div>

        </div>

        {/* Segunda fila: selector de Año (solo cuando dateMode === "Año") */}
        <AnimatePresence>
          {dateMode === "Año" && (
            <motion.div
              key="year-row"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={effectiveYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="pl-2 pr-6 py-1.5 rounded-xl border border-border bg-muted/40 dark:bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-muted-foreground/30 cursor-pointer appearance-none"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* En lg+: sector/política/org en la misma fila que fecha. En mobile: nueva fila */}
        <div className="mt-3 lg:hidden border-t border-border/60 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <FilterPickerButton
            label="Sector"
            subtitle={filterButtonSubtitle(selectedSectorIds, sectorPickerItems, "Todos los sectores")}
            active={selectedSectorIds.length > 0}
            onClick={() => setOpenFilterModal("sector")}
          />
          <FilterPickerButton
            label="Política de Migración"
            subtitle={
              selectedSectorIds.length === 0
                ? "Seleccione sector primero"
                : filterButtonSubtitle(selectedPoliticaIds, politicaPickerItems, "Todas las políticas de migración")
            }
            active={selectedPoliticaIds.length > 0}
            dimmed={selectedSectorIds.length === 0}
            onClick={() => {
              if (selectedSectorIds.length === 0) { setOpenFilterModal("sector"); return; }
              setOpenFilterModal("politica");
            }}
          />
          <FilterPickerButton
            label="Organización"
            subtitle={filterButtonSubtitle(selectedOrgIds, orgPickerItems, "Todas las organizaciones")}
            active={selectedOrgIds.length > 0}
            onClick={() => setOpenFilterModal("org")}
          />
        </div>

        {modalConfig && (
          <FilterPickerModal
            isOpen={openFilterModal !== null}
            onClose={() => setOpenFilterModal(null)}
            title={modalConfig.title}
            description={modalConfig.description}
            items={modalConfig.items}
            groups={modalConfig.groups}
            emptyMessage={modalConfig.emptyMessage}
            selectedIds={modalConfig.selectedIds}
            wide={modalConfig.wide}
            onApply={(ids) => {
              modalConfig.onApply(ids);
              setOpenFilterModal(null);
            }}
          />
        )}
      </div>

      {/* ═══ DONUT CHART WITH TABS + KPIs ═══ */}
      {filteredRows.length > 0 ? (
        <div ref={reportContentRef} id="reporte-contenido" className="space-y-6 bg-background">
          <div data-report-export-block className="bg-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-5 xl:p-6 w-full min-w-0">
            <ReportExportHeader dateLabel={exportDateLabel} />
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" /> Desglose por Dimensión
                </h3>
                <p className="text-xs text-slate-500 mt-1 report-export-hide">
                  Seleccione una dimensión para visualizar el desglose de atenciones.
                </p>
              </div>
              <div className="report-export-hide grid grid-cols-2 gap-1 sm:flex sm:flex-wrap bg-muted/70 dark:bg-muted/30 border border-border/40 p-1 rounded-xl w-full xl:w-auto">
                {(["campos", "nacionalidad", "perfil", "todo"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveChartTab(tab)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize sm:flex-none ${
                      activeChartTab === tab
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                        : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-muted/50"
                    }`}
                  >
                    {tab === "campos" ? "Campos" : tab === "nacionalidad" ? "Nacionalidad" : tab === "perfil" ? "Perfil" : "Todo"}
                  </button>
                ))}
              </div>
            </div>

            {/* Pantalla: una dimensión a la vez o todas */}
            {activeChartTab === "todo" ? (
              <div className="report-export-hide flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-2 xl:gap-3 mb-2">
                  <KpiCard compact icon={Users} label="Total Atenciones" value={fmt(kpis.totalAtenciones)} color="blue" />
                  <KpiCard compact icon={BarChart3} label="Registros" value={fmt(kpis.totalRegistros)} color="sky" />
                  <KpiCard compact icon={Building2} label="Organizaciones" value={fmt(kpis.totalOrgs)} color="cyan" />
                </div>
                <div
                  className={`grid grid-cols-1 gap-4 ${
                    hasNacPerfilData ? "xl:grid-cols-3" : "xl:grid-cols-1"
                  }`}
                >
                  {campoDonutData.length > 0 && (
                    <DimensionDonutPanel title="Campos" data={campoDonutData} chartId="screen-campos" />
                  )}
                  {hasNacPerfilData && (
                    <DimensionDonutPanel title="Nacionalidad" data={nacDonutData} chartId="screen-nac" />
                  )}
                  {hasNacPerfilData && (
                    <DimensionDonutPanel title="Perfil" data={perfilDonutData} chartId="screen-perfil" />
                  )}
                </div>
                {hasOmiteNacPerfil && (
                  <div className="pt-4 border-t border-violet-200 dark:border-violet-800/50 space-y-3">
                    <p className="text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">
                      Reuniones, Empresas y Actores
                    </p>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <DimensionDonutPanel
                        title="Por Indicador"
                        data={omitIndicadorDonutData}
                        chartId="screen-omit-ind"
                      />
                      <DimensionDonutPanel
                        title="Por Campo"
                        data={omitCampoDonutData}
                        chartId="screen-omit-campo"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="report-export-hide grid grid-cols-1 xl:grid-cols-[10.5rem_minmax(0,1fr)_minmax(0,1.15fr)] gap-4 xl:gap-6 items-stretch xl:items-center">
              <div className="grid grid-cols-3 xl:grid-cols-1 gap-2 xl:gap-3">
                <KpiCard compact icon={Users} label="Total Atenciones" value={fmt(kpis.totalAtenciones)} color="blue" />
                <KpiCard compact icon={BarChart3} label="Registros" value={fmt(kpis.totalRegistros)} color="sky" />
                <KpiCard compact icon={Building2} label="Organizaciones" value={fmt(kpis.totalOrgs)} color="cyan" />
              </div>

              <div className="h-[260px] xl:h-[300px] w-full min-w-0">
                <AnimatePresence mode="wait">
                  <ActiveDimensionDonutChart
                    key={activeChartTab}
                    data={activeDonutData}
                    total={activeDonutTotal}
                    chartKey={activeChartTab}
                  />
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {activeDonutData.map((item, index) => {
                  const pct = activeDonutTotal > 0 ? ((item.value / activeDonutTotal) * 100).toFixed(1) : "0";
                  return (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-3 h-3 rounded-full shadow-sm shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs font-bold text-slate-400">{pct}%</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{fmt(item.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
            )}

            {/* Impresión: KPIs + las 3 dimensiones */}
            <div className="report-export-only hidden">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <KpiCard icon={Users} label="Total Atenciones" value={fmt(kpis.totalAtenciones)} color="blue" />
                <KpiCard icon={BarChart3} label="Registros" value={fmt(kpis.totalRegistros)} color="sky" />
                <KpiCard icon={Building2} label="Organizaciones" value={fmt(kpis.totalOrgs)} color="cyan" />
              </div>
              <div className="grid grid-cols-1 gap-4">
                {campoDonutData.length > 0 && (
                  <DimensionDonutPanel title="Campos" data={campoDonutData} chartId="print-campos" />
                )}
                {hasNacPerfilData && (
                  <DimensionDonutPanel title="Nacionalidad" data={nacDonutData} chartId="print-nac" />
                )}
                {hasNacPerfilData && (
                  <DimensionDonutPanel title="Perfil" data={perfilDonutData} chartId="print-perfil" />
                )}
              </div>
              {hasOmiteNacPerfil && (
                <div className="mt-6 pt-6 border-t border-violet-200 space-y-3">
                  <p className="text-xs font-black uppercase tracking-widest text-violet-700">
                    Reuniones, Empresas y Actores
                  </p>
                  <div className="grid grid-cols-1 gap-4">
                    <DimensionDonutPanel
                      title="Por Indicador"
                      data={omitIndicadorDonutData}
                      chartId="print-omit-ind"
                    />
                    <DimensionDonutPanel
                      title="Por Campo"
                      data={omitCampoDonutData}
                      chartId="print-omit-campo"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══ CHARTS: org (2/5) + tendencia mensual (3/5) ═══ */}
          <div data-report-export-block className="grid grid-cols-1 xl:grid-cols-5 gap-6 w-full min-w-0">
            {/* By Org — 2/5 */}
            <div className="xl:col-span-2 bg-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-5 xl:p-6 w-full min-w-0">
              <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" /> Atenciones por Organización
              </h3>
              {orgBarData.length > 0 ? (
                <OrgBarChartList data={orgBarData} />
              ) : (
                <EmptyState />
              )}
            </div>

            {/* Tendencia mensual — 3/5 */}
            <div className="xl:col-span-3 bg-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-5 xl:p-6 w-full min-w-0">
              <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" /> Tendencia Mensual
              </h3>
              {monthlyStackChart.data.length > 0 ? (
                <div className="h-[320px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyStackChart.data}
                      margin={{ left: 4, right: 12, top: 12, bottom: 8 }}
                      barCategoryGap="28%"
                      barGap={2}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.15} />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        dy={5}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        width={48}
                        tickFormatter={(v) => fmt(Number(v))}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;

                          const nacEntries = payload
                            .filter(
                              (entry) =>
                                entry.name !== "registros" &&
                                Number(entry.value) > 0,
                            )
                            .sort((a, b) => {
                              const an = String(a.name);
                              const bn = String(b.name);
                              if (an === SIN_ESPECIFICAR_LABEL) return -1;
                              if (bn === SIN_ESPECIFICAR_LABEL) return 1;
                              return 0;
                            });

                          const registrosEntry = payload.find(
                            (entry) =>
                              entry.name === "registros" &&
                              Number(entry.value) > 0,
                          );

                          if (!registrosEntry && nacEntries.length === 0) {
                            return null;
                          }

                          return (
                            <div style={tooltipStyle} className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-md">
                              <p className="font-bold text-slate-800 mb-2">{label}</p>
                              {registrosEntry && (
                                <p className="text-slate-600 mb-2">
                                  <span className="font-semibold">Registros:</span>{" "}
                                  {fmt(Number(registrosEntry.value))}
                                </p>
                              )}
                              {nacEntries.map((entry) => (
                                <p key={String(entry.name)} className="text-slate-700">
                                  <span style={{ color: entry.color }}>●</span>{" "}
                                  {entry.name}: {fmt(Number(entry.value))}
                                </p>
                              ))}
                            </div>
                          );
                        }}
                      />
                      <Legend
                        content={() => (
                          <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 pt-3">
                            {monthlyStackChart.nacNames.map((nac, i) => (
                              <div
                                key={nac}
                                className="flex flex-col items-center gap-0.5 min-w-[4.5rem] max-w-[7rem]"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span
                                    className="size-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: monthlyNacColors[i] }}
                                  />
                                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate">
                                    {nac}
                                  </span>
                                </div>
                                <span className="text-[10px] font-black font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                                  {fmt(monthlyStackChart.indicatorTotals[nac] ?? 0)}
                                </span>
                              </div>
                            ))}
                            <div className="flex flex-col items-center gap-0.5 min-w-[4.5rem]">
                              <div className="flex items-center gap-1.5">
                                <span className="size-2.5 shrink-0 rounded-full bg-slate-700" />
                                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                  Registros
                                </span>
                              </div>
                              <span className="text-[10px] font-black font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                                {fmt(monthlyStackChart.indicatorTotals.registros ?? 0)}
                              </span>
                            </div>
                          </div>
                        )}
                      />
                      <Bar
                        dataKey="registros"
                        name="registros"
                        stackId="mes"
                        fill="#334155"
                        barSize={44}
                        isAnimationActive={false}
                      />
                      {monthlyStackChart.nacNames.map((nac, i) => (
                        <Bar
                          key={nac}
                          dataKey={nac}
                          name={nac}
                          stackId="mes"
                          fill={monthlyNacColors[i]}
                          barSize={44}
                          radius={
                            i === monthlyStackChart.nacNames.length - 1
                              ? [4, 4, 0, 0]
                              : [0, 0, 0, 0]
                          }
                          isAnimationActive={false}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>

          <ReportGlobalCrossSection rows={filteredRows} />

          {/* ═══ SUMMARY TABLE ═══ */}
          <div data-report-export-block className="bg-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Resumen General por Organización</h3>
                <p className="text-xs text-slate-500 mt-1">Desglose de atenciones en todos los sectores participantes.</p>
              </div>
              <ReportExcelButton
                label="Excel"
                onClick={() =>
                  downloadSingleSheet(
                    buildOrgSummaryRows(filteredRows),
                    "resumen-por-organizacion.xlsx",
                    "Resumen org"
                  )
                }
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 xl:px-6 py-4 sticky left-[-1px] bg-slate-50 dark:bg-slate-900 z-10">Sector</th>
                    <th className="px-4 xl:px-6 py-4">Organización</th>
                    {orgSummaryData.campoNames.map((cn) => (
                      <th key={cn} className="px-3 py-4 text-right whitespace-normal min-w-[120px] max-w-[150px]">
                        {(() => {
                          const words = cn.trim().split(/\s+/);
                          if (words.length > 2) {
                            return (
                              <>
                                {words.slice(0, 2).join(" ")}
                                <br />
                                {words.slice(2).join(" ")}
                              </>
                            );
                          }
                          return cn;
                        })()}
                      </th>
                    ))}
                    <th className="px-4 xl:px-6 py-4 text-right font-black text-blue-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orgSummaryData.rows.map((row, i) => (
                    <tr key={i} className="group border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors last:border-0">
                      <td className={`px-4 xl:px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 sticky left-[-1px] z-10 whitespace-normal min-w-[130px] max-w-[160px] transition-colors ${
                        i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-[#1e293b]"
                      } group-hover:bg-slate-100 dark:group-hover:bg-slate-800`}>
                        {(() => {
                          const words = row.sectorNombre.trim().split(/\s+/);
                          if (words.length > 2) {
                            return (
                              <>
                                {words.slice(0, 2).join(" ")}
                                <br />
                                {words.slice(2).join(" ")}
                              </>
                            );
                          }
                          return row.sectorNombre;
                        })()}
                      </td>
                      <td className="px-4 xl:px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.orgNombre}</td>
                      {orgSummaryData.campoNames.map((cn) => (
                        <td key={cn} className="px-3 py-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">{fmt(row.campos.get(cn) || 0)}</td>
                      ))}
                      <td className="px-4 xl:px-6 py-4 text-right font-mono font-black text-blue-600 dark:text-blue-400">{fmt(row.total)}</td>
                    </tr>
                  ))}
                  {/* Totals */}
                  <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-200 dark:border-blue-800">
                    <td className="px-4 xl:px-6 py-4 font-black text-xs text-slate-500 uppercase tracking-wider sticky left-[-1px] bg-slate-50 dark:bg-slate-900 z-10" colSpan={2}>Total General</td>
                    {orgSummaryData.campoNames.map((cn) => {
                      const colSum = orgSummaryData.rows.reduce((s, r) => s + (r.campos.get(cn) || 0), 0);
                      return <td key={cn} className="px-3 py-4 text-right font-mono font-black text-slate-800 dark:text-slate-200">{fmt(colSum)}</td>;
                    })}
                    <td className="px-4 xl:px-6 py-4 text-right font-mono font-black text-blue-700 dark:text-blue-400">
                      {fmt(orgSummaryData.rows.reduce((s, r) => s + r.total, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <ReportPoliticaIndicadorSection rows={filteredRows} />
        </div>
      ) : (
        <div className="bg-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <BarChart3 className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4" />
          <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">Sin datos para mostrar</h3>
          <p className="text-sm text-slate-400 mt-2">No se encontraron registros con los filtros seleccionados. Ingrese datos a través de los formularios o ajuste los filtros.</p>
        </div>
      )}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Download helpers
   ────────────────────────────────────────────────────────────── */

function buildDownloadOptions({
  filteredRows,
  getNode,
  isMobile,
}: {
  filteredRows: ReportRow[];
  getNode: () => HTMLElement | null;
  isMobile: boolean;
}): DownloadMenuOption[] {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const baseName = `reporte-observatorio-${dateStamp}`;

  const requireNode = () => {
    const node = getNode();
    if (!node) {
      throw new Error(
        "No se pudo capturar el contenido. Espere a que termine de cargar e intente de nuevo."
      );
    }
    return node;
  };

  const pdfOption: DownloadMenuOption = isMobile
    ? {
        id: "pdf",
        label: "Descargar PDF",
        description: "Archivo PDF en tamaño oficio, igual que en computadora.",
        icon: FileText,
        iconClass: "text-red-600 dark:text-red-400",
        onSelect: async () => {
          const node = requireNode();
          await downloadNodeAsPdf(node, `${baseName}.pdf`);
        },
      }
    : {
        id: "pdf",
        label: "Imprimir PDF",
        description: "Vista de impresión en tamaño oficio. Desde ahí puede guardar como PDF.",
        icon: FileText,
        iconClass: "text-red-600 dark:text-red-400",
        onSelect: async () => {
          const node = requireNode();
          await printNode(node, "Análisis de Datos — Observatorio");
        },
      };

  return [
    {
      id: "excel",
      label: "Excel completo",
      description: "Libro con datos generales, por política e indicador.",
      icon: FileSpreadsheet,
      iconClass: "text-emerald-600 dark:text-emerald-400",
      onSelect: () => downloadCompleteReportExcel(filteredRows),
    },
    pdfOption,
    {
      id: "image",
      label: "Imagen (JPEG)",
      description: "Captura completa del reporte.",
      icon: ImageIcon,
      iconClass: "text-blue-600 dark:text-blue-400",
      onSelect: async () => {
        const node = requireNode();
        await downloadNodeAsJpeg(node, `${baseName}.jpg`);
      },
    },
  ];
}

/* ──────────────────────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────────────────────── */

type DonutSlice = { name: string; value: number; color: string };

function DonutCenterTotal({
  value,
  active,
  runId,
}: {
  value: number;
  active: boolean;
  runId: string | number;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <AnimatedNumber
        value={value}
        active={active}
        runId={runId}
        className="text-lg font-black leading-none font-mono text-slate-900 dark:text-white"
      />
      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        total
      </span>
    </div>
  );
}

function OrgBarChartList({ data }: { data: { org: string; total: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const twoColumns = data.length > 6;

  return (
    <div
      className={
        twoColumns
          ? "grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 w-full"
          : "flex flex-col gap-2.5 w-full"
      }
    >
      {data.map((item, i) => {
        const pct = (item.total / max) * 100;
        return (
          <div key={item.org} className="min-w-0 w-full text-left">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p
                className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight truncate"
                title={item.org}
              >
                {item.org}
              </p>
              <span className="text-[10px] font-mono font-black text-slate-500 shrink-0 tabular-nums">
                {fmt(item.total)}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: chartColor(i),
                  minWidth: item.total > 0 ? 3 : 0,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActiveDimensionDonutChart({
  data,
  total,
  chartKey,
}: {
  data: DonutSlice[];
  total: number;
  chartKey: string;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInView = useInView(chartRef, { once: true, margin: "-20px" });

  return (
    <motion.div
      ref={chartRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="relative h-full w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={data.length > 1 ? 4 : 0}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => fmt(Number(value ?? 0))}
            contentStyle={tooltipStyle}
            itemStyle={{ color: "#0f172a" }}
            labelStyle={{ color: "#0f172a" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <DonutCenterTotal value={total} active={chartInView} runId={chartKey} />
    </motion.div>
  );
}

function DimensionDonutPanel({
  title,
  data,
  chartId,
}: {
  title: string;
  data: DonutSlice[];
  chartId: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const chartSize = 210;
  const chartCenter = chartSize / 2;
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInView = useInView(chartRef, { once: true, margin: "-20px" });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">
        {title}
      </h4>
      {data.length === 0 ? (
        <p className="text-xs text-slate-400 font-semibold py-6 text-center">Sin datos</p>
      ) : (
        <div className="flex flex-col gap-6 items-center">
          <div
            ref={chartRef}
            className="relative shrink-0"
            style={{ width: chartSize, height: chartSize }}
          >
            <PieChart width={chartSize} height={chartSize}>
              <Pie
                data={data}
                cx={chartCenter}
                cy={chartCenter}
                innerRadius={58}
                outerRadius={94}
                paddingAngle={data.length > 1 ? 3 : 0}
                dataKey="value"
                stroke="none"
                isAnimationActive={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`${chartId}-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            <DonutCenterTotal
              value={total}
              active={chartInView}
              runId={chartId}
            />
          </div>
          <div className="w-full min-w-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-1 gap-2">
            {data.map((item, index) => {
              const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
              return (
                <div key={`${chartId}-leg-${index}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs font-bold text-slate-400">{pct}%</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                      {fmt(item.value)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, compact }: {
  icon: typeof Users;
  label: string;
  value: string;
  color: "blue" | "sky" | "cyan" | "amber";
  compact?: boolean;
}) {
  const colorMap = {
    blue: { bg: "bg-blue-50 dark:bg-blue-900/20", icon: "text-blue-600", border: "border-blue-100 dark:border-blue-800/50" },
    sky: { bg: "bg-sky-50 dark:bg-sky-900/20", icon: "text-sky-600", border: "border-sky-100 dark:border-sky-800/50" },
    cyan: { bg: "bg-cyan-50 dark:bg-cyan-900/20", icon: "text-cyan-600", border: "border-cyan-100 dark:border-cyan-800/50" },
    amber: { bg: "bg-amber-50 dark:bg-amber-900/20", icon: "text-amber-500", border: "border-amber-100 dark:border-amber-800/50" },
  };
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${c.bg} rounded-2xl border ${c.border} ${compact ? "p-3 space-y-1" : "p-4 md:p-5 space-y-2"}`}
    >
      <div className="flex items-center gap-1.5">
        <Icon className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"} ${c.icon}`} />
        <span className={`font-black text-slate-400 uppercase tracking-widest leading-tight ${compact ? "text-[9px]" : "text-[10px]"}`}>
          {label}
        </span>
      </div>
      <p className={`font-black text-slate-900 dark:text-white font-mono ${compact ? "text-xl xl:text-2xl" : "text-2xl md:text-3xl"}`}>
        {value}
      </p>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BarChart3 className="w-10 h-10 text-slate-200 dark:text-slate-800 mb-3" />
      <p className="text-sm text-slate-400 font-semibold">Sin datos para esta vista</p>
    </div>
  );
}

function FilterPickerButton({
  label,
  subtitle,
  active,
  dimmed,
  onClick,
}: {
  label: string;
  subtitle: string;
  active: boolean;
  dimmed?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer min-w-0 w-full ${
        dimmed
          ? "bg-muted/20 dark:bg-muted/10 border-border opacity-70"
          : active
            ? "bg-background border-border ring-1 ring-border/60"
            : "bg-muted/30 dark:bg-muted/20 border-border hover:bg-muted/50 dark:hover:bg-muted/40"
      }`}
    >
      <span
        className={`text-[10px] font-black uppercase tracking-widest ${
          dimmed ? "text-muted-foreground" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-xs font-bold truncate w-full ${
          dimmed ? "text-muted-foreground italic" : "text-foreground"
        }`}
      >
        {subtitle}
      </span>
    </button>
  );
}

function FilterPickerModal({
  isOpen,
  onClose,
  title,
  description,
  items,
  groups = [],
  emptyMessage,
  selectedIds,
  wide,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  items: FilterPickerItem[];
  groups?: FilterPickerGroup[];
  emptyMessage?: string;
  selectedIds: string[];
  wide?: boolean;
  onApply: (ids: string[]) => void;
}) {
  const selectionKey = selectedIds.slice().sort().join("\0");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {isOpen ? (
        <FilterPickerModalBody
          key={selectionKey}
          onClose={onClose}
          title={title}
          description={description}
          items={items}
          groups={groups}
          emptyMessage={emptyMessage}
          selectedIds={selectedIds}
          wide={wide}
          onApply={onApply}
        />
      ) : null}
    </Dialog>
  );
}

function FilterPickerModalBody({
  onClose,
  title,
  description,
  items,
  groups = [],
  emptyMessage,
  selectedIds,
  wide,
  onApply,
}: {
  onClose: () => void;
  title: string;
  description: string;
  items: FilterPickerItem[];
  groups?: FilterPickerGroup[];
  emptyMessage?: string;
  selectedIds: string[];
  wide?: boolean;
  onApply: (ids: string[]) => void;
}) {
  const [draft, setDraft] = useState<string[]>(selectedIds);
  const [search, setSearch] = useState("");

  const isGrouped = groups.length > 0;

  const allItems = useMemo(
    () => (isGrouped ? groups.flatMap((g) => g.items) : items),
    [isGrouped, groups, items]
  );

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!isGrouped) return groups;

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            !q ||
            item.label.toLowerCase().includes(q) ||
            (item.sublabel?.toLowerCase().includes(q) ?? false) ||
            group.groupLabel.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, isGrouped, search]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (isGrouped) return [];
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.sublabel?.toLowerCase().includes(q) ?? false)
    );
  }, [items, isGrouped, search]);

  const toggle = (id: string) => {
    setDraft((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const renderItem = (item: FilterPickerItem) => {
    const checked = draft.includes(item.id);
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => toggle(item.id)}
        className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer ${
          checked
            ? "bg-slate-100 dark:bg-slate-800/50"
            : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
        }`}
      >
        <span
          className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
            checked
              ? "bg-slate-600 dark:bg-slate-500 border-slate-600 dark:border-slate-500 text-white"
              : "border-slate-300 dark:border-slate-600"
          }`}
        >
          {checked && <Check className="w-3 h-3" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            {item.label}
          </span>
          {item.sublabel && (
            <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
              {item.sublabel}
            </span>
          )}
        </span>
      </button>
    );
  };

  const hasResults = isGrouped ? filteredGroups.length > 0 : filteredItems.length > 0;

  return (
    <DialogContent className={wide ? "sm:max-w-2xl" : "sm:max-w-lg"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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

        <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
          <span className="text-slate-500">
            {draft.length === 0 ? "Ninguno — muestra todos" : `${draft.length} seleccionado(s)`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDraft(allItems.map((i) => i.id))}
              disabled={allItems.length === 0}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Todos
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => setDraft([])}
              className="text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
          {!hasResults ? (
            <p className="px-4 py-6 text-center text-xs text-slate-400 font-semibold">
              {search.trim() ? "Sin resultados" : emptyMessage ?? "Sin opciones disponibles"}
            </p>
          ) : isGrouped ? (
            filteredGroups.map((group, idx) => (
              <div
                key={group.groupId}
                className={idx > 0 ? "border-t border-slate-200 dark:border-slate-800" : ""}
              >
                <div className="sticky top-0 z-10 px-3 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                    {group.groupLabel}
                  </span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {group.items.map((item) => renderItem(item))}
                </div>
              </div>
            ))
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map((item) => renderItem(item))}
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
            onClick={() => onApply(draft)}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white text-xs font-bold cursor-pointer"
          >
            Aplicar
          </button>
        </div>
      </DialogContent>
  );
}

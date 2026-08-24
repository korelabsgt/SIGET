"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Car,
  CarFront,
  CheckCircle,
  ChevronLeft,
  CircleAlert,
  CircleCheck,
  Clock,
  FileText,
  Image,
  Images,
  User,
  Wrench,
} from "lucide";
import { GvMorphIcon } from "../lib/morph-icon";
import { formatFechaHoraGt } from "@/lib/fechas-gt";
import { cn } from "@/lib/utils";
import { type FallaRow, type MecanicoOption } from "./lib/zod";
import {
  estadoFallaBadgeClass,
  formatEstadoFallaLabel,
  formatSeveridadLabel,
  formatVehiculoFalla,
  severidadBadgeClass,
} from "./lib/helpers";
import { VerEditar } from "./forms/VerEditar";

function ChipDato({
  icon,
  hoverIcon,
  label,
  value,
}: {
  icon: typeof Car;
  hoverIcon: typeof Car;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex min-w-0 items-center gap-3 rounded-2xl bg-zinc-200/90 px-4 py-3 dark:bg-zinc-900"
      data-morph-hover-scope
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-celeste-trifinio dark:bg-sky-950">
        <GvMorphIcon icon={icon} hoverIcon={hoverIcon} size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function FilaDocumento({
  icon,
  hoverIcon,
  label,
  value,
}: {
  icon: typeof Car;
  hoverIcon: typeof Car;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 border-t border-zinc-200 py-4 first:border-t-0 first:pt-0 dark:border-zinc-700">
      <span className="mt-0.5 text-zinc-400 dark:text-zinc-500">
        <GvMorphIcon icon={icon} hoverIcon={hoverIcon} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">{value}</p>
      </div>
    </div>
  );
}

function FilaSimple({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-zinc-300 py-3 first:border-t-0 first:pt-0 dark:border-zinc-800">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-right text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function FallaDetalleView({
  falla,
  mecanicos,
  isAuthorized,
  onBack,
}: {
  falla: FallaRow;
  mecanicos: MecanicoOption[];
  isAuthorized: boolean;
  onBack: () => void;
}) {
  const [accion, setAccion] = useState<"atender" | "solventar" | null>(null);
  const vehiculoNombre = formatVehiculoFalla(falla);
  const reportador = falla.reportador?.nombre?.trim() || "Desconocido";
  const atencion = falla.taller_externo
    ? `Taller: ${falla.taller_externo}`
    : falla.mecanico?.nombre?.trim() || "Sin asignar";

  const acciones = (() => {
    if (!isAuthorized) return null;
    if (falla.estado === "PENDIENTE") {
      return (
        <button
          type="button"
          onClick={() => setAccion("atender")}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-orange-600 px-4 text-[10px] font-bold uppercase tracking-wider text-white hover:opacity-90"
        >
          <GvMorphIcon icon={Wrench} hoverIcon={Wrench} size={14} />
          Atender
        </button>
      );
    }
    if (falla.estado === "EN_REPARACION") {
      return (
        <button
          type="button"
          onClick={() => setAccion("solventar")}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-emerald-600 px-4 text-[10px] font-bold uppercase tracking-wider text-white hover:opacity-90"
        >
          <GvMorphIcon icon={CheckCircle} hoverIcon={CircleCheck} size={14} />
          Solventar
        </button>
      );
    }
    return null;
  })();

  return (
    <div className="pb-8 pt-1">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-9 w-fit cursor-pointer items-center gap-2 rounded-xl border-0 bg-transparent px-0 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:opacity-80 dark:text-zinc-400"
      >
        <GvMorphIcon icon={ArrowLeft} hoverIcon={ChevronLeft} size={16} className="text-current" />
        Regresar
      </button>

      <div className="mt-4 overflow-hidden rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
        <div className="border-b border-zinc-200 px-5 py-5 dark:border-zinc-700 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    estadoFallaBadgeClass(falla.estado),
                  )}
                >
                  {formatEstadoFallaLabel(falla.estado)}
                </span>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    severidadBadgeClass(falla.severidad),
                  )}
                >
                  {formatSeveridadLabel(falla.severidad)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Reportada el {formatFechaHoraGt(falla.created_at)}
                </span>
              </div>
              <h1 className="mt-3 flex items-start gap-2.5 text-3xl font-black tracking-tight text-foreground md:text-4xl">
                <span className="mt-1 shrink-0 text-celeste-trifinio">
                  <GvMorphIcon icon={Car} hoverIcon={CarFront} size={28} />
                </span>
                <span className="min-w-0">{vehiculoNombre}</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">Reportado por {reportador}</p>
            </div>
            {acciones ? <div className="flex shrink-0 flex-wrap items-center gap-2">{acciones}</div> : null}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <ChipDato
              icon={AlertTriangle}
              hoverIcon={CircleAlert}
              label="Severidad"
              value={formatSeveridadLabel(falla.severidad)}
            />
            <ChipDato
              icon={CalendarClock}
              hoverIcon={Clock}
              label="Fecha de reporte"
              value={formatFechaHoraGt(falla.created_at)}
            />
            <ChipDato icon={User} hoverIcon={User} label="Reportado por" value={reportador} />
            <ChipDato icon={Wrench} hoverIcon={Wrench} label="Atención" value={atencion} />
          </div>
        </div>

        <div className="grid gap-8 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(16rem,0.9fr)] lg:gap-12 lg:px-8 lg:py-8">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-celeste-trifinio">
              Detalle de la avería
            </h2>
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Descripción
              </p>
              <p className="mt-2 max-w-prose text-[15px] leading-7 text-foreground">{falla.descripcion}</p>
            </div>
            <div className="mt-6">
              <FilaDocumento
                icon={FileText}
                hoverIcon={FileText}
                label="Diagnóstico"
                value={falla.diagnostico?.trim() || "Sin diagnóstico"}
              />
              <FilaDocumento
                icon={Wrench}
                hoverIcon={Wrench}
                label="Reparación"
                value={falla.reparacion_detalle?.trim() || "Sin detalle de reparación"}
              />
              <FilaDocumento
                icon={CalendarClock}
                hoverIcon={Clock}
                label="Solventada"
                value={falla.solventado_at ? formatFechaHoraGt(falla.solventado_at) : "Aún no solventada"}
              />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-celeste-trifinio">
              Vehículo
            </h2>
            <div className="mt-4 rounded-2xl bg-zinc-200 p-5 dark:bg-zinc-900" data-morph-hover-scope>
              {falla.vehiculo ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-celeste-trifinio text-white">
                      <GvMorphIcon icon={Car} hoverIcon={CarFront} size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-black uppercase tracking-wide text-foreground">
                        {falla.vehiculo.placa}
                      </p>
                      <p className="truncate text-sm capitalize text-muted-foreground">{vehiculoNombre}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <FilaSimple label="Marca" value={falla.vehiculo.marca || "—"} />
                    <FilaSimple label="Modelo" value={falla.vehiculo.modelo || "—"} />
                    <FilaSimple label="Placa" value={falla.vehiculo.placa || "—"} />
                  </div>
                </>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  No hay vehículo asociado a esta avería.
                </p>
              )}
            </div>
            {falla.evidencia_url ? (
              <a
                href={falla.evidencia_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-wider text-celeste-trifinio hover:opacity-80"
              >
                <GvMorphIcon icon={Image} hoverIcon={Images} size={14} />
                Ver evidencia
              </a>
            ) : null}
          </section>
        </div>
      </div>

      <VerEditar
        open={accion !== null}
        onClose={() => setAccion(null)}
        modo={accion}
        falla={falla}
        mecanicos={mecanicos}
      />
    </div>
  );
}

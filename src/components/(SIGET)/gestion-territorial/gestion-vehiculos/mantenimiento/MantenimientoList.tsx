"use client";

import { type FallaRow, type MecanicoOption } from "./lib/zod";
import { VerEditar } from "./forms/VerEditar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Wrench, AlertCircle, User, Car, WrenchIcon } from "lucide-react";
import {
  GestionVehiculosTable,
  GestionVehiculosTableEmpty,
  GestionVehiculosThead,
  GestionVehiculosTr,
} from "../lib/table-ui";

function SeveridadBadge({ severidad }: { severidad: string }) {
  const styles =
    severidad === "ALTA"
      ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
      : severidad === "MEDIA"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles}`}>
      {severidad === "ALTA" ? "Alta (Crítica)" : severidad === "MEDIA" ? "Media" : "Baja"}
    </span>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const styles =
    estado === "PENDIENTE"
      ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      : estado === "EN_REPARACION"
        ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";

  const label =
    estado === "PENDIENTE"
      ? "Pendiente"
      : estado === "EN_REPARACION"
        ? "En reparación"
        : "Solventada";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles}`}>
      {label}
    </span>
  );
}

export function MantenimientoList({
  fallas,
  mecanicos,
  isAuthorized,
  filtro,
}: {
  fallas: FallaRow[];
  mecanicos: MecanicoOption[];
  isAuthorized: boolean;
  filtro: "ACTIVAS" | "CRITICAS" | "SOLVENTADAS";
}) {
  const filteredFallas = fallas.filter((falla) => {
    if (filtro === "ACTIVAS") {
      return falla.estado === "PENDIENTE" || falla.estado === "EN_REPARACION";
    }
    if (filtro === "CRITICAS") {
      return falla.severidad === "ALTA" && falla.estado !== "SOLVENTADA";
    }
    if (filtro === "SOLVENTADAS") {
      return falla.estado === "SOLVENTADA";
    }
    return true;
  });

  if (filteredFallas.length === 0) {
    return (
      <GestionVehiculosTableEmpty
        icon={<WrenchIcon className="size-10" />}
        title="No hay registros"
        description="No se encontraron averías en esta categoría."
      />
    );
  }

  return (
    <GestionVehiculosTable minWidth={1100}>
      <GestionVehiculosThead
        cells={[
          { key: "vehiculo", label: "Vehículo" },
          { key: "estado", label: "Severidad / estado" },
          { key: "descripcion", label: "Descripción" },
          { key: "reporte", label: "Reporte" },
          { key: "atencion", label: "Atención" },
          { key: "acciones", label: "Acciones", className: "text-right" },
        ]}
      />
      <tbody>{filteredFallas.map((falla) => (
        <GestionVehiculosTr
          key={falla.id}
          cells={[
            {
              key: "vehiculo",
              className: "align-top",
              content: (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Car className="size-3.5 shrink-0 text-celeste-trifinio" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                      {falla.vehiculo?.placa || "Sin placa"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {falla.vehiculo?.marca} {falla.vehiculo?.modelo}
                  </span>
                </div>
              ),
            },
            {
              key: "estado",
              className: "align-top",
              content: (
                <div className="flex flex-col items-start gap-2">
                  <SeveridadBadge severidad={falla.severidad} />
                  <EstadoBadge estado={falla.estado} />
                </div>
              ),
            },
            {
              key: "descripcion",
              className: "align-top",
              content: (
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <p className="line-clamp-3 text-sm text-foreground" title={falla.descripcion}>
                    {falla.descripcion}
                  </p>
                </div>
              ),
            },
            {
              key: "reporte",
              className: "align-top",
              content: (
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="size-3.5 shrink-0" />
                    <span className="max-w-[140px] truncate">{falla.reportador?.nombre || "Desconocido"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Calendar className="size-3.5 shrink-0 text-celeste-trifinio" />
                    {format(new Date(falla.created_at), "dd/MM/yyyy", { locale: es })}
                  </div>
                </div>
              ),
            },
            {
              key: "atencion",
              className: "align-top",
              content:
                falla.estado === "PENDIENTE" ? (
                  <span className="text-xs italic text-muted-foreground">Sin asignar</span>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <Wrench className="size-3.5 shrink-0 text-orange-500" />
                      {falla.taller_externo
                        ? `Taller: ${falla.taller_externo}`
                        : falla.mecanico?.nombre || "Mecánico interno"}
                    </div>
                    {falla.estado === "SOLVENTADA" && falla.diagnostico ? (
                      <p className="line-clamp-2 text-[11px] italic text-muted-foreground" title={falla.diagnostico}>
                        {falla.diagnostico}
                      </p>
                    ) : null}
                    {falla.estado === "SOLVENTADA" && falla.reparacion_detalle ? (
                      <p className="line-clamp-2 text-[11px] text-muted-foreground" title={falla.reparacion_detalle}>
                        {falla.reparacion_detalle}
                      </p>
                    ) : null}
                  </div>
                ),
            },
            {
              key: "acciones",
              className: "align-top text-right",
              content: isAuthorized ? (
                <VerEditar falla={falla} mecanicos={mecanicos} isAuthorized={isAuthorized} />
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              ),
            },
          ]}
        />
      ))}</tbody>
    </GestionVehiculosTable>
  );
}

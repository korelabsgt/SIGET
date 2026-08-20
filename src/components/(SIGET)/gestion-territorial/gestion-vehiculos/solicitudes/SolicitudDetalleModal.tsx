"use client";

import {
  CheckCircle,
  PlayCircle,
  StopCircle,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatFechaHoraGt } from "@/lib/fechas-gt";
import { type SolicitudRow } from "./lib/zod";
import {
  estadoBadgeClass,
  formatDuracionMision,
  formatEstadoLabel,
} from "./lib/helpers";

function CampoLectura({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {multiline ? (
        <Textarea
          readOnly
          tabIndex={-1}
          value={value}
          rows={3}
          className="cursor-default resize-none bg-muted/30"
        />
      ) : (
        <Input
          readOnly
          tabIndex={-1}
          value={value}
          className="cursor-default bg-muted/30"
        />
      )}
    </div>
  );
}

export function SolicitudDetalleModal({
  open,
  onOpenChange,
  solicitud,
  canManage,
  onAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solicitud: SolicitudRow | null;
  canManage: boolean;
  onAction: (
    solicitud: SolicitudRow,
    action: "APROBAR" | "RECHAZAR" | "INICIAR" | "FINALIZAR",
  ) => void;
}) {
  if (!solicitud) return null;

  const pasajeros = solicitud.pasajeros?.trim() || "Ninguno registrado";
  const ruta = solicitud.ruta_planificada?.trim() || "No especificada";
  const vehiculoTexto = solicitud.vehiculo
    ? [
        solicitud.vehiculo.placa,
        `${solicitud.vehiculo.marca} ${solicitud.vehiculo.modelo}`,
        solicitud.vehiculo.color ? `Color: ${solicitud.vehiculo.color}` : null,
        solicitud.vehiculo.kilometraje_actual != null
          ? `Odómetro: ${solicitud.vehiculo.kilometraje_actual.toLocaleString()} km`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Pendiente de asignación técnica";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 pr-6">
            <DialogTitle>Detalle de Solicitud de Vehículo</DialogTitle>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${estadoBadgeClass(solicitud.estado)}`}
            >
              {formatEstadoLabel(solicitud.estado)}
            </span>
          </div>
          <DialogDescription>
            Solicitud creada el {formatFechaHoraGt(solicitud.created_at)}
            {solicitud.solicitante?.nombre
              ? ` · ${solicitud.solicitante.nombre}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CampoLectura
              label="Solicitante"
              value={solicitud.solicitante?.nombre || "Desconocido"}
            />
            <CampoLectura
              label="Correo del solicitante"
              value={solicitud.solicitante?.email || "—"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CampoLectura
              label="Fecha y Hora de Inicio"
              value={formatFechaHoraGt(solicitud.fecha_inicio)}
            />
            <CampoLectura
              label="Fecha y Hora de Retorno Estimado"
              value={formatFechaHoraGt(solicitud.fecha_fin_estimada)}
            />
          </div>

          <CampoLectura
            label="Duración estimada de la misión"
            value={formatDuracionMision(solicitud.fecha_inicio, solicitud.fecha_fin_estimada)}
          />

          <CampoLectura label="Destino" value={solicitud.destino} />

          <CampoLectura label="Ruta Planificada (Opcional)" value={ruta} />

          <CampoLectura
            label="Justificación de la Misión"
            value={solicitud.justificacion}
            multiline
          />

          <CampoLectura label="Pasajeros / Acompañantes (Opcional)" value={pasajeros} />

          <CampoLectura label="Vehículo Asignado" value={vehiculoTexto} />
        </div>

        <DialogFooter className="pt-4">
          {canManage && solicitud.estado === "PENDIENTE" ? (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onOpenChange(false);
                  onAction(solicitud, "RECHAZAR");
                }}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onAction(solicitud, "APROBAR");
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobar
              </Button>
            </>
          ) : canManage && solicitud.estado === "APROBADA" ? (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onAction(solicitud, "INICIAR");
                }}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Iniciar misión
              </Button>
            </>
          ) : canManage && solicitud.estado === "EN_MISION" ? (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onAction(solicitud, "FINALIZAR");
                }}
              >
                <StopCircle className="mr-2 h-4 w-4" />
                Finalizar misión
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

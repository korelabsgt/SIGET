"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "react-toastify";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Car,
  AlertTriangle,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";
import { cambiarEstadoSolicitud } from "./lib/actions";
import { ESTADOS_SOLICITUD, type SolicitudRow } from "./lib/zod";
import { useVehiculosParaSolicitud } from "./lib/hooks";
import { esVehiculoDisponible, formatVehiculoOpcion } from "../flota/lib/helpers";
import type { VehiculoRow } from "../flota/lib/zod";

type ActionType = "APROBAR" | "RECHAZAR";

const ESTADO_VEHICULO_LABELS: Record<string, string> = {
  LIBRE: "Libre",
  DISPONIBLE: "Disponible",
  RESERVADO: "Reservado",
  EN_MANTENIMIENTO: "En mantenimiento",
};

const ACTION_META: Record<
  ActionType,
  {
    title: string;
    description: string;
    confirmLabel: string;
    icon: typeof CheckCircle;
    accentBar: string;
    iconWrap: string;
    iconColor: string;
    confirmBtn: string;
  }
> = {
  APROBAR: {
    title: "Aprobar solicitud",
    description: "Asigne un vehículo disponible para confirmar la aprobación.",
    confirmLabel: "Aprobar solicitud",
    icon: CheckCircle,
    accentBar: "bg-emerald-500",
    iconWrap: "bg-emerald-100 dark:bg-emerald-950",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    confirmBtn:
      "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500",
  },
  RECHAZAR: {
    title: "Rechazar solicitud",
    description: "La solicitud quedará marcada como rechazada y no podrá asignarse vehículo.",
    confirmLabel: "Rechazar solicitud",
    icon: XCircle,
    accentBar: "bg-red-500",
    iconWrap: "bg-red-100 dark:bg-red-950",
    iconColor: "text-red-600 dark:text-red-400",
    confirmBtn: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500",
  },
};

export function SolicitudActionModal({
  open,
  onOpenChange,
  solicitud,
  actionType,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solicitud: SolicitudRow | null;
  actionType: ActionType | null;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedVehiculo, setSelectedVehiculo] = useState("");
  const cargarLibres = open && actionType === "APROBAR";
  const { data: vehiculosLibres = [], isLoading: loadingVehiculos } =
    useVehiculosParaSolicitud(cargarLibres);

  useEffect(() => {
    if (!cargarLibres) {
      setSelectedVehiculo("");
      return;
    }

    if (!solicitud?.vehiculo_id || loadingVehiculos) return;
    setSelectedVehiculo(solicitud.vehiculo_id);
  }, [cargarLibres, solicitud?.vehiculo_id, loadingVehiculos]);

  const vehiculoPreferido = solicitud?.vehiculo ?? null;

  const vehiculosParaAprobar = useMemo(() => {
    const libres = vehiculosLibres.filter((v): v is VehiculoRow & { id: string } => Boolean(v.id));
    if (!vehiculoPreferido?.id) return libres;
    if (libres.some((v) => v.id === vehiculoPreferido.id)) return libres;

    const preferidoComoOpcion: VehiculoRow = {
      id: vehiculoPreferido.id,
      placa: vehiculoPreferido.placa,
      marca: vehiculoPreferido.marca,
      modelo: vehiculoPreferido.modelo,
      color: vehiculoPreferido.color?.trim() || "—",
      estado:
        vehiculoPreferido.estado === "LIBRE" ||
        vehiculoPreferido.estado === "RESERVADO" ||
        vehiculoPreferido.estado === "EN_MANTENIMIENTO"
          ? vehiculoPreferido.estado
          : "LIBRE",
      kilometraje_actual: vehiculoPreferido.kilometraje_actual ?? 0,
      vencimiento_seguro: null,
      vencimiento_circulacion: null,
      imagen_url: [],
    };

    return [preferidoComoOpcion, ...libres];
  }, [vehiculosLibres, vehiculoPreferido]);

  const preferidoFueraDeDisponibles = Boolean(
    vehiculoPreferido?.id &&
      !vehiculosLibres.some((v) => v.id === vehiculoPreferido.id) &&
      !esVehiculoDisponible({
        estado: (vehiculoPreferido.estado ?? "LIBRE") as VehiculoRow["estado"],
      }),
  );

  const estadoPreferidoLabel = vehiculoPreferido?.estado
    ? ESTADO_VEHICULO_LABELS[vehiculoPreferido.estado] ?? vehiculoPreferido.estado
    : null;

  const meta = actionType ? ACTION_META[actionType] : null;
  const Icon = meta?.icon ?? CheckCircle;

  const handleSubmit = () => {
    if (!solicitud || !actionType) return;

    if (actionType === "APROBAR" && !selectedVehiculo) {
      toast.error("Debe seleccionar un vehículo para aprobar la solicitud");
      return;
    }

    startTransition(async () => {
      const nuevoEstado: (typeof ESTADOS_SOLICITUD)[number] =
        actionType === "APROBAR" ? "APROBADA" : "RECHAZADA";

      const payload =
        actionType === "APROBAR" ? { vehiculo_id: selectedVehiculo } : undefined;

      const res = await cambiarEstadoSolicitud(solicitud.id, nuevoEstado, payload);
      if (!res.success) {
        toast.error(res.error || "Error al cambiar estado");
        return;
      }

      toast.success("Estado actualizado correctamente");
      onSaved();
      onOpenChange(false);
    });
  };

  const confirmDisabled =
    isPending ||
    (actionType === "APROBAR" &&
      (loadingVehiculos || vehiculosParaAprobar.length === 0 || !selectedVehiculo));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md gap-0 overflow-hidden rounded-2xl border-border p-0 sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {meta && <div className={cn("h-1 w-full", meta.accentBar)} />}

        <div className="space-y-5 bg-zinc-100 p-6 dark:bg-zinc-900">
          <DialogHeader className="space-y-4 text-left">
            <div className="flex items-start gap-4 pr-6">
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-xl",
                  meta?.iconWrap,
                )}
              >
                <Icon className={cn("size-6", meta?.iconColor)} />
              </div>
              <div className="min-w-0 space-y-1.5">
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {meta?.title}
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed">
                  {meta?.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {actionType === "APROBAR" && (
            <div className="space-y-4">
              {vehiculoPreferido ? (
                <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950/40">
                  <Car className="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400" />
                  <div className="min-w-0 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-sky-800 dark:text-sky-300">
                      Vehículo preferido del solicitante
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatVehiculoOpcion({
                        placa: vehiculoPreferido.placa,
                        marca: vehiculoPreferido.marca,
                        modelo: vehiculoPreferido.modelo,
                        color: vehiculoPreferido.color ?? "",
                      })}
                    </p>
                    {vehiculoPreferido.kilometraje_actual != null ? (
                      <p className="text-xs text-muted-foreground dark:text-zinc-400">
                        Odómetro:{" "}
                        {vehiculoPreferido.kilometraje_actual.toLocaleString("es-GT")} km
                      </p>
                    ) : null}
                    {estadoPreferidoLabel &&
                    vehiculoPreferido &&
                    !esVehiculoDisponible({
                      estado: (vehiculoPreferido.estado ?? "LIBRE") as VehiculoRow["estado"],
                    }) ? (
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        Estado en flota: {estadoPreferidoLabel}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="rounded-xl border border-border bg-zinc-50 px-4 py-3 text-xs leading-relaxed text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400">
                  El solicitante no indicó vehículo preferido.
                </p>
              )}

              <div className="space-y-2.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-foreground">
                  Confirmar vehículo asignado
                </Label>
              {loadingVehiculos ? (
                <div className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-zinc-50 text-sm text-muted-foreground dark:bg-zinc-800">
                  <Loader2 className="size-4 animate-spin" />
                  Cargando vehículos disponibles…
                </div>
              ) : vehiculosParaAprobar.length === 0 ? (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
                  <Car className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    No hay vehículos libres en este momento. Libere un vehículo en flota antes de
                    aprobar.
                  </p>
                </div>
              ) : (
                <>
                  <Select value={selectedVehiculo} onValueChange={setSelectedVehiculo}>
                    <SelectTrigger className="h-11 w-full cursor-pointer rounded-xl border border-celeste-trifinio/30 bg-white shadow-none dark:border-zinc-600 dark:bg-zinc-800">
                      <SelectValue placeholder="Seleccione un vehículo disponible" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      className="z-[200] max-h-60 w-[var(--radix-select-trigger-width)] border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900"
                    >
                      {vehiculosParaAprobar.map((v) => {
                        const esPreferido = v.id === vehiculoPreferido?.id;
                        const fueraDeLibres = esPreferido && preferidoFueraDeDisponibles;
                        const label = formatVehiculoOpcion(v);
                        const itemLabel = fueraDeLibres
                          ? `${label} · solicitado (no libre)`
                          : label;
                        if (!v.id) return null;
                        return (
                          <SelectItem
                            key={v.id}
                            value={v.id}
                            textValue={itemLabel}
                            className="cursor-pointer rounded-lg bg-white focus:bg-sky-50 dark:bg-zinc-900 dark:focus:bg-zinc-800"
                          >
                            {itemLabel}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {preferidoFueraDeDisponibles &&
                  selectedVehiculo === vehiculoPreferido?.id ? (
                    <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                      Este vehículo no está libre en flota
                      {estadoPreferidoLabel ? ` (${estadoPreferidoLabel.toLowerCase()})` : ""}. Puede
                      elegir otro disponible o resolver el estado antes de aprobar.
                    </p>
                  ) : null}
                </>
              )}
              </div>
            </div>
          )}

          {actionType === "RECHAZAR" && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
              <p className="text-sm leading-relaxed text-red-800 dark:text-red-300">
                Esta acción no se puede deshacer. El solicitante deberá crear una nueva solicitud
                si aún necesita el vehículo.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border bg-zinc-100 px-6 py-4 sm:flex-row sm:justify-end dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border-0 bg-zinc-200 px-6 text-[10px] font-bold uppercase tracking-widest text-zinc-700 transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={confirmDisabled}
            className={cn(
              "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 px-6 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              meta?.confirmBtn,
            )}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {meta?.confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

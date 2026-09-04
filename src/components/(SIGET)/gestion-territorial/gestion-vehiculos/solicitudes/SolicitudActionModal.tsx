"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "react-toastify";
import { Check, CheckCircle, XCircle, Ban } from "lucide";
import { Car, AlertTriangle, Loader2 } from "lucide-react";

import {
  GV_MODAL_ACTION_CONTENT_CLASS,
  GvModalFooter,
  GvModalShell,
  GV_MODAL_INSET_CLASS,
  ModalCancelButton,
} from "../lib/gv-modal-shell";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
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
    confirmAriaLabel: string;
    icon: typeof CheckCircle;
    accentBar: string;
    iconWrap: string;
    iconColor: string;
    confirmAccent: string;
    confirmMorphFrom: typeof CheckCircle;
    confirmMorphTo: typeof Check;
  }
> = {
  APROBAR: {
    title: "Aprobar solicitud",
    description: "Asigne un vehículo disponible para confirmar la aprobación.",
    confirmLabel: "Aprobar",
    confirmAriaLabel: "Aprobar solicitud",
    icon: CheckCircle,
    accentBar: "bg-emerald-500",
    iconWrap: "bg-emerald-100 dark:bg-emerald-950",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    confirmAccent: sigetAccent.guardar,
    confirmMorphFrom: CheckCircle,
    confirmMorphTo: Check,
  },
  RECHAZAR: {
    title: "Rechazar solicitud",
    description: "La solicitud quedará marcada como rechazada y no podrá asignarse vehículo.",
    confirmLabel: "Rechazar",
    confirmAriaLabel: "Rechazar solicitud",
    icon: XCircle,
    accentBar: "bg-red-500",
    iconWrap: "bg-red-100 dark:bg-red-950",
    iconColor: "text-red-600 dark:text-red-400",
    confirmAccent: sigetAccent.quitar,
    confirmMorphFrom: XCircle,
    confirmMorphTo: Ban,
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

  const onClose = () => onOpenChange(false);

  return (
    <GvModalShell
      open={open && Boolean(meta)}
      onClose={onClose}
      title={meta?.title ?? ""}
      subtitle={meta?.description}
      maxWidth="max-w-xl"
      fullHeight={false}
      contentClassName={GV_MODAL_ACTION_CONTENT_CLASS}
    >
      {meta ? (
        <div className="flex flex-col max-md:min-h-full max-md:flex-1 max-md:min-h-0">
          <div className={cn("h-1 w-full shrink-0", meta.accentBar)} />

          <div
            className={cn(
              GV_MODAL_INSET_CLASS,
              "space-y-5 max-md:min-h-0 max-md:flex-1 max-md:overflow-y-auto max-md:overscroll-contain md:flex-none md:overflow-visible",
            )}
          >
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

          <GvModalFooter>
            <ModalCancelButton onClick={onClose} disabled={isPending} />
            <SigetActionButton
              label={meta.confirmLabel}
              ariaLabel={meta.confirmAriaLabel}
              accentColor={meta.confirmAccent}
              morphFrom={meta.confirmMorphFrom}
              morphTo={meta.confirmMorphTo}
              onClick={handleSubmit}
              disabled={confirmDisabled}
              ariaBusy={isPending}
              className="w-auto shrink-0"
            />
          </GvModalFooter>
        </div>
      ) : null}
    </GvModalShell>
  );
}

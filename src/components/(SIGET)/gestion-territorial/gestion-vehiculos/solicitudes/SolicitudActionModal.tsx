"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "react-toastify";
import {
  CheckCircle,
  XCircle,
  PlayCircle,
  StopCircle,
  Loader2,
  MapPin,
  User,
  CalendarRange,
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

import { formatFechaCortaGt, formatHoraGt } from "@/lib/fechas-gt";
import { cn } from "@/lib/utils";
import { cambiarEstadoSolicitud } from "./lib/actions";
import { ESTADOS_SOLICITUD, type SolicitudRow } from "./lib/zod";
import { getVehiculos } from "../flota/lib/actions";
import { type VehiculoRow } from "../flota/lib/zod";

type ActionType = "APROBAR" | "RECHAZAR" | "INICIAR" | "FINALIZAR";

function formatVehiculoLabel(v: Pick<VehiculoRow, "placa" | "marca" | "modelo">) {
  return `${v.placa} · ${v.marca} ${v.modelo}`;
}

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
  INICIAR: {
    title: "Iniciar misión",
    description: "El vehículo pasará a estado en misión según la programación aprobada.",
    confirmLabel: "Iniciar misión",
    icon: PlayCircle,
    accentBar: "bg-sky-500",
    iconWrap: "bg-sky-100 dark:bg-sky-950",
    iconColor: "text-sky-600 dark:text-sky-400",
    confirmBtn: "bg-azul-trifinio text-white hover:opacity-90",
  },
  FINALIZAR: {
    title: "Finalizar misión",
    description: "Confirme que el vehículo ha retornado y la misión ha concluido.",
    confirmLabel: "Finalizar misión",
    icon: StopCircle,
    accentBar: "bg-sky-500",
    iconWrap: "bg-sky-100 dark:bg-sky-950",
    iconColor: "text-sky-600 dark:text-sky-400",
    confirmBtn: "bg-azul-trifinio text-white hover:opacity-90",
  },
};

function ResumenItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ResumenFechaHoraItem({
  icon: Icon,
  label,
  fechaIso,
}: {
  icon: typeof CalendarRange;
  label: string;
  fechaIso: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="tabular-nums text-sm font-bold text-foreground">{formatFechaCortaGt(fechaIso)}</p>
        <p className="tabular-nums text-sm font-semibold text-celeste-trifinio">{formatHoraGt(fechaIso)}</p>
      </div>
    </div>
  );
}

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
  const [vehiculosLibres, setVehiculosLibres] = useState<VehiculoRow[]>([]);
  const [selectedVehiculo, setSelectedVehiculo] = useState("");
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);

  useEffect(() => {
    if (open && actionType === "APROBAR") {
      setLoadingVehiculos(true);
      getVehiculos().then((data) => {
        setVehiculosLibres(data.filter((v) => v.estado === "LIBRE"));
        setLoadingVehiculos(false);
      });
    } else {
      setSelectedVehiculo("");
    }
  }, [open, actionType]);

  const meta = actionType ? ACTION_META[actionType] : null;
  const Icon = meta?.icon ?? CheckCircle;

  const handleSubmit = () => {
    if (!solicitud || !actionType) return;

    if (actionType === "APROBAR" && !selectedVehiculo) {
      toast.error("Debe seleccionar un vehículo para aprobar la solicitud");
      return;
    }

    startTransition(async () => {
      let nuevoEstado: (typeof ESTADOS_SOLICITUD)[number];
      if (actionType === "APROBAR") nuevoEstado = "APROBADA";
      else if (actionType === "RECHAZAR") nuevoEstado = "RECHAZADA";
      else if (actionType === "INICIAR") nuevoEstado = "EN_MISION";
      else nuevoEstado = "FINALIZADA";

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
      (loadingVehiculos || vehiculosLibres.length === 0 || !selectedVehiculo));

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

          {solicitud && (
            <div className="rounded-2xl border border-border bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-celeste-trifinio">
                Resumen de la solicitud
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <ResumenItem icon={MapPin} label="Destino" value={solicitud.destino} />
                <ResumenItem
                  icon={User}
                  label="Solicitante"
                  value={solicitud.solicitante?.nombre ?? "—"}
                />
                <ResumenFechaHoraItem
                  icon={CalendarRange}
                  label="Inicio"
                  fechaIso={solicitud.fecha_inicio}
                />
                <ResumenFechaHoraItem
                  icon={CalendarRange}
                  label="Fin estimado"
                  fechaIso={solicitud.fecha_fin_estimada}
                />
              </div>
            </div>
          )}

          {actionType === "APROBAR" && (
            <div className="space-y-2.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-foreground">
                Vehículo asignado
              </Label>
              {loadingVehiculos ? (
                <div className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-zinc-50 text-sm text-muted-foreground dark:bg-zinc-800">
                  <Loader2 className="size-4 animate-spin" />
                  Cargando vehículos disponibles…
                </div>
              ) : vehiculosLibres.length === 0 ? (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
                  <Car className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    No hay vehículos libres en este momento. Libere un vehículo en flota antes de
                    aprobar.
                  </p>
                </div>
              ) : (
                <Select value={selectedVehiculo} onValueChange={setSelectedVehiculo}>
                  <SelectTrigger className="h-11 w-full cursor-pointer rounded-xl border border-celeste-trifinio/30 bg-white shadow-none dark:border-zinc-600 dark:bg-zinc-800">
                    <SelectValue placeholder="Seleccione un vehículo disponible" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className="z-[200] max-h-60 w-[var(--radix-select-trigger-width)] border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900"
                  >
                    {vehiculosLibres.filter((v) => v.id).map((v) => {
                      const label = formatVehiculoLabel(v);
                      return (
                        <SelectItem
                          key={v.id}
                          value={v.id as string}
                          textValue={label}
                          className="cursor-pointer rounded-lg bg-white focus:bg-sky-50 dark:bg-zinc-900 dark:focus:bg-zinc-800"
                        >
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
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

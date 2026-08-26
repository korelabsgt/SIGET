"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Loader2, Car } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasajerosSelect } from "../PasajerosSelect";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { solicitudInputSchema, type SolicitudInput } from "../lib/zod";
import { useCrearSolicitud, useVehiculosParaSolicitud } from "../lib/hooks";
import { formatVehiculoOpcion } from "../../flota/lib/helpers";
import { aplicarMascaraEnInput, maskFechaHoraManual } from "../../lib/fechas-input";

const selectTriggerClass =
  "h-10 w-full cursor-pointer rounded-lg border border-border bg-zinc-50 shadow-none dark:border-zinc-700 dark:bg-zinc-950";
const selectContentClass =
  "z-[200] max-h-60 w-[var(--radix-select-trigger-width)] border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900";
const selectItemClass =
  "cursor-pointer rounded-lg bg-white focus:bg-sky-50 dark:bg-zinc-900 dark:focus:bg-zinc-800";

export function Crear({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const crear = useCrearSolicitud();
  const { data: vehiculosLibres = [], isLoading: loadingVehiculos } = useVehiculosParaSolicitud(open);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SolicitudInput>({
    resolver: zodResolver(solicitudInputSchema),
    defaultValues: {
      fecha_inicio: "",
      fecha_fin_estimada: "",
      destino: "",
      ruta_planificada: "",
      justificacion: "",
      pasajeros: "",
      vehiculo_id: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        fecha_inicio: "",
        fecha_fin_estimada: "",
        destino: "",
        ruta_planificada: "",
        justificacion: "",
        pasajeros: "",
        vehiculo_id: "",
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: SolicitudInput) => {
    try {
      const res = await crear.mutateAsync(data);
      if (!res.success) {
        toast.error(res.error || "Error al crear la solicitud");
        return;
      }
      toast.success("Solicitud creada y enviada a revisión");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ocurrió un error inesperado");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-h-[85vh] gap-3 overflow-y-auto p-4 sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-base">Nueva Solicitud de Vehículo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 py-1">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fecha_inicio">Fecha y Hora de Inicio</Label>
              <Input
                id="fecha_inicio"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={16}
                placeholder="DD/MM/AAAA HH:mm"
                {...register("fecha_inicio", {
                  onChange: (e) => {
                    aplicarMascaraEnInput(e.target, maskFechaHoraManual);
                  },
                })}
              />
              {errors.fecha_inicio && (
                <p className="text-xs text-red-500">{errors.fecha_inicio.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha_fin_estimada">Fecha y Hora de Retorno Estimado</Label>
              <Input
                id="fecha_fin_estimada"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={16}
                placeholder="DD/MM/AAAA HH:mm"
                {...register("fecha_fin_estimada", {
                  onChange: (e) => {
                    aplicarMascaraEnInput(e.target, maskFechaHoraManual);
                  },
                })}
              />
              {errors.fecha_fin_estimada && (
                <p className="text-xs text-red-500">{errors.fecha_fin_estimada.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Destino</Label>
            <Input placeholder="Ej. Ciudad de Guatemala" {...register("destino")} />
            {errors.destino && (
              <p className="text-xs text-red-500">{errors.destino.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Ruta Planificada (Opcional)</Label>
            <Input placeholder="Ej. CA-1 Occidente..." {...register("ruta_planificada")} />
          </div>

          <div className="space-y-1.5">
            <Label>Justificación de la Misión</Label>
            <Textarea
              placeholder="Detalle el motivo del viaje..."
              {...register("justificacion")}
              rows={2}
            />
            {errors.justificacion && (
              <p className="text-xs text-red-500">{errors.justificacion.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Car className="size-3.5" />
              Vehículo preferido (Opcional)
            </Label>
            <Controller
              control={control}
              name="vehiculo_id"
              render={({ field }) => (
                <Select
                  disabled={loadingVehiculos}
                  value={field.value || "none"}
                  onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue
                      placeholder={
                        loadingVehiculos ? "Cargando vehículos..." : "Sin preferencia de vehículo"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent position="popper" className={selectContentClass}>
                    <SelectItem value="none" className={selectItemClass}>
                      Sin preferencia de vehículo
                    </SelectItem>
                    {vehiculosLibres.filter((v) => v.id).map((v) => {
                      const label = formatVehiculoOpcion(v);
                      return (
                        <SelectItem
                          key={v.id}
                          value={v.id as string}
                          textValue={label}
                          className={selectItemClass}
                        >
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            />
            {!loadingVehiculos && vehiculosLibres.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No hay vehículos libres. Puede enviar la solicitud sin preferencia.
              </p>
            ) : null}
            {errors.vehiculo_id ? (
              <p className="text-xs text-red-500">{errors.vehiculo_id.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Pasajeros / Acompañantes (Opcional)</Label>
            <Controller
              control={control}
              name="pasajeros"
              render={({ field }) => (
                <PasajerosSelect
                  value={field.value || ""}
                  onChange={(val) => field.onChange(val)}
                />
              )}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={crear.isPending || isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={crear.isPending || isSubmitting}>
              {(crear.isPending || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Solicitud
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

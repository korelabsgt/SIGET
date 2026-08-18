import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { solicitudInputSchema, type SolicitudInput } from "./lib/zod";
import { createSolicitud } from "./lib/actions";

export function SolicitudFormModal({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
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

  const onSubmit = (data: SolicitudInput) => {
    startTransition(async () => {
      try {
        const res = await createSolicitud(data);
        if (!res.success) {
          toast.error(res.error || "Error al crear la solicitud");
          return;
        }
        toast.success("Solicitud creada y enviada a revisión");
        onSaved();
        onOpenChange(false);
      } catch (err: any) {
        toast.error(err?.message || "Ocurrió un error inesperado");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Solicitud de Vehículo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha y Hora de Inicio</Label>
              <Input type="datetime-local" {...register("fecha_inicio")} />
              {errors.fecha_inicio && (
                <p className="text-xs text-red-500">{errors.fecha_inicio.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Fecha y Hora de Retorno Estimado</Label>
              <Input type="datetime-local" {...register("fecha_fin_estimada")} />
              {errors.fecha_fin_estimada && (
                <p className="text-xs text-red-500">{errors.fecha_fin_estimada.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Destino</Label>
            <Input placeholder="Ej. Ciudad de Guatemala" {...register("destino")} />
            {errors.destino && (
              <p className="text-xs text-red-500">{errors.destino.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Ruta Planificada (Opcional)</Label>
            <Input placeholder="Ej. CA-1 Occidente..." {...register("ruta_planificada")} />
          </div>

          <div className="space-y-2">
            <Label>Justificación de la Misión</Label>
            <Textarea
              placeholder="Detalle el motivo del viaje..."
              {...register("justificacion")}
              rows={3}
            />
            {errors.justificacion && (
              <p className="text-xs text-red-500">{errors.justificacion.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Pasajeros / Acompañantes (Opcional)</Label>
            <Input placeholder="Ej. Juan Pérez, María López" {...register("pasajeros")} />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending || isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || isSubmitting}>
              {(isPending || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Solicitud
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

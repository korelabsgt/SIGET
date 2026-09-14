"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import {
  GvModalForm,
  GvModalFormBody,
  GvModalFooter,
  GvModalShell,
  GV_MODAL_SELECT_CONTENT_CLASS,
  GV_MODAL_SELECT_ITEM_CLASS,
  GV_MODAL_SELECT_TRIGGER_CLASS,
  ModalCancelButton,
  ModalSubmit,
} from "../../../gestion-vehiculos/lib/gv-modal-shell";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVehiculos } from "../../../gestion-vehiculos/flota/lib/hooks";
import { formatVehiculoOpcion } from "../../../gestion-vehiculos/flota/lib/helpers";

import {
  solicitudCombustibleInputSchema,
  type SolicitudCombustibleInput,
} from "../lib/zod";
import { useCrearSolicitudCombustible } from "../lib/hooks";

export function CrearSolicitudCombustible({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const crear = useCrearSolicitudCombustible();
  const { data: vehiculos = [], isLoading: loadingVehiculos } = useVehiculos();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SolicitudCombustibleInput>({
    resolver: zodResolver(solicitudCombustibleInputSchema) as never,
    defaultValues: {
      vehiculo_id: "",
      comentarios: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({ vehiculo_id: "", comentarios: "" });
  }, [open, reset]);

  const onClose = () => onOpenChange(false);

  const onSubmit = async (data: SolicitudCombustibleInput) => {
    try {
      const res = await crear.mutateAsync(data);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Solicitud enviada");
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la solicitud");
    }
  };

  return (
    <GvModalShell
      open={open}
      onClose={onClose}
      title="Nueva solicitud de combustible"
      subtitle="Vincule el vehículo de la misión"
      maxWidth="max-w-lg"
    >
      {open ? (
        <GvModalForm onSubmit={handleSubmit(onSubmit)}>
          <GvModalFormBody className="space-y-4">
            <div className="space-y-2">
              <Label>Vehículo</Label>
              <Controller
                control={control}
                name="vehiculo_id"
                render={({ field }) => (
                  <Select
                    disabled={loadingVehiculos}
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className={GV_MODAL_SELECT_TRIGGER_CLASS}>
                      <SelectValue
                        placeholder={
                          loadingVehiculos ? "Cargando vehículos..." : "Seleccione vehículo"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent position="popper" className={GV_MODAL_SELECT_CONTENT_CLASS}>
                      {vehiculos
                        .filter((v) => v.id)
                        .map((v) => {
                          const label = formatVehiculoOpcion(v);
                          return (
                            <SelectItem
                              key={v.id}
                              value={v.id as string}
                              textValue={label}
                              className={GV_MODAL_SELECT_ITEM_CLASS}
                            >
                              {label}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.vehiculo_id ? (
                <p className="text-xs text-red-500">{errors.vehiculo_id.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="comentarios">Comentarios (opcional)</Label>
              <Textarea
                id="comentarios"
                rows={3}
                placeholder="Motivo del vale, destino o detalle operativo..."
                {...register("comentarios")}
              />
            </div>
          </GvModalFormBody>

          <GvModalFooter>
            <ModalCancelButton onClick={onClose} disabled={crear.isPending || isSubmitting} />
            <ModalSubmit disabled={crear.isPending || isSubmitting} label="Enviar" />
          </GvModalFooter>
        </GvModalForm>
      ) : null}
    </GvModalShell>
  );
}

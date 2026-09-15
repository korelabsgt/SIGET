"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
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
import { useSolicitudes } from "../../../gestion-vehiculos/solicitudes/lib/hooks";

import {
  solicitudCombustibleInputSchema,
  type SolicitudCombustibleInput,
} from "../lib/zod";
import {
  formatSolicitudVehiculoOpcionCombustible,
  misionesParaVinculoCombustible,
  SIN_SOLICITUD_VEHICULO_VINCULO,
} from "../lib/helpers";
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
  const { data: solicitudesVehiculo = [], isLoading: loadingSolicitudesVehiculo } =
    useSolicitudes();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SolicitudCombustibleInput>({
    resolver: zodResolver(solicitudCombustibleInputSchema) as never,
    defaultValues: {
      vehiculo_id: "",
      solicitud_vehiculo_id: "",
      comentarios: "",
    },
  });

  const solicitudVehiculoId = useWatch({ control, name: "solicitud_vehiculo_id" });

  const misionesVinculables = useMemo(
    () => misionesParaVinculoCombustible(solicitudesVehiculo),
    [solicitudesVehiculo],
  );

  const misionSeleccionada = useMemo(
    () => misionesVinculables.find((s) => s.id === solicitudVehiculoId) ?? null,
    [misionesVinculables, solicitudVehiculoId],
  );

  const vehiculoFijadoPorMision = misionSeleccionada?.vehiculo_id ?? null;

  const vehiculosEnSelector = useMemo(() => {
    const lista = vehiculos.filter((v) => v.id);
    if (vehiculoFijadoPorMision) {
      return lista.filter((v) => v.id === vehiculoFijadoPorMision);
    }
    return lista;
  }, [vehiculos, vehiculoFijadoPorMision]);

  useEffect(() => {
    if (!open) return;
    reset({ vehiculo_id: "", solicitud_vehiculo_id: "", comentarios: "" });
  }, [open, reset]);

  useEffect(() => {
    if (!vehiculoFijadoPorMision) return;
    setValue("vehiculo_id", vehiculoFijadoPorMision);
  }, [vehiculoFijadoPorMision, setValue]);

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
      subtitle="Vincule la misión y luego el vehículo que usará el vale"
      maxWidth="max-w-lg"
    >
      {open ? (
        <GvModalForm onSubmit={handleSubmit(onSubmit)}>
          <GvModalFormBody className="space-y-4">
            <div className="space-y-2">
              <Label>Misión vinculada (opcional)</Label>
              <Controller
                control={control}
                name="solicitud_vehiculo_id"
                render={({ field }) => (
                  <Select
                    disabled={loadingSolicitudesVehiculo || crear.isPending}
                    value={field.value?.trim() ? field.value : SIN_SOLICITUD_VEHICULO_VINCULO}
                    onValueChange={(value) => {
                      const next =
                        value === SIN_SOLICITUD_VEHICULO_VINCULO ? "" : value;
                      field.onChange(next);
                      if (value === SIN_SOLICITUD_VEHICULO_VINCULO) {
                        setValue("vehiculo_id", "");
                        return;
                      }
                      const mision = misionesVinculables.find((s) => s.id === next);
                      if (!mision?.vehiculo_id) {
                        setValue("vehiculo_id", "");
                      }
                    }}
                  >
                    <SelectTrigger className={GV_MODAL_SELECT_TRIGGER_CLASS}>
                      <SelectValue
                        placeholder={
                          loadingSolicitudesVehiculo
                            ? "Cargando misiones..."
                            : "Sin vincular"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent position="popper" className={GV_MODAL_SELECT_CONTENT_CLASS}>
                      <SelectItem
                        value={SIN_SOLICITUD_VEHICULO_VINCULO}
                        textValue="Sin vincular"
                        className={GV_MODAL_SELECT_ITEM_CLASS}
                      >
                        Sin vincular
                      </SelectItem>
                      {misionesVinculables.map((solicitud) => {
                        const label = formatSolicitudVehiculoOpcionCombustible(solicitud);
                        return (
                          <SelectItem
                            key={solicitud.id}
                            value={solicitud.id}
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
              {errors.solicitud_vehiculo_id ? (
                <p className="text-xs text-red-500">{errors.solicitud_vehiculo_id.message}</p>
              ) : null}
              {!loadingSolicitudesVehiculo && misionesVinculables.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No hay misiones activas para vincular. Cree una en Gestión de vehículos o continúe
                  sin misión.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Vehículo</Label>
              <Controller
                control={control}
                name="vehiculo_id"
                render={({ field }) => (
                  <Select
                    disabled={
                      loadingVehiculos || Boolean(vehiculoFijadoPorMision) || crear.isPending
                    }
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className={GV_MODAL_SELECT_TRIGGER_CLASS}>
                      <SelectValue
                        placeholder={
                          loadingVehiculos
                            ? "Cargando vehículos..."
                            : vehiculoFijadoPorMision
                              ? "Vehículo asignado a la misión"
                              : "Seleccione vehículo"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent position="popper" className={GV_MODAL_SELECT_CONTENT_CLASS}>
                      {vehiculosEnSelector.map((v) => {
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
              {vehiculoFijadoPorMision ? (
                <p className="text-xs text-muted-foreground">
                  El vehículo se tomó de la misión seleccionada.
                </p>
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

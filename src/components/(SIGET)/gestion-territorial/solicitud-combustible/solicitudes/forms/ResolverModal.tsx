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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useRequisicionesCombustible } from "../../requisiciones/lib/hooks";
import {
  formatDenominacion,
  formatRequisicionResumen,
  cuponesDisponiblesRequisicion,
} from "../../requisiciones/lib/helpers";
import {
  resolverSolicitudCombustibleSchema,
  type ResolverSolicitudCombustibleInput,
  type SolicitudCombustibleRow,
} from "../lib/zod";
import {
  formatSolicitanteNombre,
  formatVehiculoSolicitudCombustible,
} from "../lib/helpers";
import { useResolverSolicitudCombustible } from "../lib/hooks";

export function ResolverSolicitudCombustibleModal({
  open,
  onOpenChange,
  solicitud,
  accion,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solicitud: SolicitudCombustibleRow | null;
  accion: "APROBAR" | "RECHAZAR" | null;
  onSaved?: () => void;
}) {
  const resolver = useResolverSolicitudCombustible();
  const { data: requisiciones = [] } = useRequisicionesCombustible();

  const lotesDisponibles = requisiciones.filter((row) => cuponesDisponiblesRequisicion(row) > 0);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResolverSolicitudCombustibleInput>({
    resolver: zodResolver(resolverSolicitudCombustibleSchema) as never,
    defaultValues: {
      accion: "APROBAR",
      requisicion_id: "",
      cantidad_cupones: 1,
      comentarios: "",
    },
  });

  useEffect(() => {
    if (!open || !accion) return;
    const primerLote = requisiciones.find((row) => cuponesDisponiblesRequisicion(row) > 0);
    reset({
      accion,
      requisicion_id: primerLote?.id ?? "",
      cantidad_cupones: 1,
      comentarios: solicitud?.comentarios ?? "",
    });
  }, [open, accion, reset, solicitud?.comentarios, requisiciones]);

  const onClose = () => onOpenChange(false);

  const onSubmit = async (data: ResolverSolicitudCombustibleInput) => {
    if (!solicitud) return;
    try {
      const res = await resolver.mutateAsync({ id: solicitud.id, input: data });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(data.accion === "APROBAR" ? "Solicitud aprobada" : "Solicitud rechazada");
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo resolver la solicitud");
    }
  };

  const esAprobacion = accion === "APROBAR";
  const requisicionId = watch("requisicion_id");
  const loteSeleccionado = lotesDisponibles.find((row) => row.id === requisicionId);

  return (
    <GvModalShell
      open={open}
      onClose={onClose}
      title={esAprobacion ? "Aprobar solicitud" : "Rechazar solicitud"}
      maxWidth="max-w-lg"
    >
      {open && solicitud && accion ? (
        <GvModalForm onSubmit={handleSubmit(onSubmit)}>
          <GvModalFormBody className="space-y-4">
            <input type="hidden" {...register("accion")} />

            <div className="rounded-xl border border-border bg-zinc-50 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-950">
              <p className="font-semibold text-foreground">
                {formatVehiculoSolicitudCombustible(solicitud)}
              </p>
              <p className="mt-1 text-muted-foreground">
                Solicitante: {formatSolicitanteNombre(solicitud)}
              </p>
            </div>

            {esAprobacion ? (
              <>
                <div className="space-y-2">
                  <Label>Lote de cupones</Label>
                  <Controller
                    control={control}
                    name="requisicion_id"
                    render={({ field }) => (
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger className={GV_MODAL_SELECT_TRIGGER_CLASS}>
                          <SelectValue placeholder="Seleccione lote" />
                        </SelectTrigger>
                        <SelectContent position="popper" className={GV_MODAL_SELECT_CONTENT_CLASS}>
                          {lotesDisponibles.map((row) => (
                            <SelectItem
                              key={row.id}
                              value={row.id}
                              textValue={formatRequisicionResumen(row)}
                              className={GV_MODAL_SELECT_ITEM_CLASS}
                            >
                              {formatRequisicionResumen(row)} · disp. {row.disponibles}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.requisicion_id ? (
                    <p className="text-xs text-red-500">{errors.requisicion_id.message}</p>
                  ) : null}
                  {lotesDisponibles.length === 0 ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      No hay lotes con cupones disponibles. Registre una requisición primero.
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cantidad_cupones">Cupones a entregar</Label>
                  <Input
                    id="cantidad_cupones"
                    type="number"
                    min={1}
                    max={loteSeleccionado?.disponibles ?? undefined}
                    {...register("cantidad_cupones")}
                  />
                  {loteSeleccionado ? (
                    <p className="text-xs text-muted-foreground">
                      Denominación {formatDenominacion(loteSeleccionado.denominacion)} · disponibles{" "}
                      {loteSeleccionado.disponibles}
                    </p>
                  ) : null}
                  {errors.cantidad_cupones ? (
                    <p className="text-xs text-red-500">{errors.cantidad_cupones.message}</p>
                  ) : null}
                </div>
              </>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="comentarios_resolver">Comentarios</Label>
              <Textarea id="comentarios_resolver" rows={3} {...register("comentarios")} />
            </div>
          </GvModalFormBody>

          <GvModalFooter>
            <ModalCancelButton onClick={onClose} disabled={resolver.isPending || isSubmitting} />
            <ModalSubmit
              disabled={resolver.isPending || isSubmitting || (esAprobacion && lotesDisponibles.length === 0)}
              label={esAprobacion ? "Aprobar" : "Rechazar"}
            />
          </GvModalFooter>
        </GvModalForm>
      ) : null}
    </GvModalShell>
  );
}

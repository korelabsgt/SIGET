"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Car } from "lucide-react";

import {
  GvModalForm,
  GvModalFormBody,
  GvModalFooter,
  GvModalShell,
  ModalCancelButton,
  ModalSubmit,
} from "../../lib/gv-modal-shell";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasajerosSelect } from "../PasajerosSelect";
import { PilotoSelect } from "../PilotoSelect";
import { useUser, useUserContext } from "@/components/(base)/providers/UserProvider";
import { useQuery } from "@tanstack/react-query";
import { canElegirSolicitanteAlCrearSolicitudVehiculo } from "../../lib/permissions";
import { getBitacoraPendienteBloqueosParaUsuario } from "../../lib/bitacora-pendiente-actions";
import { GV_QUERY_OPTIONS } from "../../lib/query";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { solicitudInputSchema, type SolicitudInput } from "../lib/zod";
import { useCrearSolicitud, useVehiculosParaSolicitud } from "../lib/hooks";
import { formatVehiculoOpcion } from "../../flota/lib/helpers";
import { GvFechaHoraPickerInput } from "../../lib/gv-fecha-input";
import {
  mensajeBloqueoNuevaSolicitudVehiculo,
} from "../../lib/bitacora-pendiente-bloqueo";
import { GvBitacoraPendienteAviso } from "../../lib/GvBitacoraPendienteAviso";

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
  const user = useUser();
  const { effectiveRole } = useUserContext();
  const puedeElegirSolicitante = canElegirSolicitanteAlCrearSolicitudVehiculo(effectiveRole);
  const nombreUsuarioActual =
    (typeof user?.user_metadata?.nombre === "string" ? user.user_metadata.nombre.trim() : "") ||
    user?.email ||
    "Usted";
  const { data: vehiculosBase = [], isLoading: loadingVehiculos } = useVehiculosParaSolicitud(open);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SolicitudInput>({
    resolver: zodResolver(solicitudInputSchema) as never,
    defaultValues: {
      fecha_inicio: "",
      destino: "",
      justificacion: "",
      pasajeros: "",
      vehiculo_id: "",
      piloto_modo: "solicitante",
      piloto_id: "",
      solicitante_id: user?.id ?? "",
    },
  });

  const pilotoModo = watch("piloto_modo");
  const solicitanteId = watch("solicitante_id") || user?.id || "";
  const solicitanteEsUsuarioActual = Boolean(user?.id && solicitanteId === user.id);

  const { data: bloqueos } = useQuery({
    queryKey: ["gv-bitacora-pendiente-bloqueos", solicitanteId],
    queryFn: () => getBitacoraPendienteBloqueosParaUsuario(solicitanteId),
    enabled: open && Boolean(solicitanteId),
    ...GV_QUERY_OPTIONS,
  });
  const bloqueoVehiculo = bloqueos?.vehiculo ?? null;

  useEffect(() => {
    if (open) {
      reset({
        fecha_inicio: "",
        destino: "",
        justificacion: "",
        pasajeros: "",
        vehiculo_id: "",
        piloto_modo: "solicitante",
        piloto_id: "",
        solicitante_id: user?.id ?? "",
      });
    }
  }, [open, reset, user?.id]);

  const onSubmit = async (data: SolicitudInput) => {
    try {
      const res = await crear.mutateAsync({
        ...data,
        solicitante_id: data.solicitante_id?.trim() || user?.id || "",
      });
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

  const onClose = () => onOpenChange(false);

  return (
    <GvModalShell
      open={open}
      onClose={onClose}
      title="Nueva Solicitud de Vehículo"
      maxWidth="max-w-lg"
    >
      {open ? (
        <GvModalForm onSubmit={handleSubmit(onSubmit)}>
          <GvModalFormBody className="space-y-3">
          {bloqueoVehiculo ? (
            <GvBitacoraPendienteAviso
              mensaje={mensajeBloqueoNuevaSolicitudVehiculo(bloqueoVehiculo)}
            />
          ) : null}

          <div className="space-y-1.5">
            <Label>Solicitante</Label>
            <p className="text-xs text-muted-foreground">
              Usuario al que se asigna la solicitud de vehículo.
            </p>
            {puedeElegirSolicitante ? (
              <Controller
                control={control}
                name="solicitante_id"
                render={({ field }) => (
                  <PilotoSelect
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            ) : (
              <Input
                readOnly
                disabled
                value={nombreUsuarioActual}
                className="bg-zinc-100 dark:bg-zinc-900"
              />
            )}
            {errors.solicitante_id ? (
              <p className="text-xs text-red-500">{errors.solicitante_id.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fecha_inicio">Fecha y Hora de Inicio</Label>
            <GvFechaHoraPickerInput
              id="fecha_inicio"
              solicitudNoPasadaGt
              {...register("fecha_inicio")}
            />
            {errors.fecha_inicio && (
              <p className="text-xs text-red-500">{errors.fecha_inicio.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Destino</Label>
            <Input placeholder="Ej. Ciudad de Guatemala" {...register("destino")} />
            {errors.destino && (
              <p className="text-xs text-red-500">{errors.destino.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Piloto del vehículo</Label>
            <p className="text-xs text-muted-foreground">
              {solicitanteEsUsuarioActual
                ? "Puede ser quien solicita o buscar otro usuario registrado."
                : "Puede ser el solicitante o buscar otro usuario registrado."}
            </p>
            <Controller
              control={control}
              name="piloto_modo"
              render={({ field }) => (
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      className="size-4 accent-[#2c5f9b]"
                      checked={field.value === "solicitante"}
                      onChange={() => field.onChange("solicitante")}
                    />
                    <span>{solicitanteEsUsuarioActual ? "Yo conduzco" : "El solicitante conduce"}</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      className="size-4 accent-[#2c5f9b]"
                      checked={field.value === "otro"}
                      onChange={() => field.onChange("otro")}
                    />
                    <span>Otra persona</span>
                  </label>
                </div>
              )}
            />
            {pilotoModo === "otro" ? (
              <Controller
                control={control}
                name="piloto_id"
                render={({ field }) => (
                  <PilotoSelect
                    value={field.value || ""}
                    onChange={field.onChange}
                    excludeUserId={user?.id}
                  />
                )}
              />
            ) : null}
            {errors.piloto_id ? (
              <p className="text-xs text-red-500">{errors.piloto_id.message}</p>
            ) : null}
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
                    {vehiculosBase.filter((v) => v.id).map((v) => {
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
            {!loadingVehiculos && vehiculosBase.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No hay vehículos disponibles para preferencia en este momento.
              </p>
            ) : null}
            {errors.vehiculo_id ? (
              <p className="text-xs text-red-500">{errors.vehiculo_id.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Pasajeros / Acompañantes (Opcional)</Label>
            <p className="text-xs text-muted-foreground">
              Busque y seleccione usuarios registrados en el sistema.
            </p>
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

          </GvModalFormBody>

          <GvModalFooter>
            <ModalCancelButton onClick={onClose} disabled={crear.isPending || isSubmitting} />
            <ModalSubmit
              disabled={Boolean(bloqueoVehiculo) || crear.isPending || isSubmitting}
              label="Enviar"
            />
          </GvModalFooter>
        </GvModalForm>
      ) : null}
    </GvModalShell>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight, Send, Check, X } from "lucide";
import { Car } from "lucide-react";
import type { ZodError } from "zod";

import {
  GvModalForm,
  GvModalFormBody,
  GvModalFooter,
  GvModalShell,
  modalAccentClass,
} from "../../lib/gv-modal-shell";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
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
import { SolicitudVehiculoCalendarioRango } from "../SolicitudVehiculoCalendarioRango";
import { useUser, useUserContext } from "@/components/(base)/providers/UserProvider";
import { canElegirSolicitanteAlCrearSolicitudVehiculo } from "../../lib/permissions";
import { useBitacoraPendienteBloqueosParaUsuario } from "../../lib/bitacora-pendiente-hooks";
import { PilotoModoSwitch } from "../PilotoModoSwitch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  SOLICITUD_WIZARD_PASOS,
  solicitudInputSchema,
  solicitudWizardPaso1Schema,
  solicitudWizardPaso2Schema,
  type SolicitudInput,
} from "../lib/zod";
import {
  useCrearSolicitud,
  useReservasCalendarioVehiculo,
  useVehiculosParaSolicitud,
} from "../lib/hooks";
import { formatVehiculoOpcion } from "../../flota/lib/helpers";
import { cn } from "@/lib/utils";
import { mensajeBloqueoNuevaSolicitudVehiculo } from "../../lib/bitacora-pendiente-bloqueo";
import { GvBitacoraPendienteAviso } from "../../lib/GvBitacoraPendienteAviso";

const WIZARD_PASOS_META = [{ titulo: "Solicitud" }, { titulo: "Misión" }] as const;
const WIZARD_CONTENIDO_MIN_H = "min-h-[34rem]";
const CALENDARIO_AYUDA = "Seleccione un día o el rango de días que lo usará.";

const selectTriggerClass =
  "h-10 w-full cursor-pointer rounded-lg border border-border bg-zinc-50 shadow-none dark:border-zinc-700 dark:bg-zinc-950";
const selectContentClass =
  "z-[250] max-h-60 w-[var(--radix-select-trigger-width)] border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900";
const selectItemClass =
  "cursor-pointer rounded-lg bg-white focus:bg-sky-50 dark:bg-zinc-900 dark:focus:bg-zinc-800";

function aplicarErroresZod(
  error: ZodError,
  setError: (name: keyof SolicitudInput, err: { message: string }) => void,
  clearErrors: (names?: (keyof SolicitudInput)[]) => void,
  fields: (keyof SolicitudInput)[],
) {
  clearErrors(fields);
  for (const issue of error.issues) {
    const path = issue.path[0];
    if (typeof path === "string" && fields.includes(path as keyof SolicitudInput)) {
      setError(path as keyof SolicitudInput, { message: issue.message });
    }
  }
}

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
  const { data: vehiculosBase = [], isLoading: loadingVehiculos } = useVehiculosParaSolicitud(
    open,
  );

  const [wizardStep, setWizardStep] = useState(1);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SolicitudInput>({
    resolver: zodResolver(solicitudInputSchema) as never,
    defaultValues: {
      fecha_inicio: "",
      fecha_fin_estimada: "",
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
  const fechaInicioManual = watch("fecha_inicio");
  const fechaFinManual = watch("fecha_fin_estimada");
  const vehiculoId = watch("vehiculo_id");
  const solicitanteEsUsuarioActual = Boolean(user?.id && solicitanteId === user.id);

  const { data: reservasVehiculo = [], isLoading: loadingReservas } = useReservasCalendarioVehiculo(
    vehiculoId ?? "",
    open && Boolean(vehiculoId),
  );

  const { data: bloqueos } = useBitacoraPendienteBloqueosParaUsuario(
    solicitanteId,
    open && Boolean(solicitanteId),
  );
  const bloqueoVehiculo = bloqueos?.vehiculo ?? null;

  useEffect(() => {
    if (open) {
      setWizardStep(1);
      reset({
        fecha_inicio: "",
        fecha_fin_estimada: "",
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

  const bloqueado = Boolean(bloqueoVehiculo);
  const enviando = crear.isPending || isSubmitting;
  const fechasAplicadas = Boolean(fechaInicioManual?.trim() && fechaFinManual?.trim());

  const aplicarFechasCalendario = useCallback(
    (inicio: string, fin: string) => {
      const vacio = !inicio.trim() && !fin.trim();
      setValue("fecha_inicio", inicio, { shouldValidate: false });
      setValue("fecha_fin_estimada", fin, { shouldValidate: false });
      if (vacio) {
        clearErrors(["fecha_inicio", "fecha_fin_estimada"]);
      }
    },
    [clearErrors, setValue],
  );

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

  const handleAtras = () => {
    setWizardStep((s) => Math.max(1, s - 1));
  };

  const seleccionarVehiculo = (id: string) => {
    if (vehiculoId !== id) {
      setValue("fecha_inicio", "");
      setValue("fecha_fin_estimada", "");
      clearErrors(["fecha_inicio", "fecha_fin_estimada"]);
    }
    setValue("vehiculo_id", id);
    clearErrors(["vehiculo_id"]);
  };

  const handleSiguiente = () => {
    const values = getValues();

    if (wizardStep === 1) {
      const result = solicitudWizardPaso1Schema.safeParse({
        solicitante_id: values.solicitante_id,
        vehiculo_id: values.vehiculo_id,
        fecha_inicio: values.fecha_inicio,
        fecha_fin_estimada: values.fecha_fin_estimada,
      });
      if (!result.success) {
        aplicarErroresZod(result.error, setError, clearErrors, [
          "solicitante_id",
          "vehiculo_id",
          "fecha_inicio",
          "fecha_fin_estimada",
        ]);
        toast.warn("Revise solicitante, vehículo y el rango de fechas en el calendario.");
        return;
      }
      setWizardStep(2);
    }
  };

  const handleEnviarClick = () => {
    const values = getValues();
    const result = solicitudWizardPaso2Schema.safeParse({
      destino: values.destino,
      piloto_modo: values.piloto_modo,
      piloto_id: values.piloto_id,
      justificacion: values.justificacion,
      pasajeros: values.pasajeros,
    });
    if (!result.success) {
      aplicarErroresZod(result.error, setError, clearErrors, [
        "destino",
        "piloto_modo",
        "piloto_id",
        "justificacion",
        "pasajeros",
      ]);
      toast.warn("Revise los datos de la misión.");
      return;
    }
    void handleSubmit(onSubmit)();
  };

  return (
    <GvModalShell
      open={open}
      onClose={onClose}
      title="Nueva Solicitud de Vehículo"
      maxWidth="max-w-lg"
    >
      {open ? (
        <GvModalForm
          onSubmit={(e) => {
            e.preventDefault();
            if (wizardStep < SOLICITUD_WIZARD_PASOS) {
              handleSiguiente();
            } else {
              handleEnviarClick();
            }
          }}
        >
          <GvModalFormBody className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-1.5">
                {WIZARD_PASOS_META.map((paso, index) => {
                  const pasoNum = index + 1;
                  const activo = pasoNum === wizardStep;
                  const completado = pasoNum < wizardStep;
                  return (
                    <div key={paso.titulo} className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "h-1 rounded-full transition-colors",
                          activo || completado
                            ? "bg-[#2c5f9b] dark:bg-[#6f9fd4]"
                            : "bg-zinc-200 dark:bg-zinc-700",
                        )}
                      />
                      <p
                        className={cn(
                          "mt-1 truncate text-[10px] font-semibold",
                          activo ? modalAccentClass : "text-muted-foreground",
                        )}
                      >
                        {paso.titulo}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {bloqueoVehiculo ? (
              <GvBitacoraPendienteAviso
                mensaje={mensajeBloqueoNuevaSolicitudVehiculo(bloqueoVehiculo)}
              />
            ) : null}

            <div className={cn("space-y-3", WIZARD_CONTENIDO_MIN_H)}>
              <div className={cn("space-y-3", wizardStep !== 1 && "hidden")} aria-hidden={wizardStep !== 1}>
                    <div className="space-y-1.5">
                      <Label>Solicitante</Label>
                      {puedeElegirSolicitante ? (
                        <Controller
                          control={control}
                          name="solicitante_id"
                          render={({ field }) => (
                            <PilotoSelect value={field.value ?? ""} onChange={field.onChange} />
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

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Car className="size-3.5" />
                        Vehículo
                      </Label>
                      <Controller
                        control={control}
                        name="vehiculo_id"
                        render={({ field }) => (
                          <Select
                            disabled={loadingVehiculos || vehiculosBase.length === 0}
                            value={field.value?.trim() ? field.value : undefined}
                            onValueChange={(val) => seleccionarVehiculo(val)}
                          >
                            <SelectTrigger className={selectTriggerClass}>
                              <SelectValue
                                placeholder={
                                  loadingVehiculos
                                    ? "Cargando vehículos…"
                                    : vehiculosBase.length === 0
                                      ? "Sin vehículos disponibles"
                                      : "Seleccione un vehículo"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent position="popper" className={selectContentClass}>
                              {vehiculosBase
                                .filter((v) => v.id)
                                .map((v) => {
                                  const id = v.id as string;
                                  const label = formatVehiculoOpcion(v);
                                  return (
                                    <SelectItem
                                      key={id}
                                      value={id}
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
                          No hay vehículos disponibles en este momento.
                        </p>
                      ) : null}
                      {errors.vehiculo_id ? (
                        <p className="text-xs text-red-500">{errors.vehiculo_id.message}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">{CALENDARIO_AYUDA}</p>
                    </div>

                    <div className="space-y-2">
                      {loadingReservas && vehiculoId ? (
                        <p className="text-xs text-muted-foreground">
                          Cargando reservas del vehículo…
                        </p>
                      ) : null}
                      <SolicitudVehiculoCalendarioRango
                        key={vehiculoId || "sin-vehiculo"}
                        vehiculoId={vehiculoId ?? ""}
                        reservas={vehiculoId ? reservasVehiculo : []}
                        fechaInicioManual={fechaInicioManual}
                        fechaFinManual={fechaFinManual}
                        onAplicarFechas={aplicarFechasCalendario}
                        habilitado={Boolean(vehiculoId) && !loadingReservas}
                      />
                    </div>
              </div>

              <div className={cn("space-y-3", wizardStep !== 2 && "hidden")} aria-hidden={wizardStep !== 2}>
                    <div className="space-y-1.5">
                      <Label>Destino</Label>
                      <Input placeholder="Ej. Ciudad de Guatemala" {...register("destino")} />
                      {errors.destino ? (
                        <p className="text-xs text-red-500">{errors.destino.message}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label>Piloto del vehículo</Label>
                      <Controller
                        control={control}
                        name="piloto_modo"
                        render={({ field }) => (
                          <PilotoModoSwitch
                            value={field.value}
                            labelSolicitante={
                              solicitanteEsUsuarioActual
                                ? "Yo conduzco"
                                : "El solicitante conduce"
                            }
                            onChange={(modo) => {
                              field.onChange(modo);
                              if (modo === "solicitante") {
                                setValue("piloto_id", "");
                              }
                            }}
                          />
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
                        rows={3}
                      />
                      {errors.justificacion ? (
                        <p className="text-xs text-red-500">{errors.justificacion.message}</p>
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
              </div>
            </div>
          </GvModalFormBody>

          <GvModalFooter className="flex flex-wrap items-center justify-center gap-2">
            {wizardStep > 1 ? (
              <SigetActionButton
                label="Atrás"
                accentColor={sigetAccent.cancelar}
                morphFrom={ChevronLeft}
                morphTo={ChevronLeft}
                morphOnHover={false}
                onClick={handleAtras}
                disabled={enviando}
                className="w-auto shrink-0"
              />
            ) : (
              <SigetActionButton
                label="Cancelar"
                accentColor={sigetAccent.cancelar}
                morphFrom={X}
                morphTo={X}
                morphOnHover={false}
                onClick={onClose}
                disabled={enviando}
                className="w-auto shrink-0"
              />
            )}
            {wizardStep < SOLICITUD_WIZARD_PASOS ? (
              <SigetActionButton
                label="Siguiente"
                accentColor={sigetAccent.crear}
                morphFrom={ChevronRight}
                morphTo={ChevronRight}
                morphOnHover={false}
                type="submit"
                disabled={bloqueado || enviando || (wizardStep === 1 && !fechasAplicadas)}
                className="w-auto shrink-0"
              />
            ) : (
              <SigetActionButton
                label="Enviar"
                accentColor={sigetAccent.guardar}
                morphFrom={Send}
                morphTo={Check}
                type="submit"
                disabled={bloqueado || enviando}
                ariaBusy={enviando}
                className="w-auto shrink-0"
              />
            )}
          </GvModalFooter>
        </GvModalForm>
      ) : null}
    </GvModalShell>
  );
}

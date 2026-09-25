"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CirclePlus,
  EllipsisVertical,
  MoreVertical,
  PenSquare,
  Pencil,
  Plus,
  Trash,
  Trash2,
} from "lucide";
import { Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "react-toastify";

import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import {
  rutaStorageVehiculos,
  VEHICULOS_STORAGE_BUCKET,
  VEHICULOS_STORAGE_CARPETA_RECIBOS,
} from "../../lib/storage";
import {
  comprimirImagenVehiculo,
  IMAGEN_VEHICULO_ACCEPT_ATTR,
  IMAGEN_VEHICULO_CAPTURE_ATTR,
} from "../../lib/imagen-vehiculo-compress";
import { BITACORA_RECIBO_PENDIENTE } from "../lib/helpers";
import { GvMorphIcon } from "../../lib/morph-icon";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { type BitacoraInput, bitacoraInputSchema } from "../lib/zod";
import { useBitacoraFormOptions, useCrearBitacora } from "../lib/hooks";
import { type VehiculoRow } from "../../flota/lib/zod";
import { ConsultaAveriaModal } from "./ConsultaAveriaModal";
import { ReportarAveriaModal, type VehiculoAveriaFijo } from "../../mantenimiento/forms/ReportarAveriaModal";
import { vehiculoTieneAveriaActiva } from "../../mantenimiento/lib/actions";
import { getCombustibleAprobadoPorMision } from "../lib/actions";
import {
  combustibleAprobadoParaBitacora,
  misionRequiereReciboCombustible,
} from "../lib/combustible-mision";
import {
  GvModalForm,
  GvModalFormBody,
  GvModalFooter,
  GvModalShell,
  GV_MODAL_SELECT_CONTENT_CLASS,
  GV_MODAL_SELECT_ITEM_CLASS,
  GV_MODAL_SELECT_TRIGGER_CLASS,
  ModalCancelButton,
  ModalField,
  ModalInput,
  ModalLabel,
  ModalSubmit,
  ModalTextarea,
  modalFieldClass,
} from "../../lib/gv-modal-shell";

interface SolicitudActiva {
  id: string;
  destino: string;
  conductor_id: string;
  vehiculo_id: string;
  estado?: string;
  ot_vehiculos: { kilometraje_actual: number } | { kilometraje_actual: number }[] | null;
}

const selectOverflowScrollWrapClass = "min-w-0 max-w-full overflow-x-auto";

const selectOverflowTriggerClass =
  "w-max min-w-full [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:whitespace-nowrap";

function kmDeMision(rel: SolicitudActiva["ot_vehiculos"]): number {
  if (!rel) return 0;
  if (Array.isArray(rel)) return rel[0]?.kilometraje_actual || 0;
  return rel.kilometraje_actual || 0;
}

function formatVehiculoLabel(v: Pick<VehiculoRow, "placa" | "marca" | "modelo">) {
  return `${v.placa} · ${v.marca} ${v.modelo}`;
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
  const crear = useCrearBitacora();
  const user = useUser();
  const nombreResponsable =
    (user?.user_metadata?.nombre as string | undefined)?.trim() || "Tu perfil";
  const { data: options, isLoading: loading } = useBitacoraFormOptions(open);
  const vehiculos = (options?.vehiculos ?? []) as VehiculoRow[];
  const misiones = (options?.misiones ?? []) as SolicitudActiva[];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<BitacoraInput>({
    resolver: zodResolver(bitacoraInputSchema) as never,
    defaultValues: {
      solicitud_id: "",
      vehiculo_id: "",
      conductor_id: "",
      destino: "",
      km_inicial: 0,
      km_final: 0,
      vale_combustible: "",
      monto_combustible: 0,
      comentarios: [],
      evidencia_url: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "comentarios",
  });

  const [editingIds, setEditingIds] = useState<Set<string>>(() => new Set());
  const [consultaAveriaOpen, setConsultaAveriaOpen] = useState(false);
  const [reportarAveriaOpen, setReportarAveriaOpen] = useState(false);
  const [pendingBitacora, setPendingBitacora] = useState<BitacoraInput | null>(null);
  const [averiaVehiculoId, setAveriaVehiculoId] = useState("");
  const [averiaVehiculoFijo, setAveriaVehiculoFijo] = useState<VehiculoAveriaFijo | null>(null);
  const [combustibleMisionAviso, setCombustibleMisionAviso] = useState<string | null>(null);
  const [reciboCombustibleObligatorio, setReciboCombustibleObligatorio] = useState(false);
  const [evidenciaFile, setEvidenciaFile] = useState<File | null>(null);
  const [evidenciaPreviewUrl, setEvidenciaPreviewUrl] = useState<string | null>(null);
  const [evidenciaPathSubido, setEvidenciaPathSubido] = useState<string | null>(null);
  const [subiendoEvidencia, setSubiendoEvidencia] = useState(false);
  const prevFieldsLen = useRef(0);

  const clearEvidencia = () => {
    if (evidenciaPreviewUrl) URL.revokeObjectURL(evidenciaPreviewUrl);
    setEvidenciaFile(null);
    setEvidenciaPreviewUrl(null);
    setEvidenciaPathSubido(null);
    setValue("evidencia_url", [], { shouldValidate: true });
  };

  const handleEvidenciaFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    if (evidenciaPreviewUrl) URL.revokeObjectURL(evidenciaPreviewUrl);
    setEvidenciaPathSubido(null);
    setEvidenciaFile(selected);
    setEvidenciaPreviewUrl(URL.createObjectURL(selected));
    setValue("evidencia_url", [BITACORA_RECIBO_PENDIENTE], { shouldValidate: true });
  };

  const selectedMisionId = watch("solicitud_id");
  const selectedVehiculoId = watch("vehiculo_id");
  const kmInicial = watch("km_inicial");
  const kmFinal = watch("km_final");
  const recorrido = Math.max(0, kmFinal - kmInicial);
  const comentariosValues = watch("comentarios");

  useEffect(() => {
    if (fields.length > prevFieldsLen.current) {
      const newField = fields[fields.length - 1];
      if (newField) {
        setEditingIds((prev) => new Set(prev).add(newField.id));
      }
    }
    prevFieldsLen.current = fields.length;
  }, [fields]);

  const startEdit = (id: string) => {
    setEditingIds((prev) => new Set(prev).add(id));
  };

  const stopEdit = (id: string) => {
    setEditingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleRemoveComentario = (index: number, id: string) => {
    remove(index);
    setEditingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleAppendComentario = () => {
    append({ texto: "" });
  };

  useEffect(() => {
    if (user?.id) {
      setValue("conductor_id", user.id);
    }
  }, [user?.id, setValue]);

  useEffect(() => {
    if (!open) {
      setConsultaAveriaOpen(false);
      setReportarAveriaOpen(false);
      setPendingBitacora(null);
      setAveriaVehiculoId("");
      setAveriaVehiculoFijo(null);
      setEditingIds(new Set());
      setCombustibleMisionAviso(null);
      setReciboCombustibleObligatorio(false);
      clearEvidencia();
      return;
    }

    setEvidenciaFile(null);
    setEvidenciaPreviewUrl(null);
    setEvidenciaPathSubido(null);

    reset({
      solicitud_id: "",
      vehiculo_id: "",
      conductor_id: user?.id ?? "",
      destino: "",
      km_inicial: 0,
      km_final: 0,
      vale_combustible: "",
      monto_combustible: 0,
      comentarios: [],
      evidencia_url: [],
    });
  }, [open, reset, user?.id]);

  useEffect(() => {
    if (selectedMisionId && misiones.length > 0) {
      const mision = misiones.find((m) => m.id === selectedMisionId);
      if (mision) {
        const kmActual = kmDeMision(mision.ot_vehiculos);
        setValue("vehiculo_id", mision.vehiculo_id, { shouldValidate: true });
        setValue("destino", mision.destino, { shouldValidate: true });
        setValue("km_inicial", kmActual, { shouldValidate: true });
        setValue("km_final", kmActual);
      }
    }
  }, [selectedMisionId, misiones, setValue]);

  useEffect(() => {
    if (!open) return;

    if (!selectedMisionId) {
      setCombustibleMisionAviso(null);
      setReciboCombustibleObligatorio(false);
      clearEvidencia();
      clearErrors("evidencia_url");
      return;
    }

    let cancelled = false;

    void getCombustibleAprobadoPorMision(selectedMisionId).then((row) => {
      if (cancelled) return;

      const requiereRecibo = misionRequiereReciboCombustible(row);
      setReciboCombustibleObligatorio(requiereRecibo);

      if (!requiereRecibo) {
        clearEvidencia();
        clearErrors("evidencia_url");
      }

      if (!row) {
        setValue("vale_combustible", "", { shouldValidate: false });
        setValue("monto_combustible", 0, { shouldValidate: false });
        setCombustibleMisionAviso(
          "No hay solicitud de combustible aprobada vinculada a esta misión.",
        );
        return;
      }

      const datos = combustibleAprobadoParaBitacora(row);
      if (!datos) {
        setCombustibleMisionAviso(
          "Hay combustible aprobado sin rango de cupones. Complete vale y monto manualmente.",
        );
        return;
      }

      setValue("vale_combustible", datos.vale, { shouldValidate: true });
      setValue("monto_combustible", datos.monto, { shouldValidate: true });

      if (datos.monto > 0) {
        setCombustibleMisionAviso(
          `${datos.cantidad} cupón(es) entregados · vale ${datos.vale}. Debe adjuntar el recibo de carga.`,
        );
      } else {
        setCombustibleMisionAviso(
          `Vale ${datos.vale} (${datos.cantidad} cupón(es) entregados). Adjunte el recibo; indique el monto si falta denominación en la aprobación.`,
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, selectedMisionId, setValue, clearErrors]);

  useEffect(() => {
    if (selectedVehiculoId && !selectedMisionId) {
      const vehiculo = vehiculos.find((v) => v.id === selectedVehiculoId);
      if (vehiculo) {
        setValue("km_inicial", vehiculo.kilometraje_actual, { shouldValidate: true });
        setValue("km_final", vehiculo.kilometraje_actual);
      }
    }
  }, [selectedVehiculoId, selectedMisionId, vehiculos, setValue]);

  const onFormValidated = (data: BitacoraInput) => {
    if (reciboCombustibleObligatorio) {
      const tieneRecibo =
        Boolean(evidenciaFile) ||
        Boolean(evidenciaPathSubido) ||
        (data.evidencia_url?.includes(BITACORA_RECIBO_PENDIENTE) ?? false);
      if (!tieneRecibo) {
        setError("evidencia_url", {
          message: "Debe adjuntar el recibo de combustible de esta misión.",
        });
        return;
      }
    }
    setPendingBitacora(data);
    setConsultaAveriaOpen(true);
  };

  const guardarBitacora = async (
    data: BitacoraInput,
    huboAveria: boolean,
  ): Promise<"listo" | "reporte_pendiente" | "error"> => {
    setSubiendoEvidencia(true);
    try {
      let evidenciaPaths = data.evidencia_url ?? [];

      if (reciboCombustibleObligatorio && !evidenciaFile && !evidenciaPathSubido) {
        toast.error("Debe adjuntar el recibo de combustible de esta misión.");
        return "error";
      }

      if (!reciboCombustibleObligatorio) {
        evidenciaPaths = [];
      }

      if (evidenciaFile && !evidenciaPathSubido) {
        const compressed = await comprimirImagenVehiculo(evidenciaFile);
        const fileName = `${data.vehiculo_id}_${crypto.randomUUID()}.jpg`;
        const filePath = rutaStorageVehiculos(VEHICULOS_STORAGE_CARPETA_RECIBOS, fileName);
        const supabase = createClient();

        const { error: uploadError } = await supabase.storage
          .from(VEHICULOS_STORAGE_BUCKET)
          .upload(filePath, compressed, {
            upsert: false,
            contentType: "image/jpeg",
          });

        if (uploadError) {
          toast.error(`Error subiendo la imagen: ${uploadError.message}`);
          return "error";
        }

        evidenciaPaths = [filePath];
        setEvidenciaPathSubido(filePath);
        if (evidenciaPreviewUrl) URL.revokeObjectURL(evidenciaPreviewUrl);
        setEvidenciaFile(null);
        setEvidenciaPreviewUrl(null);
      } else if (evidenciaPathSubido) {
        evidenciaPaths = [evidenciaPathSubido];
      }

      const res = await crear.mutateAsync({ ...data, evidencia_url: evidenciaPaths });
      if (!res.success) {
        toast.error(res.error || "Hubo un error al guardar la bitácora");
        return "error";
      }

      if (!huboAveria) {
        toast.success("Bitácora registrada con éxito");
        return "listo";
      }

      const yaReportada = await vehiculoTieneAveriaActiva(data.vehiculo_id);
      if (yaReportada) {
        toast.success("Bitácora registrada con éxito");
        toast.info(
          "Este vehículo ya tiene un reporte de avería activo en mantenimiento.",
        );
        return "listo";
      }

      const vehiculo = vehiculos.find((v) => v.id === data.vehiculo_id);
      setAveriaVehiculoFijo(
        vehiculo?.id
          ? {
              id: vehiculo.id,
              placa: vehiculo.placa,
              marca: vehiculo.marca,
              modelo: vehiculo.modelo,
            }
          : {
              id: data.vehiculo_id,
              placa: "—",
              marca: "",
              modelo: "",
            },
      );
      setAveriaVehiculoId(data.vehiculo_id);
      setReportarAveriaOpen(true);
      return "reporte_pendiente";
    } catch {
      toast.error("Error inesperado");
      return "error";
    } finally {
      setSubiendoEvidencia(false);
    }
  };

  const handleConsultaAveria = async (huboAveria: boolean) => {
    if (!pendingBitacora) return;

    const resultado = await guardarBitacora(pendingBitacora, huboAveria);
    setConsultaAveriaOpen(false);
    setPendingBitacora(null);

    if (resultado === "listo") {
      onSaved();
      onOpenChange(false);
    }
  };

  const handleAveriaReportada = () => {
    setReportarAveriaOpen(false);
    setAveriaVehiculoId("");
    setAveriaVehiculoFijo(null);
    onSaved();
    onOpenChange(false);
  };

  const flujoBloqueado =
    consultaAveriaOpen || reportarAveriaOpen || crear.isPending || subiendoEvidencia;

  const handleClose = () => {
    if (crear.isPending) return;
    onOpenChange(false);
  };

  return (
    <>
      <GvModalShell
        open={open}
        onClose={handleClose}
        title="Registrar bitácora de viaje"
        maxWidth="max-w-2xl"
      >
        {open && loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
          </div>
        ) : open ? (
          <GvModalForm onSubmit={handleSubmit(onFormValidated)} className="w-full min-w-0">
            <GvModalFormBody className="space-y-4">
              <ModalField>
                <ModalLabel htmlFor="solicitud_id">Misión a vincular (opcional)</ModalLabel>
                <Controller
                  name="solicitud_id"
                  control={control}
                  render={({ field }) => (
                    <div className={selectOverflowScrollWrapClass}>
                      <Select
                        onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                        value={field.value || "none"}
                      >
                        <SelectTrigger
                          id="solicitud_id"
                          className={cn(GV_MODAL_SELECT_TRIGGER_CLASS, selectOverflowTriggerClass)}
                        >
                          <SelectValue placeholder="Seleccionar misión en curso" />
                        </SelectTrigger>
                        <SelectContent position="popper" className={GV_MODAL_SELECT_CONTENT_CLASS}>
                          <SelectItem value="none" className={GV_MODAL_SELECT_ITEM_CLASS}>
                            Ninguna — registro manual
                          </SelectItem>
                          {misiones.map((m) => {
                            const sufijoEstado =
                              m.estado === "FINALIZADA" ? " · finalizada" : "";
                            const label = `Misión a ${m.destino} · ${kmDeMision(m.ot_vehiculos)} km${sufijoEstado}`;
                            return (
                              <SelectItem
                                key={m.id}
                                value={m.id}
                                textValue={label}
                                className={cn(GV_MODAL_SELECT_ITEM_CLASS, "whitespace-nowrap")}
                              >
                                {label}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {selectedMisionId
                    ? "Vehículo, conductor y destino se completan desde la misión seleccionada."
                    : "Se listan tus misiones en curso y la última finalizada sin bitácora vinculada."}
                </p>
              </ModalField>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ModalField>
                  <ModalLabel htmlFor="vehiculo_id">Vehículo</ModalLabel>
                  <Controller
                    name="vehiculo_id"
                    control={control}
                    render={({ field }) => (
                      <div className={selectOverflowScrollWrapClass}>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          disabled={!!selectedMisionId}
                        >
                          <SelectTrigger
                            id="vehiculo_id"
                            className={cn(GV_MODAL_SELECT_TRIGGER_CLASS, selectOverflowTriggerClass)}
                            disabled={!!selectedMisionId}
                          >
                            <SelectValue placeholder="Seleccionar vehículo" />
                          </SelectTrigger>
                          <SelectContent position="popper" className={GV_MODAL_SELECT_CONTENT_CLASS}>
                            {vehiculos
                              .filter((v) => v.id)
                              .map((v) => {
                                const label = formatVehiculoLabel(v);
                                return (
                                  <SelectItem
                                    key={v.id}
                                    value={v.id as string}
                                    textValue={label}
                                    className={cn(GV_MODAL_SELECT_ITEM_CLASS, "whitespace-nowrap")}
                                  >
                                    {label}
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  />
                  {errors.vehiculo_id ? (
                    <p className="text-xs text-red-500">{errors.vehiculo_id.message}</p>
                  ) : null}
                </ModalField>

                <ModalField>
                  <ModalLabel htmlFor="conductor_display">Responsable del viaje</ModalLabel>
                  <input type="hidden" {...register("conductor_id")} />
                  <ModalInput
                    id="conductor_display"
                    readOnly
                    value={nombreResponsable}
                    className="opacity-90"
                  />
                </ModalField>
              </div>

              <ModalField>
                <ModalLabel htmlFor="destino">Destino de la ruta</ModalLabel>
                <ModalInput
                  id="destino"
                  {...register("destino")}
                  disabled={!!selectedMisionId}
                />
                {errors.destino ? (
                  <p className="text-xs text-red-500">{errors.destino.message}</p>
                ) : null}
              </ModalField>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ModalField>
                  <ModalLabel htmlFor="km_inicial">Km inicial</ModalLabel>
                  <ModalInput
                    id="km_inicial"
                    type="number"
                    readOnly
                    className="tabular-nums opacity-80"
                    {...register("km_inicial")}
                  />
                </ModalField>
                <ModalField>
                  <ModalLabel htmlFor="km_final">Km final</ModalLabel>
                  <ModalInput
                    id="km_final"
                    type="number"
                    className="tabular-nums"
                    {...register("km_final")}
                  />
                  {errors.km_final ? (
                    <p className="text-xs text-red-500">{errors.km_final.message}</p>
                  ) : null}
                </ModalField>
                <ModalField>
                  <ModalLabel htmlFor="recorrido">Recorrido</ModalLabel>
                  <ModalInput
                    id="recorrido"
                    readOnly
                    value={`${recorrido} km`}
                    className="tabular-nums font-semibold"
                  />
                </ModalField>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ModalField>
                  <ModalLabel htmlFor="vale_combustible">Vale de combustible</ModalLabel>
                  <ModalInput
                    id="vale_combustible"
                    placeholder="Ej. 15001 – 15050"
                    {...register("vale_combustible")}
                  />
                </ModalField>
                <ModalField>
                  <ModalLabel htmlFor="monto_combustible">Monto (Q.)</ModalLabel>
                  <ModalInput
                    id="monto_combustible"
                    type="number"
                    step="0.01"
                    className="tabular-nums"
                    placeholder="Total cupones entregados"
                    {...register("monto_combustible")}
                  />
                </ModalField>
              </div>
              {combustibleMisionAviso ? (
                <p className="text-xs text-muted-foreground">{combustibleMisionAviso}</p>
              ) : null}

              {reciboCombustibleObligatorio ? (
              <ModalField>
                <ModalLabel>
                  Recibo de combustible
                  <span className="ml-1 text-red-500" aria-hidden>
                    *
                  </span>
                </ModalLabel>
                <p className="text-xs text-muted-foreground">
                  Esta misión tiene vales de combustible aprobados. Fotografía del recibo de carga
                  (máx. 200 KB, JPG, PNG o WEBP). En celular puedes tomar foto con la cámara.
                </p>
                {errors.evidencia_url ? (
                  <p className="text-xs text-red-500">{errors.evidencia_url.message}</p>
                ) : null}
                {evidenciaPreviewUrl ? (
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-2xl border border-border bg-zinc-100 dark:bg-zinc-950",
                      modalFieldClass,
                    )}
                  >
                    <div className="flex min-h-[11rem] items-center justify-center p-3 sm:min-h-[13rem]">
                      <img
                        src={evidenciaPreviewUrl}
                        alt="Vista previa del recibo"
                        className="max-h-52 w-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 border-t border-border/80 bg-white/90 px-3 py-2.5 backdrop-blur-sm dark:bg-zinc-900/90">
                      <label className="relative inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-sky-100 px-3 py-1.5 text-xs font-bold text-[#2c5f9b] transition-colors hover:bg-sky-200 dark:bg-sky-950 dark:text-[#6f9fd4] dark:hover:bg-sky-900">
                        Cambiar
                        <input
                          type="file"
                          accept={IMAGEN_VEHICULO_ACCEPT_ATTR}
                          capture={IMAGEN_VEHICULO_CAPTURE_ATTR}
                          className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
                          aria-label="Cambiar recibo de combustible"
                          onChange={handleEvidenciaFileChange}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={clearEvidencia}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-red-100 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-200 dark:bg-red-950/80 dark:text-red-400 dark:hover:bg-red-900/80"
                      >
                        <X className="size-3.5" />
                        Quitar
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    className={cn(
                      "relative flex min-h-[11rem] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300/90 bg-gradient-to-b from-sky-50/80 to-zinc-50/40 px-6 py-8 text-center transition-colors hover:border-[#2c5f9b]/50 hover:from-sky-100/90 hover:to-sky-50/50 dark:border-zinc-600 dark:from-sky-950/25 dark:to-zinc-950/40 dark:hover:border-[#6f9fd4]/50 dark:hover:from-sky-950/40",
                      modalFieldClass,
                    )}
                  >
                    <div className="pointer-events-none mb-4 flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-sky-200/80 dark:bg-zinc-900 dark:ring-sky-900/60">
                      <UploadCloud className="size-7 text-[#2c5f9b] dark:text-[#6f9fd4]" />
                    </div>
                    <p className="pointer-events-none text-base font-bold text-[#2c5f9b] dark:text-[#6f9fd4]">
                      Tomar foto o subir recibo
                    </p>
                    <p className="pointer-events-none mt-2 max-w-xs text-sm text-muted-foreground">
                      En celular se abre la cámara o la galería; en computadora, elige un archivo
                    </p>
                    <input
                      type="file"
                      accept={IMAGEN_VEHICULO_ACCEPT_ATTR}
                      capture={IMAGEN_VEHICULO_CAPTURE_ATTR}
                      className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
                      aria-label="Tomar foto o subir recibo de combustible"
                      onChange={handleEvidenciaFileChange}
                    />
                  </label>
                )}
              </ModalField>
              ) : null}

              <ModalField>
                <ModalLabel>Comentarios del viaje</ModalLabel>
                <p className="text-xs text-muted-foreground">
                  Agrega observaciones del recorrido. El autor queda registrado como responsable del viaje.
                </p>
                <AnimatePresence mode="popLayout" initial={false}>
                  {fields.map((field, index) => {
                    const isEditing = editingIds.has(field.id);
                    const texto = comentariosValues?.[index]?.texto?.trim() ?? "";

                    return (
                      <motion.div
                        key={field.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8, scale: 0.99 }}
                        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                        className={cn("rounded-lg px-3 py-2", modalFieldClass)}
                      >
                        <div className={cn("flex gap-2.5", isEditing ? "items-start" : "items-center")}>
                          <span className="inline-flex shrink-0 text-xs font-bold text-[#2c5f9b] dark:text-[#6f9fd4]">
                            {index + 1}.
                          </span>

                          <div className="min-w-0 flex-1">
                            {isEditing ? (
                              <ModalTextarea
                                {...register(`comentarios.${index}.texto`)}
                                rows={2}
                                autoFocus
                                className="min-h-14"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEdit(field.id)}
                                className="w-full cursor-pointer truncate border-0 bg-transparent p-0 text-left text-sm leading-tight text-foreground hover:opacity-80"
                              >
                                {texto || (
                                  <span className="text-muted-foreground">
                                    Sin texto — pulsa editar para escribir
                                  </span>
                                )}
                              </button>
                            )}
                            {errors.comentarios?.[index]?.texto ? (
                              <p className="mt-1 text-xs text-red-500">
                                {errors.comentarios[index]?.texto?.message}
                              </p>
                            ) : null}
                          </div>

                          {!isEditing && texto ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-muted-foreground transition-colors hover:bg-zinc-200/80 dark:hover:bg-zinc-800"
                                  aria-label={`Acciones del comentario ${index + 1}`}
                                >
                                  <GvMorphIcon
                                    icon={EllipsisVertical}
                                    hoverIcon={MoreVertical}
                                    size={18}
                                    className="text-current"
                                  />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="z-[250] min-w-[10rem] rounded-xl border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900"
                              >
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 bg-white focus:bg-sky-50 dark:bg-zinc-900 dark:focus:bg-zinc-800"
                                  onSelect={() => startEdit(field.id)}
                                >
                                  <GvMorphIcon icon={PenSquare} hoverIcon={Pencil} size={14} className="text-current" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 bg-white text-red-600 focus:bg-red-50 dark:bg-zinc-900 dark:text-red-400 dark:focus:bg-red-950/60"
                                  onSelect={() => handleRemoveComentario(index, field.id)}
                                >
                                  <GvMorphIcon icon={Trash2} hoverIcon={Trash} size={14} className="text-current" />
                                  Quitar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </div>

                        {isEditing ? (
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => stopEdit(field.id)}
                              className="inline-flex h-7 cursor-pointer items-center rounded-lg border-0 bg-zinc-200 px-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                            >
                              Listo
                            </button>
                          </div>
                        ) : null}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <button
                  type="button"
                  onClick={handleAppendComentario}
                  className={cn(
                    "flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed bg-transparent text-sm font-bold text-[#2c5f9b] transition-colors hover:bg-zinc-50 dark:text-[#6f9fd4] dark:hover:bg-zinc-900/50",
                    modalFieldClass,
                  )}
                >
                  <GvMorphIcon icon={Plus} hoverIcon={CirclePlus} size={16} className="text-current" />
                  Agregar
                </button>
              </ModalField>
            </GvModalFormBody>

            <GvModalFooter>
              <ModalCancelButton onClick={handleClose} disabled={flujoBloqueado} />
              <ModalSubmit
                disabled={flujoBloqueado}
                label={subiendoEvidencia ? "Subiendo" : "Registrar"}
              />
            </GvModalFooter>
          </GvModalForm>
        ) : null}
      </GvModalShell>

      <ConsultaAveriaModal
        open={consultaAveriaOpen}
        onOpenChange={(next) => {
          if (!next && crear.isPending) return;
          setConsultaAveriaOpen(next);
          if (!next) setPendingBitacora(null);
        }}
        onConfirmar={handleConsultaAveria}
        isPending={crear.isPending}
      />

      <ReportarAveriaModal
        open={reportarAveriaOpen}
        onOpenChange={(next) => {
          if (!next && reportarAveriaOpen) return;
          setReportarAveriaOpen(next);
        }}
        vehiculoIdInicial={averiaVehiculoId}
        vehiculoFijo={averiaVehiculoFijo}
        bloquearVehiculo
        obligatorio
        onSaved={handleAveriaReportada}
      />
    </>
  );
}

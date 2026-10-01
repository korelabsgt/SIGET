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
  rutaStorageReciboBitacoraVehiculo,
  VEHICULOS_STORAGE_BUCKET,
} from "../../lib/storage";
import {
  comprimirImagenVehiculo,
  IMAGEN_VEHICULO_ACCEPT_ATTR,
} from "../../lib/imagen-vehiculo-compress";
import {
  ImagenVehiculoEscritorioFileInput,
  ImagenVehiculoFuentePicker,
} from "../../lib/imagen-vehiculo-fuente-picker";
import {
  BITACORA_RECIBO_PENDIENTE,
  destinoBitacoraFormulario,
  esBitacoraReservaIndividualPendiente,
} from "../lib/helpers";
import { GvMorphIcon } from "../../lib/morph-icon";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { type BitacoraInput, bitacoraInputSchema, type BitacoraRow } from "../lib/zod";
import {
  useBitacoraFormOptions,
  useCombustiblesSinMisionBitacora,
  useConfirmarBitacora,
} from "../lib/hooks";
import type { CombustibleSinMisionOpcion } from "../lib/actions";
import { esBitacoraPendiente } from "../lib/bitacora-estado";
import { type VehiculoRow } from "../../flota/lib/zod";
import { ConsultaAveriaModal } from "./ConsultaAveriaModal";
import { ReportarAveriaModal, type VehiculoAveriaFijo } from "../../mantenimiento/forms/ReportarAveriaModal";
import { vehiculoTieneAveriaActiva } from "../../mantenimiento/lib/actions";
import {
  getCombustibleAprobadoPorMision,
  getCombustibleAprobadoSinMisionPorVehiculo,
} from "../lib/actions";
import {
  combustibleAprobadoParaBitacora,
  misionRequiereReciboCombustible,
} from "../lib/combustible-mision";
import {
  GvDetalleEncabezadoVehiculo,
  GvDetalleFilaVehiculo,
  GvDetalleSeccionTitulo,
  GvDetalleStat,
  GvDetalleTarjetaAnidada,
} from "../../lib/gv-detalle-modal-ui";
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

const selectOverflowScrollWrapClass = "min-w-0 max-w-full overflow-x-auto";

const selectOverflowTriggerClass =
  "w-max min-w-full [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:whitespace-nowrap";

function formatVehiculoLabel(v: Pick<VehiculoRow, "placa" | "marca" | "modelo">) {
  return `${v.placa} · ${v.marca} ${v.modelo}`;
}

export function Crear({
  open,
  onOpenChange,
  onSaved,
  bitacoraPendiente = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  bitacoraPendiente?: BitacoraRow | null;
}) {
  const confirmar = useConfirmarBitacora();
  const bitacoraId = bitacoraPendiente?.id ?? "";
  const esConfirmacionPendiente = Boolean(
    bitacoraPendiente && esBitacoraPendiente(bitacoraPendiente),
  );
  const user = useUser();
  const nombreResponsable =
    (user?.user_metadata?.nombre as string | undefined)?.trim() || "Tu perfil";
  const { data: options, isLoading: loading } = useBitacoraFormOptions(open);
  const vehiculos = (options?.vehiculos ?? []) as VehiculoRow[];

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
      solicitud_combustible_id: "",
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

  const applyEvidenciaFile = (selected: File) => {
    if (evidenciaPreviewUrl) URL.revokeObjectURL(evidenciaPreviewUrl);
    setEvidenciaPathSubido(null);
    setEvidenciaFile(selected);
    setEvidenciaPreviewUrl(URL.createObjectURL(selected));
    setValue("evidencia_url", [BITACORA_RECIBO_PENDIENTE], { shouldValidate: true });
  };

  const handleEvidenciaFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    applyEvidenciaFile(selected);
  };

  const selectedMisionId = watch("solicitud_id");
  const selectedVehiculoId = watch("vehiculo_id");
  const misionIdCombustible =
    selectedMisionId?.trim() || bitacoraPendiente?.solicitud_id?.trim() || "";
  const vehiculoIdCombustible =
    selectedVehiculoId?.trim() || bitacoraPendiente?.vehiculo_id?.trim() || "";
  const vehiculoSeleccionado =
    vehiculos.find((v) => v.id === vehiculoIdCombustible) ?? null;
  const esReservaIndividualPendiente =
    bitacoraPendiente !== null &&
    esBitacoraReservaIndividualPendiente(bitacoraPendiente, vehiculoSeleccionado);
  const datosMisionBloqueados = Boolean(misionIdCombustible);
  const bloqueoVehiculoYResponsable =
    datosMisionBloqueados || esReservaIndividualPendiente;
  const combustibleSoloLectura = datosMisionBloqueados && !esReservaIndividualPendiente;
  const { data: combustiblesSinMision = [], isLoading: loadingCombustiblesSinMision } =
    useCombustiblesSinMisionBitacora(
      vehiculoIdCombustible,
      open && esReservaIndividualPendiente,
    );
  const valeCombustible = watch("vale_combustible");
  const montoCombustible = watch("monto_combustible");
  const solicitudCombustibleId = watch("solicitud_combustible_id")?.trim() ?? "";
  const combustibleSinMisionSeleccionado = Boolean(solicitudCombustibleId);
  const kmInicial = watch("km_inicial");
  const kmFinal = watch("km_final");
  const kmInicialFlota =
    vehiculoSeleccionado?.kilometraje_actual ??
    (Number.isFinite(kmInicial) ? kmInicial : 0);
  const recorrido = Math.max(0, kmFinal - kmInicialFlota);
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

    if (bitacoraPendiente && esBitacoraPendiente(bitacoraPendiente)) {
      reset({
        solicitud_id: bitacoraPendiente.solicitud_id ?? "",
        vehiculo_id: bitacoraPendiente.vehiculo_id,
        conductor_id: bitacoraPendiente.conductor_id,
        destino: destinoBitacoraFormulario(bitacoraPendiente.destino),
        km_inicial: bitacoraPendiente.km_inicial,
        km_final: bitacoraPendiente.km_final,
        vale_combustible: bitacoraPendiente.vale_combustible ?? "",
        monto_combustible: bitacoraPendiente.monto_combustible ?? 0,
        solicitud_combustible_id: "",
        comentarios: bitacoraPendiente.comentarios.map((c) => ({ texto: c.texto })),
        evidencia_url: [],
      });
      return;
    }

    reset({
      solicitud_id: "",
      vehiculo_id: "",
      conductor_id: user?.id ?? "",
      destino: "",
      km_inicial: 0,
      km_final: 0,
      vale_combustible: "",
      monto_combustible: 0,
      solicitud_combustible_id: "",
      comentarios: [],
      evidencia_url: [],
    });
  }, [open, reset, user?.id, bitacoraPendiente]);

  const aplicarCombustibleSinMision = (opcion: CombustibleSinMisionOpcion) => {
    setValue("solicitud_combustible_id", opcion.id, { shouldValidate: true });
    setValue("vale_combustible", opcion.vale, { shouldValidate: true });
    setValue("monto_combustible", opcion.monto, { shouldValidate: true });
    const requiereRecibo = opcion.vale.trim().length > 0;
    setReciboCombustibleObligatorio(requiereRecibo);
    if (!requiereRecibo) {
      clearEvidencia();
      clearErrors("evidencia_url");
    }
    setCombustibleMisionAviso(
      opcion.monto > 0
        ? `Vale ${opcion.vale}. Debe adjuntar el recibo de carga.`
        : `Vale ${opcion.vale}. Adjunte el recibo; indique el monto si falta en la aprobación.`,
    );
  };

  useEffect(() => {
    if (!open) return;
    if (esReservaIndividualPendiente) return;

    if (!misionIdCombustible && !vehiculoIdCombustible) {
      setCombustibleMisionAviso(null);
      setReciboCombustibleObligatorio(false);
      clearEvidencia();
      clearErrors("evidencia_url");
      return;
    }

    let cancelled = false;

    void (async () => {
      let row = null as Awaited<ReturnType<typeof getCombustibleAprobadoPorMision>>;
      let origenSinMision = false;

      if (misionIdCombustible) {
        row = await getCombustibleAprobadoPorMision(misionIdCombustible);
      }

      if (!row && vehiculoIdCombustible) {
        row = await getCombustibleAprobadoSinMisionPorVehiculo(vehiculoIdCombustible);
        origenSinMision = Boolean(row);
      }

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
          misionIdCombustible
            ? "No hay combustible aprobado vinculado a la misión ni sin vincular para este vehículo."
            : "No hay solicitud de combustible aprobada sin vincular para este vehículo.",
        );
        return;
      }

      const datos = combustibleAprobadoParaBitacora(row);
      if (!datos) {
        setValue("vale_combustible", "", { shouldValidate: false });
        setValue("monto_combustible", 0, { shouldValidate: false });
        setCombustibleMisionAviso(
          origenSinMision
            ? "Hay combustible aprobado sin misión vinculada, pero sin rango de cupones registrado."
            : "Hay combustible aprobado sin rango de cupones en la solicitud vinculada.",
        );
        return;
      }

      setValue("vale_combustible", datos.vale, { shouldValidate: true });
      setValue("monto_combustible", datos.monto, { shouldValidate: true });

      const prefijoOrigen = origenSinMision
        ? "Combustible aprobado sin misión vinculada · "
        : "";

      if (datos.monto > 0) {
        setCombustibleMisionAviso(
          `${prefijoOrigen}${datos.cantidad} cupón(es) entregados · vale ${datos.vale}. Debe adjuntar el recibo de carga.`,
        );
      } else {
        setCombustibleMisionAviso(
          `${prefijoOrigen}Vale ${datos.vale} (${datos.cantidad} cupón(es) entregados). Adjunte el recibo; el monto se tomó de la aprobación si estaba registrado.`,
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    esReservaIndividualPendiente,
    misionIdCombustible,
    vehiculoIdCombustible,
    setValue,
    clearErrors,
  ]);

  useEffect(() => {
    if (!open || !vehiculoIdCombustible) return;
    const vehiculo = vehiculos.find((v) => v.id === vehiculoIdCombustible);
    if (!vehiculo) return;
    const kmFlota = vehiculo.kilometraje_actual ?? 0;
    setValue("km_inicial", kmFlota, { shouldValidate: true });
    if (!selectedMisionId?.trim()) {
      setValue("km_final", kmFlota);
    }
  }, [open, vehiculoIdCombustible, vehiculos, selectedMisionId, setValue]);

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
        const placa =
          vehiculos.find((v) => v.id === data.vehiculo_id)?.placa ?? data.vehiculo_id;
        const fileName = `${crypto.randomUUID()}.jpg`;
        const filePath = rutaStorageReciboBitacoraVehiculo(placa, fileName);
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

      if (!bitacoraId) {
        toast.error("No hay una bitácora pendiente para confirmar.");
        return "error";
      }

      const res = await confirmar.mutateAsync({
        id: bitacoraId,
        input: { ...data, evidencia_url: evidenciaPaths },
      });
      if (!res.success) {
        toast.error(res.error || "Hubo un error al guardar la bitácora");
        return "error";
      }

      if (!huboAveria) {
        toast.success("Bitácora confirmada con éxito");
        return "listo";
      }

      const yaReportada = await vehiculoTieneAveriaActiva(data.vehiculo_id);
      if (yaReportada) {
        toast.success("Bitácora confirmada con éxito");
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
    consultaAveriaOpen || reportarAveriaOpen || confirmar.isPending || subiendoEvidencia;

  const handleClose = () => {
    if (confirmar.isPending) return;
    onOpenChange(false);
  };

  return (
    <>
      <GvModalShell
        open={open}
        onClose={handleClose}
        title={
          esReservaIndividualPendiente
            ? "Confirmar bitácora de reserva individual"
            : esConfirmacionPendiente
              ? "Confirmar bitácora de viaje"
              : "Bitácora de viaje"
        }
        maxWidth="max-w-2xl"
      >
        {open && loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
          </div>
        ) : open ? (
          <GvModalForm onSubmit={handleSubmit(onFormValidated)} className="w-full min-w-0">
            <GvModalFormBody className="space-y-6">
              <input type="hidden" {...register("solicitud_id")} />
              <input type="hidden" {...register("conductor_id")} />
              <input type="hidden" {...register("km_inicial")} />

              <section className="min-w-0 space-y-4">
                <GvDetalleSeccionTitulo>Ruta y kilometraje</GvDetalleSeccionTitulo>

                {!bloqueoVehiculoYResponsable ? (
                  <ModalField>
                    <ModalLabel htmlFor="vehiculo_id">Vehículo</ModalLabel>
                    <Controller
                      name="vehiculo_id"
                      control={control}
                      render={({ field }) => (
                        <div className={selectOverflowScrollWrapClass}>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <SelectTrigger
                              id="vehiculo_id"
                              className={cn(GV_MODAL_SELECT_TRIGGER_CLASS, selectOverflowTriggerClass)}
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
                ) : null}

                <ModalField>
                  <ModalLabel htmlFor="destino">Destino de la ruta</ModalLabel>
                  <ModalInput
                    id="destino"
                    {...register("destino")}
                    disabled={datosMisionBloqueados && !esReservaIndividualPendiente}
                  />
                  {errors.destino ? (
                    <p className="text-xs text-red-500">{errors.destino.message}</p>
                  ) : null}
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
              </section>

              {esReservaIndividualPendiente || !combustibleSoloLectura ? (
              <section className="min-w-0 space-y-4">
                <GvDetalleSeccionTitulo>Combustible</GvDetalleSeccionTitulo>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {esReservaIndividualPendiente ? (
                  <>
                    <ModalField className="lg:col-span-2">
                      <ModalLabel>Solicitud de combustible (sin misión)</ModalLabel>
                      <input type="hidden" {...register("solicitud_combustible_id")} />
                      <input type="hidden" {...register("vale_combustible")} />
                      <input type="hidden" {...register("monto_combustible")} />
                      {loadingCombustiblesSinMision ? (
                        <div className="relative">
                          <ModalInput
                            readOnly
                            disabled
                            value="Cargando solicitudes…"
                            className="pr-10 text-muted-foreground"
                            aria-busy
                          />
                          <Loader2
                            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-celeste-trifinio"
                            aria-hidden
                          />
                        </div>
                      ) : combustiblesSinMision.length === 0 ? (
                        <ModalInput
                          readOnly
                          disabled
                          value="Sin vales aprobados sin misión"
                          className="text-muted-foreground"
                        />
                      ) : (
                        <div className="flex flex-col gap-2" role="listbox" aria-label="Solicitudes de combustible">
                          {combustiblesSinMision.map((opcion) => {
                            const selected = solicitudCombustibleId === opcion.id;
                            return (
                              <button
                                key={opcion.id}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onClick={() => aplicarCombustibleSinMision(opcion)}
                                className={cn(
                                  "w-full cursor-pointer rounded-2xl border-2 px-4 py-3.5 text-left text-sm font-semibold leading-snug transition-[border-color,background-color,box-shadow] motion-reduce:transition-none",
                                  selected
                                    ? "border-celeste-trifinio bg-sky-50/90 text-foreground shadow-none ring-2 ring-celeste-trifinio/20 dark:bg-sky-950/35"
                                    : "border-transparent bg-zinc-100 text-foreground hover:border-celeste-trifinio/40 hover:bg-sky-50/50 dark:bg-zinc-800/80 dark:hover:bg-sky-950/25",
                                )}
                              >
                                {opcion.etiqueta}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </ModalField>
                    {combustibleSinMisionSeleccionado ? (
                      <div
                        className={cn(
                          "lg:col-span-2 rounded-2xl border border-celeste-trifinio/25 bg-sky-50/70 p-4 dark:border-celeste-trifinio/30 dark:bg-sky-950/25",
                        )}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wide text-celeste-trifinio dark:text-sky-300">
                          Vale seleccionado
                        </p>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-muted-foreground">Vale de combustible</p>
                            <p className="mt-1 break-words text-sm font-bold text-foreground">
                              {valeCombustible?.trim() ? valeCombustible.trim() : "—"}
                            </p>
                          </div>
                          <div className="min-w-0 sm:text-right">
                            <p className="text-xs font-semibold text-muted-foreground">Monto (Q.)</p>
                            <p className="mt-1 text-sm font-black tabular-nums text-foreground">
                              {Number(montoCombustible) > 0
                                ? `Q${Number(montoCombustible).toLocaleString("es-GT", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}`
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
              {combustibleMisionAviso ? (
                <p className="text-xs text-muted-foreground">{combustibleMisionAviso}</p>
              ) : null}
              </section>
              ) : null}

              {reciboCombustibleObligatorio ? (
              <section className="min-w-0 space-y-4">
                <GvDetalleSeccionTitulo>Recibo de combustible</GvDetalleSeccionTitulo>
              <ModalField>
                <ModalLabel>
                  Evidencia
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
                    <div className="flex flex-col gap-2 border-t border-border/80 bg-white/90 px-3 py-2.5 backdrop-blur-sm dark:bg-zinc-900/90 sm:flex-row sm:items-center sm:justify-end">
                      <ImagenVehiculoFuentePicker
                        multiple={false}
                        className="w-full sm:max-w-xs"
                        onFiles={(files) => {
                          const file = files[0];
                          if (file) applyEvidenciaFile(file);
                        }}
                      />
                      <label className="relative hidden cursor-pointer items-center gap-1.5 rounded-lg bg-sky-100 px-3 py-1.5 text-xs font-bold text-[#2c5f9b] transition-colors hover:bg-sky-200 dark:bg-sky-950 dark:text-[#6f9fd4] dark:hover:bg-sky-900 lg:inline-flex">
                        Cambiar
                        <input
                          type="file"
                          accept={IMAGEN_VEHICULO_ACCEPT_ATTR}
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
                  <div
                    className={cn(
                      "relative flex min-h-[11rem] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300/90 bg-gradient-to-b from-sky-50/80 to-zinc-50/40 px-6 py-8 text-center transition-colors lg:cursor-pointer lg:hover:border-[#2c5f9b]/50 lg:hover:from-sky-100/90 lg:hover:to-sky-50/50 dark:border-zinc-600 dark:from-sky-950/25 dark:to-zinc-950/40 dark:lg:hover:border-[#6f9fd4]/50 dark:lg:hover:from-sky-950/40",
                      modalFieldClass,
                    )}
                  >
                    <ImagenVehiculoEscritorioFileInput
                      multiple={false}
                      onFiles={(files) => {
                        const file = files[0];
                        if (file) applyEvidenciaFile(file);
                      }}
                    />
                    <div className="pointer-events-none mb-4 flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-sky-200/80 dark:bg-zinc-900 dark:ring-sky-900/60">
                      <UploadCloud className="size-7 text-[#2c5f9b] dark:text-[#6f9fd4]" />
                    </div>
                    <p className="pointer-events-none text-base font-bold text-[#2c5f9b] dark:text-[#6f9fd4]">
                      <span className="lg:hidden">Recibo de combustible</span>
                      <span className="hidden lg:inline">Tomar foto o subir recibo</span>
                    </p>
                    <p className="pointer-events-none mt-2 max-w-xs text-sm text-muted-foreground">
                      En celular usa cámara o galería; en computadora, elige un archivo
                    </p>
                    <ImagenVehiculoFuentePicker
                      multiple={false}
                      className="mt-4 max-w-sm"
                      onFiles={(files) => {
                        const file = files[0];
                        if (file) applyEvidenciaFile(file);
                      }}
                    />
                  </div>
                )}
              </ModalField>
              </section>
              ) : null}

              {!esReservaIndividualPendiente ? (
              <section className="min-w-0 space-y-4">
                <GvDetalleSeccionTitulo>Comentarios</GvDetalleSeccionTitulo>
              <ModalField>
                <ModalLabel>Observaciones del recorrido</ModalLabel>
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
              </section>
              ) : null}

              <section className="min-w-0 space-y-3 border-t border-zinc-200 pt-6 dark:border-zinc-700/80">
                <GvDetalleSeccionTitulo>Información del viaje</GvDetalleSeccionTitulo>
                <GvDetalleTarjetaAnidada>
                  {bloqueoVehiculoYResponsable && vehiculoSeleccionado ? (
                    <GvDetalleEncabezadoVehiculo
                      marca={vehiculoSeleccionado.marca}
                      modelo={vehiculoSeleccionado.modelo}
                      placa={vehiculoSeleccionado.placa}
                    />
                  ) : null}
                  <div className={cn(bloqueoVehiculoYResponsable && vehiculoSeleccionado && "mt-3")}>
                    <GvDetalleFilaVehiculo label="Responsable del viaje" value={nombreResponsable} />
                  </div>
                  {combustibleSoloLectura ? (
                    <div className="mt-1">
                      <input type="hidden" {...register("vale_combustible")} />
                      <input type="hidden" {...register("monto_combustible")} />
                      <GvDetalleFilaVehiculo
                        label="Vale de combustible"
                        value={valeCombustible?.trim() ? valeCombustible.trim() : "—"}
                      />
                      <GvDetalleFilaVehiculo
                        label="Monto (Q.)"
                        value={
                          Number(montoCombustible) > 0
                            ? `Q${Number(montoCombustible).toLocaleString("es-GT", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : "—"
                        }
                      />
                    </div>
                  ) : null}
                </GvDetalleTarjetaAnidada>
                <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
                  <GvDetalleStat
                    label="Km inicial"
                    value={Number(kmInicialFlota).toLocaleString("es-GT")}
                  />
                  <GvDetalleStat
                    label="Recorrido"
                    value={`${recorrido.toLocaleString("es-GT")} km`}
                    valueClassName="text-celeste-trifinio dark:text-[#6f9fd4]"
                  />
                </div>
              </section>
            </GvModalFormBody>

            <GvModalFooter>
              <ModalCancelButton onClick={handleClose} disabled={flujoBloqueado} />
              <ModalSubmit
                disabled={flujoBloqueado}
                label={subiendoEvidencia ? "Subiendo" : "Confirmar"}
              />
            </GvModalFooter>
          </GvModalForm>
        ) : null}
      </GvModalShell>

      <ConsultaAveriaModal
        open={consultaAveriaOpen}
        onOpenChange={(next) => {
          if (!next && confirmar.isPending) return;
          setConsultaAveriaOpen(next);
          if (!next) setPendingBitacora(null);
        }}
        onConfirmar={handleConsultaAveria}
        isPending={confirmar.isPending}
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

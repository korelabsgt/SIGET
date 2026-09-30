"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import {
  GvModalForm,
  GvModalFormBody,
  GvModalFooter,
  GvModalShell,
  ModalCancelButton,
  ModalSubmit,
} from "../../lib/gv-modal-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatFechaManualInput,
} from "../../lib/fechas-input";
import { GvFechaInput } from "../../lib/gv-fecha-input";

import {
  vehiculoInputSchema,
  type VehiculoInput,
  type VehiculoRow,
} from "../lib/zod";
import { useCrearVehiculo, useEditarVehiculo } from "../lib/hooks";
import {
  combinarFotosVehiculo,
  estadoVehiculoConReservaFija,
  estadosVehiculoSeleccionables,
  formatEstadoVehiculoLabel,
  separarFotosVehiculo,
  MAX_FOTOS_CIRCULACION,
  MAX_FOTOS_DOCUMENTOS,
  MAX_FOTOS_SEGURO,
  MAX_FOTOS_UNIDAD,
  MAX_FOTOS_VEHICULO,
  MIN_FOTOS_VEHICULO,
} from "../lib/helpers";
import {
  DocumentosVehiculoCampo,
  ImagenVehiculoDropzone,
  uploadImagenVehiculo,
} from "./ImagenVehiculoDropzone";
import {
  resolveStorageDisplaySrc,
  useSignedStorageUrls,
} from "../../lib/storage-hooks";
import { PilotoSelect } from "../../solicitudes/PilotoSelect";

export function VerEditar({
  open,
  onOpenChange,
  initialData,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: VehiculoRow | null;
  onSaved: () => void;
}) {
  const crear = useCrearVehiculo();
  const editar = useEditarVehiculo();
  const [fotosUnidad, setFotosUnidad] = useState<string[]>([]);
  const [fotosCirculacion, setFotosCirculacion] = useState<string[]>([]);
  const [fotoSeguro, setFotoSeguro] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadingDocumentos, setUploadingDocumentos] = useState(0);
  const submitInFlightRef = useRef(false);
  const esNuevo = !initialData?.id;
  const { data: signedMap = {}, isLoading: firmandoFotos } = useSignedStorageUrls(
    combinarFotosVehiculo(fotosUnidad, fotosCirculacion, fotoSeguro),
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VehiculoInput>({
    resolver: zodResolver(vehiculoInputSchema) as never,
    defaultValues: {
      placa: "",
      marca: "",
      modelo: "",
      color: "",
      anio: new Date().getFullYear(),
      kilometraje_actual: 0,
      estado: "LIBRE",
      reserva_usuario_id: null,
      vencimiento_seguro: "",
      vencimiento_circulacion: "",
      imagen_url: [],
    },
  });

  const placa = useWatch({ control, name: "placa" });
  const estadoVehiculo = useWatch({ control, name: "estado" });
  const esReservaIndividual = estadoVehiculo === "RESERVA_INDIVIDUAL";

  useEffect(() => {
    if (!esReservaIndividual) {
      setValue("reserva_usuario_id", null);
    }
  }, [esReservaIndividual, setValue]);

  const totalDocumentos =
    fotosCirculacion.length + (fotoSeguro ? 1 : 0) + uploadingDocumentos;
  const totalImagenes = fotosUnidad.length + uploadingCount + totalDocumentos;
  const maxFotosUnidad = Math.max(MAX_FOTOS_UNIDAD, fotosUnidad.length);
  const cupoDocumentosRestante = Math.max(
    0,
    Math.min(
      MAX_FOTOS_DOCUMENTOS - fotosCirculacion.length - (fotoSeguro ? 1 : 0) - uploadingDocumentos,
      MAX_FOTOS_VEHICULO - totalImagenes,
    ),
  );
  const sinEspacioParaDocumentos = cupoDocumentosRestante <= 0 && uploadingDocumentos === 0;

  const previews = [
    ...fotosUnidad.map((path) => resolveStorageDisplaySrc(path, signedMap)),
    ...Array.from({ length: uploadingCount }, () => ""),
  ];
  const previewLoading = [
    ...fotosUnidad.map((path) => !resolveStorageDisplaySrc(path, signedMap) && firmandoFotos),
    ...Array.from({ length: uploadingCount }, () => true),
  ];
  const documentosPreview = [
    ...fotosCirculacion.map((path, index) => ({
      key: `circ-${path}`,
      preview: resolveStorageDisplaySrc(path, signedMap),
      loading: !resolveStorageDisplaySrc(path, signedMap) && firmandoFotos,
      etiqueta: `Circ. ${index + 1}`,
      onRemove: () => {
        setFotosCirculacion((prev) => prev.filter((_, i) => i !== index));
      },
    })),
    ...(fotoSeguro
      ? [
          {
            key: `seguro-${fotoSeguro}`,
            preview: resolveStorageDisplaySrc(fotoSeguro, signedMap),
            loading: !resolveStorageDisplaySrc(fotoSeguro, signedMap) && firmandoFotos,
            etiqueta: "Seguro",
            onRemove: () => setFotoSeguro(null),
          },
        ]
      : []),
    ...Array.from({ length: uploadingDocumentos }, (_, index) => ({
      key: `doc-pending-${index}`,
      preview: "",
      loading: true,
      etiqueta: "Subiendo",
      onRemove: () => undefined,
    })),
  ];

  const handleRemoveFoto = (index: number) => {
    if (index < fotosUnidad.length) {
      setFotosUnidad((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleAddFiles = async (selectedFiles: File[]) => {
    const placaVal = placa?.trim();
    if (!placaVal) {
      toast.warn("Ingresa la placa antes de subir fotografías.");
      return;
    }

    const room = Math.min(
      maxFotosUnidad - fotosUnidad.length - uploadingCount,
      MAX_FOTOS_VEHICULO - totalImagenes,
    );
    const toAdd = selectedFiles.slice(0, Math.max(0, room));
    if (toAdd.length === 0) {
      toast.warn(
        `Puedes guardar hasta ${MAX_FOTOS_UNIDAD} fotografías del vehículo y ${MAX_FOTOS_DOCUMENTOS} documentos.`,
      );
      return;
    }

    setUploadingCount((prev) => prev + toAdd.length);
    try {
      const uploaded = await Promise.all(
        toAdd.map((item) => uploadImagenVehiculo(item, placaVal, "unidad")),
      );
      setFotosUnidad((prev) => [...prev, ...uploaded].slice(0, maxFotosUnidad));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo subir la fotografía.",
      );
    } finally {
      setUploadingCount((prev) => Math.max(0, prev - toAdd.length));
    }
  };

  const handleAddDocumentos = async (selectedFiles: File[]) => {
    const placaVal = placa?.trim();
    if (!placaVal) {
      toast.warn("Ingresa la placa antes de subir documentos.");
      return;
    }

    const cola: Array<{ file: File; tipo: "circulacion" | "seguro" }> = [];
    let circOcupadas = fotosCirculacion.length;
    let seguroOcupado = fotoSeguro ? 1 : 0;

    for (const file of selectedFiles) {
      if (cola.length >= cupoDocumentosRestante) break;
      if (circOcupadas < MAX_FOTOS_CIRCULACION) {
        cola.push({ file, tipo: "circulacion" });
        circOcupadas += 1;
      } else if (seguroOcupado < MAX_FOTOS_SEGURO) {
        cola.push({ file, tipo: "seguro" });
        seguroOcupado += 1;
      }
    }

    if (cola.length === 0) {
      toast.warn(
        `Puedes subir hasta ${MAX_FOTOS_CIRCULACION} fotografías de circulación y ${MAX_FOTOS_SEGURO} del seguro.`,
      );
      return;
    }

    setUploadingDocumentos((prev) => prev + cola.length);
    try {
      for (const item of cola) {
        const path = await uploadImagenVehiculo(item.file, placaVal, item.tipo);
        if (item.tipo === "circulacion") {
          setFotosCirculacion((prev) =>
            [...prev, path].slice(0, MAX_FOTOS_CIRCULACION),
          );
        } else {
          setFotoSeguro(path);
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo subir el documento.",
      );
    } finally {
      setUploadingDocumentos((prev) => Math.max(0, prev - cola.length));
    }
  };

  useEffect(() => {
    if (open) {
      submitInFlightRef.current = false;
      setUploadingCount(0);
      setUploadingDocumentos(0);
      if (initialData) {
        const { unidad, tarjetasCirculacion, fotoSeguro: seguro } =
          separarFotosVehiculo(initialData);
        setFotosUnidad(unidad);
        setFotosCirculacion(tarjetasCirculacion);
        setFotoSeguro(seguro);
        reset({
          placa: initialData.placa,
          marca: initialData.marca,
          modelo: initialData.modelo,
          color: initialData.color,
          anio: initialData.anio,
          kilometraje_actual: initialData.kilometraje_actual,
          estado: estadoVehiculoConReservaFija(initialData.placa, initialData.estado),
          reserva_usuario_id: initialData.reserva_usuario_id ?? null,
          vencimiento_seguro: formatFechaManualInput(initialData.vencimiento_seguro),
          vencimiento_circulacion: formatFechaManualInput(
            initialData.vencimiento_circulacion,
          ),
          imagen_url: combinarFotosVehiculo(unidad, tarjetasCirculacion, seguro),
        });
      } else {
        setFotosUnidad([]);
        setFotosCirculacion([]);
        setFotoSeguro(null);
        reset({
          placa: "",
          marca: "",
          modelo: "",
          color: "",
          anio: new Date().getFullYear(),
          kilometraje_actual: 0,
          estado: "LIBRE",
          reserva_usuario_id: null,
          vencimiento_seguro: "",
          vencimiento_circulacion: "",
          imagen_url: [],
        });
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: VehiculoInput) => {
    if (submitInFlightRef.current) return;
    if (uploadingCount > 0 || uploadingDocumentos > 0) {
      toast.warn("Espera a que terminen de subir las fotografías.");
      return;
    }
    if (fotosUnidad.length < MIN_FOTOS_VEHICULO) {
      toast.warn("Debes subir al menos una fotografía del vehículo.");
      return;
    }
    if (esNuevo && fotosCirculacion.length < 1) {
      toast.warn("Debes subir al menos una fotografía de la tarjeta de circulación.");
      return;
    }

    submitInFlightRef.current = true;
    try {
      const payload: VehiculoInput = {
        ...data,
        imagen_url: combinarFotosVehiculo(fotosUnidad, fotosCirculacion, fotoSeguro),
      };

      if (initialData?.id) {
        await editar.mutateAsync({ id: initialData.id, input: payload });
        toast.success("Vehículo actualizado correctamente");
      } else {
        await crear.mutateAsync(payload);
        toast.success("Vehículo registrado correctamente");
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar el vehículo");
    } finally {
      submitInFlightRef.current = false;
    }
  };

  const subiendoFotos = uploadingCount > 0 || uploadingDocumentos > 0;
  const isWorking = crear.isPending || editar.isPending || isSubmitting || subiendoFotos;
  const onClose = () => onOpenChange(false);

  return (
    <GvModalShell
      open={open}
      onClose={onClose}
      title={initialData ? "Editar Vehículo" : "Registrar Nuevo Vehículo"}
      maxWidth="max-w-xl"
    >
      {open ? (
        <GvModalForm onSubmit={handleSubmit(onSubmit)}>
          <GvModalFormBody>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="placa">Placa</Label>
              <Input
                id="placa"
                placeholder="Ej. P123ABC"
                className="uppercase"
                {...register("placa")}
              />
              {errors.placa && (
                <p className="text-xs text-red-500">{errors.placa.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <select
                id="estado"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("estado")}
              >
                {estadosVehiculoSeleccionables(placa).map((estado) => (
                  <option key={estado} value={estado}>
                    {formatEstadoVehiculoLabel(estado)}
                  </option>
                ))}
              </select>
              {errors.estado && (
                <p className="text-xs text-red-500">{errors.estado.message}</p>
              )}
            </div>
          </div>

          {esReservaIndividual ? (
            <div className="space-y-2">
              <Label htmlFor="reserva_usuario_id">
                Usuario asignado
                <span className="ml-1 text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="reserva_usuario_id"
                render={({ field }) => (
                  <PilotoSelect
                    value={field.value ?? ""}
                    onChange={(profileId) => {
                      field.onChange(profileId.trim() ? profileId : null);
                    }}
                    disabled={isWorking}
                  />
                )}
              />
              {errors.reserva_usuario_id ? (
                <p className="text-xs text-red-500">
                  {errors.reserva_usuario_id.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Solo aplica mientras el estado sea reserva individual.
                </p>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input id="marca" placeholder="Ej. Toyota" {...register("marca")} />
              {errors.marca && (
                <p className="text-xs text-red-500">{errors.marca.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Input id="modelo" placeholder="Ej. Hilux" {...register("modelo")} />
              {errors.modelo && (
                <p className="text-xs text-red-500">{errors.modelo.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" placeholder="Ej. Blanco" {...register("color")} />
              {errors.color && (
                <p className="text-xs text-red-500">{errors.color.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="anio">Año</Label>
              <Input id="anio" type="number" {...register("anio")} />
              {errors.anio && (
                <p className="text-xs text-red-500">{errors.anio.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="kilometraje">Kilometraje</Label>
              <Input
                id="kilometraje"
                type="number"
                {...register("kilometraje_actual")}
              />
              {errors.kilometraje_actual && (
                <p className="text-xs text-red-500">
                  {errors.kilometraje_actual.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vencimiento_seguro">Vencimiento Seguro</Label>
              <GvFechaInput id="vencimiento_seguro" {...register("vencimiento_seguro")} />
              {errors.vencimiento_seguro && (
                <p className="text-xs text-red-500">
                  {errors.vencimiento_seguro.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vencimiento_circulacion">Vencimiento Circulación</Label>
              <GvFechaInput id="vencimiento_circulacion" {...register("vencimiento_circulacion")} />
              {errors.vencimiento_circulacion && (
                <p className="text-xs text-red-500">
                  {errors.vencimiento_circulacion.message}
                </p>
              )}
            </div>
          </div>

          <ImagenVehiculoDropzone
            previews={previews}
            previewLoading={previewLoading}
            onAddFiles={(files) => {
              void handleAddFiles(files);
            }}
            onRemove={handleRemoveFoto}
            disabled={isWorking}
            max={maxFotosUnidad}
          />

          <DocumentosVehiculoCampo
            documentos={documentosPreview}
            onAddFiles={(files) => {
              void handleAddDocumentos(files);
            }}
            disabled={isWorking}
            sinEspacio={sinEspacioParaDocumentos}
            requeridaCirculacion={esNuevo}
          />

          </GvModalFormBody>

          <GvModalFooter>
            <ModalCancelButton onClick={onClose} disabled={isWorking} />
            <ModalSubmit
              disabled={isWorking}
              label={
                subiendoFotos
                  ? "Subiendo"
                  : isWorking
                    ? initialData
                      ? "Guardando"
                      : "Registrando"
                    : initialData
                      ? "Guardar"
                      : "Registrar"
              }
            />
          </GvModalFooter>
        </GvModalForm>
      ) : null}
    </GvModalShell>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import {
  GvModalForm,
  GvModalFormBody,
  GvModalShell,
  ModalFooter,
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
  ESTADOS_VEHICULO,
  type VehiculoInput,
  type VehiculoRow,
} from "../lib/zod";
import { useCrearVehiculo, useEditarVehiculo } from "../lib/hooks";
import { fotosVehiculo, MAX_FOTOS_VEHICULO, MIN_FOTOS_VEHICULO } from "../lib/helpers";
import { ImagenVehiculoDropzone, uploadImagenVehiculo } from "./ImagenVehiculoDropzone";
import {
  resolveStorageDisplaySrc,
  useSignedStorageUrls,
} from "../../lib/storage-hooks";

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
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const submitInFlightRef = useRef(false);
  const { data: signedMap = {}, isLoading: firmandoFotos } = useSignedStorageUrls(existingUrls);

  const {
    register,
    handleSubmit,
    reset,
    control,
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
      vencimiento_seguro: "",
      vencimiento_circulacion: "",
      imagen_url: [],
    },
  });

  const placa = useWatch({ control, name: "placa" });

  const previews = [
    ...existingUrls.map((path) => resolveStorageDisplaySrc(path, signedMap)),
    ...Array.from({ length: uploadingCount }, () => ""),
  ];
  const previewLoading = [
    ...existingUrls.map((path) => !resolveStorageDisplaySrc(path, signedMap) && firmandoFotos),
    ...Array.from({ length: uploadingCount }, () => true),
  ];

  const handleRemoveFoto = (index: number) => {
    if (index < existingUrls.length) {
      setExistingUrls((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleAddFiles = async (selectedFiles: File[]) => {
    const placaVal = placa?.trim();
    if (!placaVal) {
      toast.warn("Ingresa la placa antes de subir fotografías.");
      return;
    }

    const room = MAX_FOTOS_VEHICULO - existingUrls.length - uploadingCount;
    const toAdd = selectedFiles.slice(0, Math.max(0, room));
    if (toAdd.length === 0) {
      toast.warn(`Puedes agregar hasta ${MAX_FOTOS_VEHICULO} fotografías.`);
      return;
    }

    setUploadingCount((prev) => prev + toAdd.length);
    try {
      const uploaded = await Promise.all(
        toAdd.map((item) => uploadImagenVehiculo(item, placaVal)),
      );
      setExistingUrls((prev) => [...prev, ...uploaded].slice(0, MAX_FOTOS_VEHICULO));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo subir la fotografía.",
      );
    } finally {
      setUploadingCount((prev) => Math.max(0, prev - toAdd.length));
    }
  };

  useEffect(() => {
    if (open) {
      submitInFlightRef.current = false;
      setUploadingCount(0);
      if (initialData) {
        const fotos = fotosVehiculo(initialData);
        setExistingUrls(fotos);
        reset({
          placa: initialData.placa,
          marca: initialData.marca,
          modelo: initialData.modelo,
          color: initialData.color,
          anio: initialData.anio,
          kilometraje_actual: initialData.kilometraje_actual,
          estado: initialData.estado,
          vencimiento_seguro: formatFechaManualInput(initialData.vencimiento_seguro),
          vencimiento_circulacion: formatFechaManualInput(
            initialData.vencimiento_circulacion,
          ),
          imagen_url: fotos,
        });
      } else {
        setExistingUrls([]);
        reset({
          placa: "",
          marca: "",
          modelo: "",
          color: "",
          anio: new Date().getFullYear(),
          kilometraje_actual: 0,
          estado: "LIBRE",
          vencimiento_seguro: "",
          vencimiento_circulacion: "",
          imagen_url: [],
        });
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: VehiculoInput) => {
    if (submitInFlightRef.current) return;
    if (uploadingCount > 0) {
      toast.warn("Espera a que terminen de subir las fotografías.");
      return;
    }
    if (existingUrls.length < MIN_FOTOS_VEHICULO) {
      toast.warn("Debes subir al menos una fotografía del vehículo.");
      return;
    }

    submitInFlightRef.current = true;
    try {
      const payload: VehiculoInput = {
        ...data,
        imagen_url: existingUrls,
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

  const subiendoFotos = uploadingCount > 0;
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
                {ESTADOS_VEHICULO.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado.replace("_", " ")}
                  </option>
                ))}
              </select>
              {errors.estado && (
                <p className="text-xs text-red-500">{errors.estado.message}</p>
              )}
            </div>
          </div>

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
          />

          </GvModalFormBody>

          <ModalFooter>
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
          </ModalFooter>
        </GvModalForm>
      ) : null}
    </GvModalShell>
  );
}

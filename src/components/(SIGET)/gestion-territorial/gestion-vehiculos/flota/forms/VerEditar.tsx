"use client";

import { useEffect, useState } from "react";
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
import {
  aplicarMascaraEnInput,
  formatFechaManualInput,
  maskFechaManual,
} from "../../lib/fechas-input";
import { Button } from "@/components/ui/button";

import {
  vehiculoInputSchema,
  ESTADOS_VEHICULO,
  type VehiculoInput,
  type VehiculoRow,
} from "../lib/zod";
import { useCrearVehiculo, useEditarVehiculo } from "../lib/hooks";
import { fotosVehiculo, MAX_FOTOS_VEHICULO, MIN_FOTOS_VEHICULO } from "../lib/helpers";
import { ImagenVehiculoDropzone, fileToDataUrl, uploadImagenVehiculo } from "./ImagenVehiculoDropzone";
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
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { data: signedMap = {} } = useSignedStorageUrls(existingUrls);

  const {
    register,
    handleSubmit,
    reset,
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

  const previews = [
    ...existingUrls.map((path) => resolveStorageDisplaySrc(path, signedMap)),
    ...pendingPreviews,
  ];

  const handleRemoveFoto = (index: number) => {
    if (index < existingUrls.length) {
      setExistingUrls((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    const pendingIndex = index - existingUrls.length;
    setPendingFiles((prev) => prev.filter((_, i) => i !== pendingIndex));
    setPendingPreviews((prev) => prev.filter((_, i) => i !== pendingIndex));
  };

  const handleAddFiles = async (selectedFiles: File[]) => {
    const room = MAX_FOTOS_VEHICULO - existingUrls.length - pendingFiles.length;
    const toAdd = selectedFiles.slice(0, Math.max(0, room));
    if (toAdd.length === 0) {
      toast.warn(`Puedes agregar hasta ${MAX_FOTOS_VEHICULO} fotografías.`);
      return;
    }
    try {
      const urls = await Promise.all(toAdd.map((item) => fileToDataUrl(item)));
      setPendingFiles((prev) => [...prev, ...toAdd]);
      setPendingPreviews((prev) => [...prev, ...urls]);
    } catch {
      toast.error("No se pudo leer la imagen seleccionada.");
    }
  };

  useEffect(() => {
    if (open) {
      setPendingFiles([]);
      setPendingPreviews([]);
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
    if (existingUrls.length + pendingFiles.length < MIN_FOTOS_VEHICULO) {
      toast.warn("Debes subir al menos una fotografía del vehículo.");
      return;
    }

    setUploading(true);
    try {
      const uploaded = await Promise.all(
        pendingFiles.map((item) => uploadImagenVehiculo(item, data.placa)),
      );
      const imagen_url = [...existingUrls, ...uploaded];

      const payload: VehiculoInput = {
        ...data,
        imagen_url,
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
      setUploading(false);
    }
  };

  const isWorking = crear.isPending || editar.isPending || isSubmitting || uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Vehículo" : "Registrar Nuevo Vehículo"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
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
              <Input
                id="vencimiento_seguro"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                {...register("vencimiento_seguro", {
                  onChange: (e) => {
                    aplicarMascaraEnInput(e.target, maskFechaManual);
                  },
                })}
              />
              <p className="text-[11px] text-muted-foreground">DD/MM/AAAA</p>
              {errors.vencimiento_seguro && (
                <p className="text-xs text-red-500">
                  {errors.vencimiento_seguro.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vencimiento_circulacion">Vencimiento Circulación</Label>
              <Input
                id="vencimiento_circulacion"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                {...register("vencimiento_circulacion", {
                  onChange: (e) => {
                    aplicarMascaraEnInput(e.target, maskFechaManual);
                  },
                })}
              />
              <p className="text-[11px] text-muted-foreground">DD/MM/AAAA</p>
              {errors.vencimiento_circulacion && (
                <p className="text-xs text-red-500">
                  {errors.vencimiento_circulacion.message}
                </p>
              )}
            </div>
          </div>

          <ImagenVehiculoDropzone
            previews={previews}
            onAddFiles={(files) => {
              void handleAddFiles(files);
            }}
            onRemove={handleRemoveFoto}
            disabled={isWorking}
          />

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isWorking}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isWorking} className="bg-azul-trifinio text-white hover:bg-azul-trifinio/90">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Subiendo fotografías...
                </>
              ) : isWorking ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {initialData ? "Guardando..." : "Registrando..."}
                </>
              ) : initialData ? (
                "Guardar Cambios"
              ) : (
                "Registrar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

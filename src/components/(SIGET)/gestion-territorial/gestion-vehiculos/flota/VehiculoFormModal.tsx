import { useEffect, useState, useTransition } from "react";
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
import { Button } from "@/components/ui/button";

import {
  vehiculoInputSchema,
  ESTADOS_VEHICULO,
  type VehiculoInput,
  type VehiculoRow,
} from "./lib/zod";
import { createVehiculo, updateVehiculo } from "./lib/actions";

export function VehiculoFormModal({
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
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehiculoInput>({
    resolver: zodResolver(vehiculoInputSchema),
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
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          placa: initialData.placa,
          marca: initialData.marca,
          modelo: initialData.modelo,
          color: initialData.color,
          anio: initialData.anio,
          kilometraje_actual: initialData.kilometraje_actual,
          estado: initialData.estado,
          vencimiento_seguro: initialData.vencimiento_seguro
            ? new Date(initialData.vencimiento_seguro).toISOString().split("T")[0]
            : "",
          vencimiento_circulacion: initialData.vencimiento_circulacion
            ? new Date(initialData.vencimiento_circulacion).toISOString().split("T")[0]
            : "",
        });
      } else {
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
        });
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = (data: VehiculoInput) => {
    startTransition(async () => {
      try {
        if (initialData?.id) {
          await updateVehiculo(initialData.id, data);
          toast.success("Vehículo actualizado correctamente");
        } else {
          await createVehiculo(data);
          toast.success("Vehículo registrado correctamente");
        }
        onSaved();
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al guardar el vehículo");
      }
    });
  };

  const isWorking = isPending || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
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
                type="date"
                {...register("vencimiento_seguro")}
              />
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
                type="date"
                {...register("vencimiento_circulacion")}
              />
              {errors.vencimiento_circulacion && (
                <p className="text-xs text-red-500">
                  {errors.vencimiento_circulacion.message}
                </p>
              )}
            </div>
          </div>

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
              {isWorking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Guardar Cambios" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

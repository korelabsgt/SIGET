"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  FONDOS_COMBUSTIBLE,
  valeLoteInputSchema,
  type FondoCombustible,
  type ValeLoteFormValues,
  type ValeLoteInput,
} from "../lib/zod";
import { useCrearValeCombustible } from "../lib/hooks";

export function CrearVale({
  open,
  onOpenChange,
  onSaved,
  defaultFondo = "OT",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  defaultFondo?: FondoCombustible;
}) {
  const crear = useCrearValeCombustible();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ValeLoteFormValues, unknown, ValeLoteInput>({
    resolver: zodResolver(valeLoteInputSchema),
    defaultValues: { fondo: defaultFondo },
  });

  useEffect(() => {
    if (!open) return;
    reset({ fondo: defaultFondo });
  }, [open, reset, defaultFondo]);

  const onClose = () => onOpenChange(false);

  const onSubmit = async (data: ValeLoteInput) => {
    try {
      const res = await crear.mutateAsync(data);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Lote de vales registrado");
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar el lote");
    }
  };

  return (
    <GvModalShell
      open={open}
      onClose={onClose}
      title="Registrar lote de vales"
      subtitle="Inventario de cupones por fondo y denominación"
      maxWidth="max-w-lg"
    >
      {open ? (
        <GvModalForm onSubmit={handleSubmit(onSubmit)}>
          <GvModalFormBody className="space-y-4">
            <div className="space-y-2">
              <Label>Fondo</Label>
              <Select
                value={watch("fondo")}
                onValueChange={(value) =>
                  setValue("fondo", value as ValeLoteFormValues["fondo"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className={GV_MODAL_SELECT_TRIGGER_CLASS}>
                  <SelectValue placeholder="Seleccione fondo" />
                </SelectTrigger>
                <SelectContent position="popper" className={GV_MODAL_SELECT_CONTENT_CLASS}>
                  {FONDOS_COMBUSTIBLE.map((fondo) => (
                    <SelectItem key={fondo} value={fondo} className={GV_MODAL_SELECT_ITEM_CLASS}>
                      {fondo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="denominacion">Denominación (Q.)</Label>
              <Input
                id="denominacion"
                type="number"
                step="0.01"
                placeholder="Ej. 100.00"
                {...register("denominacion")}
              />
              <p className="text-xs text-muted-foreground">
                Valor en quetzales de cada cupón del talonario (ej. Q. 100.00).
              </p>
              {errors.denominacion ? (
                <p className="text-xs text-red-500">{errors.denominacion.message}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cupon_del">Cupón del</Label>
                <Input
                  id="cupon_del"
                  type="number"
                  placeholder="Ej. 15001"
                  {...register("cupon_del")}
                />
                {errors.cupon_del ? (
                  <p className="text-xs text-red-500">{errors.cupon_del.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cupon_al">Cupón al</Label>
                <Input
                  id="cupon_al"
                  type="number"
                  placeholder="Ej. 15050"
                  {...register("cupon_al")}
                />
                {errors.cupon_al ? (
                  <p className="text-xs text-red-500">{errors.cupon_al.message}</p>
                ) : null}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Numeración del primer y último cupón físico del lote. La cantidad de cupones se calcula
              sola (ej. del 15001 al 15050 = 50 cupones).
            </p>
          </GvModalFormBody>

          <GvModalFooter>
            <ModalCancelButton onClick={onClose} disabled={crear.isPending || isSubmitting} />
            <ModalSubmit disabled={crear.isPending || isSubmitting} label="Registrar" />
          </GvModalFooter>
        </GvModalForm>
      ) : null}
    </GvModalShell>
  );
}


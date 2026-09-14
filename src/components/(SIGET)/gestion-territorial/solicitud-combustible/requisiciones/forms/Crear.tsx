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
  requisicionInputSchema,
  type RequisicionInput,
} from "../lib/zod";
import { useCrearRequisicionCombustible } from "../lib/hooks";

export function CrearRequisicion({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const crear = useCrearRequisicionCombustible();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RequisicionInput>({
    resolver: zodResolver(requisicionInputSchema) as never,
    defaultValues: {
      cantidad: 10,
      denominacion: 100,
      cupon_del: 1,
      cupon_al: 10,
      fondo: "OT",
    },
  });

  const cuponDel = watch("cupon_del");
  const cuponAl = watch("cupon_al");

  useEffect(() => {
    if (!open) return;
    reset({
      cantidad: 10,
      denominacion: 100,
      cupon_del: 1,
      cupon_al: 10,
      fondo: "OT",
    });
  }, [open, reset]);

  useEffect(() => {
    const del = Number(cuponDel) || 0;
    const al = Number(cuponAl) || 0;
    if (del > 0 && al >= del) {
      setValue("cantidad", al - del + 1, { shouldValidate: true });
    }
  }, [cuponDel, cuponAl, setValue]);

  const onClose = () => onOpenChange(false);

  const onSubmit = async (data: RequisicionInput) => {
    try {
      const res = await crear.mutateAsync(data);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Requisición registrada");
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar la requisición");
    }
  };

  return (
    <GvModalShell
      open={open}
      onClose={onClose}
      title="Registrar requisición de cupones"
      subtitle="Lote o talonario de vales de combustible"
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
                  setValue("fondo", value as RequisicionInput["fondo"], {
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
              <Input id="denominacion" type="number" step="0.01" {...register("denominacion")} />
              {errors.denominacion ? (
                <p className="text-xs text-red-500">{errors.denominacion.message}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cupon_del">Cupón del</Label>
                <Input id="cupon_del" type="number" {...register("cupon_del")} />
                {errors.cupon_del ? (
                  <p className="text-xs text-red-500">{errors.cupon_del.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cupon_al">Cupón al</Label>
                <Input id="cupon_al" type="number" {...register("cupon_al")} />
                {errors.cupon_al ? (
                  <p className="text-xs text-red-500">{errors.cupon_al.message}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad de cupones</Label>
              <Input id="cantidad" type="number" readOnly {...register("cantidad")} />
              {errors.cantidad ? (
                <p className="text-xs text-red-500">{errors.cantidad.message}</p>
              ) : null}
            </div>
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

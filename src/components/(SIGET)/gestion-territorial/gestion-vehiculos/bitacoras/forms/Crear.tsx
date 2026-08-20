"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Car, MapPin, GaugeCircle, Receipt, User, Link as LinkIcon, Route, Fuel } from "lucide-react";
import { toast } from "react-toastify";

import { type BitacoraInput, bitacoraInputSchema } from "../lib/zod";
import { useBitacoraFormOptions, useCrearBitacora } from "../lib/hooks";
import { type VehiculoRow } from "../../flota/lib/zod";

interface SolicitudActiva {
  id: string;
  destino: string;
  conductor_id: string;
  vehiculo_id: string;
  ter_vehiculos: { kilometraje_actual: number } | { kilometraje_actual: number }[] | null;
}

const CHECKLIST_PRE = [
  { id: "luces", label: "Luces funcionales" },
  { id: "neumaticos", label: "Presión/Estado de neumáticos" },
  { id: "liquidos", label: "Niveles de líquidos (aceite, agua)" },
  { id: "emergencia", label: "Kit de emergencia completo" },
  { id: "documentos", label: "Tarjeta de circulación y seguro" },
];

const CHECKLIST_POST = [
  { id: "luces_post", label: "Luces funcionales post-viaje" },
  { id: "limpieza", label: "Vehículo entregado limpio" },
  { id: "danos", label: "Sin daños o novedades mecánicas" },
];

// Initialize all to true as requested
const defaultChecklistPre = CHECKLIST_PRE.reduce((acc, item) => ({ ...acc, [item.id]: true }), {});
const defaultChecklistPost = CHECKLIST_POST.reduce((acc, item) => ({ ...acc, [item.id]: true }), {});

function kmDeMision(
  rel: SolicitudActiva["ter_vehiculos"],
): number {
  if (!rel) return 0;
  if (Array.isArray(rel)) return rel[0]?.kilometraje_actual || 0;
  return rel.kilometraje_actual || 0;
}

interface CrearProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Crear({ open, onOpenChange }: CrearProps) {
  const crear = useCrearBitacora();
  const { data: options, isLoading: loading } = useBitacoraFormOptions(open);
  const conductores = (options?.conductores ?? []) as { id: string; full_name: string | null }[];
  const vehiculos = (options?.vehiculos ?? []) as VehiculoRow[];
  const misiones = (options?.misiones ?? []) as SolicitudActiva[];

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<BitacoraInput>({
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
      checklist_pre: defaultChecklistPre,
      checklist_post: defaultChecklistPost,
    },
  });

  const selectedMisionId = watch("solicitud_id");
  const selectedVehiculoId = watch("vehiculo_id");
  const kmInicial = watch("km_inicial");
  const kmFinal = watch("km_final");
  const recorrido = Math.max(0, kmFinal - kmInicial);

  useEffect(() => {
    if (open) {
      reset({
        solicitud_id: "",
        vehiculo_id: "",
        conductor_id: "",
        destino: "",
        km_inicial: 0,
        km_final: 0,
        vale_combustible: "",
        monto_combustible: 0,
        checklist_pre: defaultChecklistPre,
        checklist_post: defaultChecklistPost,
      });
    }
  }, [open, reset]);

  // Handle Misión Selection
  useEffect(() => {
    if (selectedMisionId && misiones.length > 0) {
      const mision = misiones.find(m => m.id === selectedMisionId);
      if (mision) {
        const kmActual = kmDeMision(mision.ter_vehiculos);
        setValue("vehiculo_id", mision.vehiculo_id, { shouldValidate: true });
        setValue("conductor_id", mision.conductor_id, { shouldValidate: true });
        setValue("destino", mision.destino, { shouldValidate: true });
        setValue("km_inicial", kmActual, { shouldValidate: true });
        setValue("km_final", kmActual);
      }
    }
  }, [selectedMisionId, misiones, setValue]);

  // Handle manual vehicle selection (updates km_inicial if not driven by mission)
  useEffect(() => {
    if (selectedVehiculoId && !selectedMisionId) {
      const vehiculo = vehiculos.find(v => v.id === selectedVehiculoId);
      if (vehiculo) {
        setValue("km_inicial", vehiculo.kilometraje_actual, { shouldValidate: true });
        setValue("km_final", vehiculo.kilometraje_actual);
      }
    }
  }, [selectedVehiculoId, selectedMisionId, vehiculos, setValue]);

  const onFormSubmit = async (data: BitacoraInput) => {
    try {
      const res = await crear.mutateAsync(data);
      if (res.success) {
        toast.success("Bitácora registrada con éxito");
        onOpenChange(false);
      } else {
        toast.error("Hubo un error al guardar la bitácora");
      }
    } catch {
      toast.error("Error inesperado");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} className="sm:max-w-4xl max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <Route className="h-6 w-6 text-indigo-500" />
            Registro de Bitácora de Viaje
          </DialogTitle>
          <DialogDescription>
            Documenta la ruta, kilometraje y el consumo de combustible.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-3 mt-1">
            
            {/* Vinculación Rápida */}
            <div className="bg-indigo-50/50 dark:bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
              <Label className="text-indigo-800 dark:text-indigo-300 font-bold flex items-center gap-1.5 mb-3">
                <LinkIcon className="h-4 w-4" /> Vinculación de Misión en Curso
              </Label>
              <Controller
                name="solicitud_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={(val) => field.onChange(val === "none" ? "" : val)} value={field.value || "none"}>
                    <SelectTrigger className="bg-white dark:bg-zinc-900">
                      <SelectValue placeholder="Seleccionar misión activa (Opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguna (Registro manual)</SelectItem>
                      {misiones.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          Misión a {m.destino} (In: {kmDeMision(m.ter_vehiculos)} km)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5" /> Vehículo
                </Label>
                <Controller
                  name="vehiculo_id"
                  control={control}
                  render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || "none"} disabled={!!selectedMisionId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="hidden">Seleccionar...</SelectItem>
                        {vehiculos.map((v) => (
                          <SelectItem key={v.id} value={v.id || "fallback"}>
                            {v.placa} - {v.marca} {v.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.vehiculo_id && <p className="text-xs text-red-500">{errors.vehiculo_id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Conductor
                </Label>
                <Controller
                  name="conductor_id"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || "none"} disabled={!!selectedMisionId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="hidden">Seleccionar...</SelectItem>
                        {conductores.map((c) => (
                          <SelectItem key={c.id} value={c.id || "fallback"}>
                            {c.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.conductor_id && <p className="text-xs text-red-500">{errors.conductor_id.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Destino de la ruta
              </Label>
              <Input {...register("destino")} disabled={!!selectedMisionId} placeholder="Lugar o ruta recorrida" />
              {errors.destino && <p className="text-xs text-red-500">{errors.destino.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4 bg-muted/30 p-2.5 rounded-xl border border-border">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Km Inicial</Label>
                <Input type="number" {...register("km_inicial")} readOnly className="bg-zinc-100 dark:bg-zinc-800 opacity-70" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Km Final</Label>
                <Input type="number" {...register("km_final")} />
                {errors.km_final && <p className="text-xs text-red-500 leading-tight">{errors.km_final.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-indigo-500 flex items-center gap-1.5">
                  <GaugeCircle className="h-3.5 w-3.5" /> Recorrido
                </Label>
                <div className="h-9 flex items-center px-3 rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-black">
                  {recorrido} km
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5" /> Vale de Combustible
                </Label>
                <Input {...register("vale_combustible")} placeholder="# Vale (Opcional)" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Fuel className="h-3.5 w-3.5" /> Monto (Q.)
                </Label>
                <Input type="number" step="0.01" {...register("monto_combustible")} />
              </div>
            </div>

            {/* Checklists */}
            <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border/50">
              <div className="space-y-2">
                <h4 className="text-sm font-black text-foreground border-b pb-1">Checklist Pre-Viaje</h4>
                <div className="space-y-2">
                  {CHECKLIST_PRE.map((item) => (
                    <Controller
                      key={item.id}
                      name={`checklist_pre.${item.id}`}
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center justify-between gap-2">
                          <Label className="text-xs text-muted-foreground cursor-pointer" onClick={() => field.onChange(!field.value)}>
                            {item.label}
                          </Label>
                          <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                        </div>
                      )}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-black text-foreground border-b pb-1">Checklist Post-Viaje</h4>
                <div className="space-y-2">
                  {CHECKLIST_POST.map((item) => (
                    <Controller
                      key={item.id}
                      name={`checklist_post.${item.id}`}
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center justify-between gap-2">
                          <Label className="text-xs text-muted-foreground cursor-pointer" onClick={() => field.onChange(!field.value)}>
                            {item.label}
                          </Label>
                          <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                        </div>
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={crear.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {crear.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Bitácora
              </Button>
            </div>

          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

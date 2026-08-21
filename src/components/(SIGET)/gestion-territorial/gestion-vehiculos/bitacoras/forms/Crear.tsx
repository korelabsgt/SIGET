"use client";

import { useEffect, type LabelHTMLAttributes } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Car,
  MapPin,
  GaugeCircle,
  Receipt,
  User,
  Link as LinkIcon,
  Route,
  Fuel,
  ListChecks,
  ClipboardCheck,
  ChevronLeft,
} from "lucide-react";
import { toast } from "react-toastify";

import { cn } from "@/lib/utils";
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

const defaultChecklistPre = CHECKLIST_PRE.reduce(
  (acc, item) => ({ ...acc, [item.id]: true }),
  {} as Record<string, boolean>,
);
const defaultChecklistPost = CHECKLIST_POST.reduce(
  (acc, item) => ({ ...acc, [item.id]: true }),
  {} as Record<string, boolean>,
);

const sectionTitleClass =
  "flex items-center gap-2 bg-azul-trifinio text-white px-4 py-2.5 rounded-t-xl text-sm font-bold tracking-tight";

const formSectionClass =
  "rounded-xl border border-border bg-card dark:border-zinc-700/90 dark:bg-zinc-900/90";

const formInputClass =
  "h-10 w-full rounded-lg border border-border bg-zinc-50 px-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/70 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:[color-scheme:dark]";

const formLabelClass =
  "text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300";

const selectContentClass =
  "z-[200] max-h-60 border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900";

const selectItemClass =
  "cursor-pointer rounded-lg bg-white focus:bg-sky-50 dark:bg-zinc-900 dark:focus:bg-zinc-800";

function FieldLabel({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={cn(formLabelClass, className)} />;
}

function kmDeMision(rel: SolicitudActiva["ter_vehiculos"]): number {
  if (!rel) return 0;
  if (Array.isArray(rel)) return rel[0]?.kilometraje_actual || 0;
  return rel.kilometraje_actual || 0;
}

function formatVehiculoLabel(v: Pick<VehiculoRow, "placa" | "marca" | "modelo">) {
  return `${v.placa} · ${v.marca} ${v.modelo}`;
}

export function Crear({
  onBack,
  onSaved,
}: {
  onBack: () => void;
  onSaved: () => void;
}) {
  const crear = useCrearBitacora();
  const { data: options, isLoading: loading } = useBitacoraFormOptions(true);
  const conductores = (options?.conductores ?? []) as { id: string; nombre: string | null }[];
  const vehiculos = (options?.vehiculos ?? []) as VehiculoRow[];
  const misiones = (options?.misiones ?? []) as SolicitudActiva[];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
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
  }, [reset]);

  useEffect(() => {
    if (selectedMisionId && misiones.length > 0) {
      const mision = misiones.find((m) => m.id === selectedMisionId);
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

  useEffect(() => {
    if (selectedVehiculoId && !selectedMisionId) {
      const vehiculo = vehiculos.find((v) => v.id === selectedVehiculoId);
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
        onSaved();
      } else {
        toast.error("Hubo un error al guardar la bitácora");
      }
    } catch {
      toast.error("Error inesperado");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="w-full">
      <div className="mb-6 flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-accent dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <ChevronLeft className="size-5 text-muted-foreground dark:text-zinc-400" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-black leading-tight tracking-tight text-foreground dark:text-zinc-50">
            Nuevo registro de bitácora de viaje
          </h2>
          <p className="text-sm text-muted-foreground dark:text-zinc-400">
            Formulario operativo de recorrido — Gestión vehicular
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <section className={formSectionClass}>
          <div className={sectionTitleClass}>
            <LinkIcon className="size-4" />
            Vinculación de misión en curso
          </div>
          <div className="grid gap-1.5 p-4">
            <FieldLabel>Misión activa (opcional)</FieldLabel>
            <Controller
              name="solicitud_id"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                  value={field.value || "none"}
                >
                  <SelectTrigger className={cn(formInputClass, "cursor-pointer shadow-none")}>
                    <SelectValue placeholder="Seleccionar misión en curso" />
                  </SelectTrigger>
                  <SelectContent position="popper" className={selectContentClass}>
                    <SelectItem value="none" className={selectItemClass}>
                      Ninguna — registro manual
                    </SelectItem>
                    {misiones.map((m) => {
                      const label = `Misión a ${m.destino} · ${kmDeMision(m.ter_vehiculos)} km`;
                      return (
                        <SelectItem
                          key={m.id}
                          value={m.id}
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
            {selectedMisionId ? (
              <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-500">
                Vehículo, conductor y destino se completan desde la misión seleccionada.
              </p>
            ) : null}
          </div>
        </section>

        <section className={formSectionClass}>
          <div className={sectionTitleClass}>
            <Car className="size-4" />
            Asignación del viaje
          </div>
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="grid gap-1.5">
                <FieldLabel>Vehículo</FieldLabel>
                <Controller
                  name="vehiculo_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                      disabled={!!selectedMisionId}
                    >
                      <SelectTrigger
                        className={cn(formInputClass, "cursor-pointer shadow-none")}
                        disabled={!!selectedMisionId}
                      >
                        <SelectValue placeholder="Seleccionar vehículo" />
                      </SelectTrigger>
                      <SelectContent position="popper" className={selectContentClass}>
                        {vehiculos
                          .filter((v) => v.id)
                          .map((v) => {
                            const label = formatVehiculoLabel(v);
                            return (
                              <SelectItem
                                key={v.id}
                                value={v.id as string}
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
                {errors.vehiculo_id ? (
                  <p className="text-xs text-red-500">{errors.vehiculo_id.message}</p>
                ) : null}
              </div>

              <div className="grid gap-1.5">
                <FieldLabel>Conductor</FieldLabel>
                <Controller
                  name="conductor_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                      disabled={!!selectedMisionId}
                    >
                      <SelectTrigger
                        className={cn(formInputClass, "cursor-pointer shadow-none")}
                        disabled={!!selectedMisionId}
                      >
                        <SelectValue placeholder="Seleccionar conductor" />
                      </SelectTrigger>
                      <SelectContent position="popper" className={selectContentClass}>
                        {conductores.map((c) => (
                          <SelectItem
                            key={c.id}
                            value={c.id}
                            textValue={c.nombre ?? ""}
                            className={selectItemClass}
                          >
                            {c.nombre ?? "Sin nombre"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.conductor_id ? (
                  <p className="text-xs text-red-500">{errors.conductor_id.message}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-1.5">
              <FieldLabel>Destino de la ruta</FieldLabel>
              <Input
                {...register("destino")}
                disabled={!!selectedMisionId}
                className={cn(formInputClass, "shadow-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio")}
              />
              {errors.destino ? (
                <p className="text-xs text-red-500">{errors.destino.message}</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className={formSectionClass}>
          <div className={sectionTitleClass}>
            <GaugeCircle className="size-4" />
            Kilometraje
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <FieldLabel>Km inicial</FieldLabel>
              <Input
                type="number"
                {...register("km_inicial")}
                readOnly
                className={cn(formInputClass, "tabular-nums opacity-80 shadow-none")}
              />
            </div>
            <div className="grid gap-1.5">
              <FieldLabel>Km final</FieldLabel>
              <Input
                type="number"
                {...register("km_final")}
                className={cn(
                  formInputClass,
                  "tabular-nums shadow-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio",
                )}
              />
              {errors.km_final ? (
                <p className="text-xs text-red-500">{errors.km_final.message}</p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <FieldLabel>Recorrido</FieldLabel>
              <div
                className={cn(
                  formInputClass,
                  "flex items-center justify-between font-black tabular-nums text-celeste-trifinio",
                )}
              >
                <span>{recorrido}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  km
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className={formSectionClass}>
          <div className={sectionTitleClass}>
            <Fuel className="size-4" />
            Combustible
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
            <div className="grid gap-1.5">
              <FieldLabel className="flex items-center gap-1.5">
                <Receipt className="size-3.5" />
                Vale de combustible
              </FieldLabel>
              <Input
                {...register("vale_combustible")}
                className={cn(formInputClass, "shadow-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio")}
              />
            </div>
            <div className="grid gap-1.5">
              <FieldLabel>Monto (Q.)</FieldLabel>
              <Input
                type="number"
                step="0.01"
                {...register("monto_combustible")}
                className={cn(
                  formInputClass,
                  "tabular-nums shadow-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio",
                )}
              />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className={formSectionClass}>
            <div className={sectionTitleClass}>
              <ListChecks className="size-4" />
              Checklist pre-viaje
            </div>
            <div className="space-y-2 p-4">
              {CHECKLIST_PRE.map((item) => (
                <Controller
                  key={item.id}
                  name={`checklist_pre.${item.id}`}
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/60">
                      <FieldLabel
                        className="cursor-pointer normal-case tracking-normal text-xs font-medium text-foreground dark:text-zinc-200"
                        onClick={() => field.onChange(!field.value)}
                      >
                        {item.label}
                      </FieldLabel>
                      <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                    </div>
                  )}
                />
              ))}
            </div>
          </section>

          <section className={formSectionClass}>
            <div className={sectionTitleClass}>
              <ClipboardCheck className="size-4" />
              Checklist post-viaje
            </div>
            <div className="space-y-2 p-4">
              {CHECKLIST_POST.map((item) => (
                <Controller
                  key={item.id}
                  name={`checklist_post.${item.id}`}
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/60">
                      <FieldLabel
                        className="cursor-pointer normal-case tracking-normal text-xs font-medium text-foreground dark:text-zinc-200"
                        onClick={() => field.onChange(!field.value)}
                      >
                        {item.label}
                      </FieldLabel>
                      <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                    </div>
                  )}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="mt-2 flex flex-col-reverse items-stretch gap-3 border-t border-border pt-6 pb-8 dark:border-zinc-700 sm:flex-row sm:items-center sm:justify-center">
          <button
            type="button"
            onClick={onBack}
            disabled={crear.isPending}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border-0 bg-zinc-200 px-6 text-[10px] font-bold uppercase tracking-widest text-zinc-700 transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={crear.isPending}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-emerald-200 px-6 text-[10px] font-bold uppercase tracking-widest text-emerald-900 transition-colors hover:bg-emerald-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-800/70 dark:text-emerald-50 dark:hover:bg-emerald-700/80"
          >
            {crear.isPending ? <Loader2 className="size-4 animate-spin" /> : <Route className="size-4" />}
            Registrar bitácora
          </button>
        </div>
      </div>
    </form>
  );
}

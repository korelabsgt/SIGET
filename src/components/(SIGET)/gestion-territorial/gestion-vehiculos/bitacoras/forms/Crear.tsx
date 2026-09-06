"use client";

import { useEffect, useRef, useState, type LabelHTMLAttributes } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowLeft,
  Car,
  CarFront,
  ChevronLeft,
  CirclePlus,
  EllipsisVertical,
  FileText,
  Fuel,
  Gauge,
  GaugeCircle,
  Link,
  MapPin,
  MessageSquare,
  MessageSquarePlus,
  MoreVertical,
  PenSquare,
  Pencil,
  Plus,
  Receipt,
  Route,
  Trash,
  Trash2,
  Unlink,
  User,
  UserRound,
} from "lucide";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { cn } from "@/lib/utils";
import { GvMorphIcon } from "../../lib/morph-icon";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { type BitacoraInput, bitacoraInputSchema } from "../lib/zod";
import { useBitacoraFormOptions, useCrearBitacora } from "../lib/hooks";
import { type VehiculoRow } from "../../flota/lib/zod";

interface SolicitudActiva {
  id: string;
  destino: string;
  conductor_id: string;
  vehiculo_id: string;
  estado?: string;
  ter_vehiculos: { kilometraje_actual: number } | { kilometraje_actual: number }[] | null;
}

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

const selectOverflowScrollWrapClass = "min-w-0 max-w-full overflow-x-auto";

const selectOverflowTriggerClass =
  "w-max min-w-full [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:whitespace-nowrap";

const selectItemClass =
  "cursor-pointer rounded-lg bg-white focus:bg-sky-50 dark:bg-zinc-900 dark:focus:bg-zinc-800";

const comentarioRowClass =
  "rounded-xl border border-border bg-zinc-100 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950";

const comentarioPillClass =
  "inline-flex shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-celeste-trifinio dark:bg-sky-950";

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
  const user = useUser();
  const nombreResponsable =
    (user?.user_metadata?.nombre as string | undefined)?.trim() || "Tu perfil";
  const { data: options, isLoading: loading } = useBitacoraFormOptions(true);
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
      comentarios: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "comentarios",
  });

  const [editingIds, setEditingIds] = useState<Set<string>>(() => new Set());
  const prevFieldsLen = useRef(0);

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
    });
  }, [reset, user?.id]);

  useEffect(() => {
    if (selectedMisionId && misiones.length > 0) {
      const mision = misiones.find((m) => m.id === selectedMisionId);
      if (mision) {
        const kmActual = kmDeMision(mision.ter_vehiculos);
        setValue("vehiculo_id", mision.vehiculo_id, { shouldValidate: true });
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
        toast.error(res.error || "Hubo un error al guardar la bitácora");
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
    <form onSubmit={handleSubmit(onFormSubmit)} className="w-full min-w-0">
      <div className="mb-6 flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-accent dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          data-morph-hover-scope
        >
          <GvMorphIcon
            icon={ChevronLeft}
            hoverIcon={ArrowLeft}
            size={20}
            className="text-muted-foreground dark:text-zinc-400"
          />
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
          <div className={sectionTitleClass} data-morph-hover-scope>
            <GvMorphIcon icon={Link} hoverIcon={Unlink} size={16} className="text-current" />
            Vinculación de misión
          </div>
          <div className="grid min-w-0 gap-1.5 p-4">
            <FieldLabel>Misión a vincular (opcional)</FieldLabel>
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
                      className={cn(
                        formInputClass,
                        selectOverflowTriggerClass,
                        "cursor-pointer shadow-none",
                      )}
                    >
                      <SelectValue placeholder="Seleccionar misión en curso" />
                    </SelectTrigger>
                    <SelectContent position="popper" className={selectContentClass}>
                      <SelectItem value="none" className={selectItemClass}>
                        Ninguna — registro manual
                      </SelectItem>
                      {misiones.map((m) => {
                        const sufijoEstado =
                          m.estado === "FINALIZADA" ? " · finalizada" : "";
                        const label = `Misión a ${m.destino} · ${kmDeMision(m.ter_vehiculos)} km${sufijoEstado}`;
                        return (
                          <SelectItem
                            key={m.id}
                            value={m.id}
                            textValue={label}
                            className={cn(selectItemClass, "whitespace-nowrap")}
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
            {selectedMisionId ? (
              <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-500">
                Vehículo, conductor y destino se completan desde la misión seleccionada.
              </p>
            ) : (
              <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-500">
                Se listan tus misiones en curso y la última finalizada sin bitácora
                vinculada.
              </p>
            )}
          </div>
        </section>

        <section className={formSectionClass}>
          <div className={sectionTitleClass} data-morph-hover-scope>
            <GvMorphIcon icon={Car} hoverIcon={CarFront} size={16} className="text-current" />
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
                    <div className={selectOverflowScrollWrapClass}>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        disabled={!!selectedMisionId}
                      >
                        <SelectTrigger
                          className={cn(
                            formInputClass,
                            selectOverflowTriggerClass,
                            "cursor-pointer shadow-none",
                          )}
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
                                  className={cn(selectItemClass, "whitespace-nowrap")}
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
              </div>

              <div className="grid gap-1.5">
                <FieldLabel>Responsable del viaje</FieldLabel>
                <input type="hidden" {...register("conductor_id")} />
                <div
                  className={cn(
                    formInputClass,
                    "flex items-center gap-2 opacity-90",
                  )}
                >
                  <GvMorphIcon icon={User} hoverIcon={UserRound} size={16} className="text-celeste-trifinio" />
                  <span className="truncate font-semibold">{nombreResponsable}</span>
                </div>
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
          <div className={sectionTitleClass} data-morph-hover-scope>
            <GvMorphIcon icon={GaugeCircle} hoverIcon={Gauge} size={16} className="text-current" />
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
          <div className={sectionTitleClass} data-morph-hover-scope>
            <GvMorphIcon icon={Fuel} hoverIcon={Receipt} size={16} className="text-current" />
            Combustible
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
            <div className="grid gap-1.5">
              <FieldLabel className="flex items-center gap-1.5" data-morph-hover-scope>
                <GvMorphIcon icon={Receipt} hoverIcon={FileText} size={14} className="text-current" />
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

        <section className={formSectionClass}>
          <div className={sectionTitleClass} data-morph-hover-scope>
            <GvMorphIcon
              icon={MessageSquarePlus}
              hoverIcon={MessageSquare}
              size={16}
              className="text-current"
            />
            Comentarios del viaje
          </div>
          <div className="space-y-3 p-4">
            <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-500">
              Agrega observaciones del recorrido. El autor queda registrado en la bitácora como responsable del viaje.
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
                    className={comentarioRowClass}
                  >
                    <div className={cn("flex gap-2.5", isEditing ? "items-start" : "items-center")}>
                      <span className={comentarioPillClass}>Comentario {index + 1}</span>

                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <Textarea
                            {...register(`comentarios.${index}.texto`)}
                            rows={2}
                            autoFocus
                            placeholder="Escribe la observación del recorrido..."
                            className={cn(
                              formInputClass,
                              "min-h-14 resize-none py-2 shadow-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio",
                            )}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(field.id)}
                            className="w-full cursor-pointer truncate border-0 bg-transparent p-0 text-left text-sm leading-tight text-foreground hover:opacity-80"
                          >
                            {texto || (
                              <span className="text-muted-foreground dark:text-zinc-500">
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
                              className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-muted-foreground transition-colors hover:bg-zinc-200/80 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
                            className="z-[200] min-w-[10rem] rounded-xl border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900"
                          >
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 bg-white text-foreground focus:bg-sky-50 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800"
                              onSelect={() => startEdit(field.id)}
                            >
                              <GvMorphIcon icon={PenSquare} hoverIcon={Pencil} size={14} className="text-current" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 bg-white text-red-600 focus:bg-red-50 focus:text-red-600 dark:bg-zinc-900 dark:text-red-400 dark:focus:bg-red-950/60"
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
                          className="inline-flex h-7 cursor-pointer items-center rounded-lg border-0 bg-zinc-200 px-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
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
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-celeste-trifinio/50 bg-transparent text-xs font-bold uppercase tracking-widest text-celeste-trifinio transition-colors hover:bg-sky-50 dark:border-celeste-trifinio/40 dark:hover:bg-sky-950/30"
              data-morph-hover-scope
            >
              <GvMorphIcon icon={Plus} hoverIcon={CirclePlus} size={16} className="text-current" />
              Agregar comentario
            </button>
          </div>
        </section>

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
            data-morph-hover-scope
          >
            {crear.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <GvMorphIcon icon={Route} hoverIcon={MapPin} size={16} className="text-current" />
            )}
            Registrar bitácora
          </button>
        </div>
      </div>
    </form>
  );
}

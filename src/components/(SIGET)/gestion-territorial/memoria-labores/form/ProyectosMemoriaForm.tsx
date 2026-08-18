"use client";

import {
  useState,
  useTransition,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  Fragment,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  Loader2,
  Plus,
  Users,
  CalendarDays,
  TrendingUp,
  ListChecks,
  Sparkles,
  Wand2,
  Images,
} from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import {
  confirmQuitarMemoria,
  confirmQuitarProyectoMemoria,
} from "../lib/swal";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { createProyectoMemoria, updateProyectoMemoria, updateMemoriaImagenes } from "../lib/actions";
import { proyectosMemoriaSchema } from "../lib/zod";
import type {
  Beneficiarios,
  ProyectoAvance,
  ProyectoItem,
  ProyectosMemoria,
  ProyectosMemoriaInput,
} from "../lib/zod";
import {
  emptyProyectoAvance,
  emptyProyectoItem,
  emptyProyectoMemoria,
  normalizeImagenesFromDb,
  normalizeProyectosFromDb,
  rellenoPruebaMemoriaLabores,
  formatoOrdinalCortoEs,
  MAX_IMAGENES_PROYECTO,
} from "../lib/helpers";
import { useAutofillInformeUsuario } from "../lib/hooks";
import { ProyectoImagenes } from "@/components/(base)/imgs";

interface ProyectosMemoriaFormProps {
  initial?: ProyectosMemoria | null;
  onBack?: () => void;
  onSaved: () => void;
  variant?: "admin" | "public";
  onCreatePublic?: (input: ProyectosMemoriaInput) => Promise<{ success: true }>;
  onReview?: (input: ProyectosMemoriaInput) => void;
  restoreDraft?: ProyectosMemoriaInput | null;
}

type ProyectoListaKey = "resultados" | "efectos";

const listItemMotionTransition = {
  duration: 0.28,
  ease: [0.4, 0, 0.2, 1] as const,
};

const listItemMotionProps = {
  layout: true,
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8, scale: 0.99 },
  transition: listItemMotionTransition,
} as const;

const sectionTitleClass =
  "flex items-center gap-2 bg-azul-trifinio text-white px-4 py-2.5 rounded-t-xl text-sm font-bold tracking-tight";

const formSectionClass =
  "rounded-xl border border-border bg-card dark:border-zinc-700/90 dark:bg-zinc-900/90";

const formInputClass =
  "h-10 w-full rounded-lg border border-border bg-zinc-50 px-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/70 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:[color-scheme:dark]";

const formTextareaClass =
  "w-full rounded-lg border border-border bg-zinc-50 px-3 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/70 resize-none overflow-hidden dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500";

const formLabelClass =
  "text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300";

const sectionAddButtonBase =
  "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors hover:no-underline cursor-pointer";

const sectionTitleColor = {
  avance: "text-amber-600 dark:text-amber-400",
  resultado: "text-violet-600 dark:text-violet-400",
  efecto: "text-emerald-600 dark:text-emerald-400",
  proyecto: "text-azul-trifinio dark:text-azul-trifinio/90",
  beneficiarios: "text-sky-600 dark:text-sky-400",
} as const;

const sectionAddButtonStyle = {
  avance:
    "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-900",
  resultado:
    "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:hover:bg-violet-900",
  efecto:
    "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900",
  proyecto:
    "bg-sky-100 text-azul-trifinio hover:bg-sky-200 dark:bg-sky-950 dark:text-azul-trifinio dark:hover:bg-sky-900",
  beneficiarios:
    "bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-950 dark:text-sky-400 dark:hover:bg-sky-900",
} as const;

type ProyectoSeccionKey = keyof typeof sectionTitleColor;

const sectionBorderStyles: Record<ProyectoSeccionKey, string> = {
  avance: "border-2 border-amber-500 dark:border-amber-400",
  resultado: "border-2 border-violet-500 dark:border-violet-400",
  efecto: "border-2 border-emerald-500 dark:border-emerald-400",
  beneficiarios: "border-2 border-celeste-trifinio",
  proyecto: "border-2 border-azul-trifinio",
};

const sectionInputFocus: Record<ProyectoSeccionKey, string> = {
  proyecto:
    "focus-visible:ring-2 focus-visible:ring-azul-trifinio focus-visible:border-azul-trifinio",
  avance:
    "focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:border-amber-500 dark:focus-visible:ring-amber-400 dark:focus-visible:border-amber-400",
  resultado:
    "focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:border-violet-500 dark:focus-visible:ring-violet-400 dark:focus-visible:border-violet-400",
  efecto:
    "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 dark:focus-visible:ring-emerald-400 dark:focus-visible:border-emerald-400",
  beneficiarios:
    "focus-visible:ring-2 focus-visible:ring-celeste-trifinio focus-visible:border-celeste-trifinio",
};

const proyectoSeccionShell = "rounded-xl bg-card p-4 dark:bg-zinc-900/80";

const proyectoSeccionShellCompact = proyectoSeccionShell;

const formSectionBodyClass = (isPublic: boolean) =>
  isPublic ? "px-0 py-4 sm:p-4" : "p-4";

const proyectosListBodyClass = "flex flex-col gap-4";

const proyectoCardClass = (isPublic: boolean) =>
  cn(
    "overflow-hidden rounded-xl border border-border bg-muted/20 dark:border-zinc-700 dark:bg-zinc-950/50",
    isPublic && "shadow-sm",
  );

const nestedItemShellClass =
  "space-y-3 rounded-lg border border-border/80 bg-muted/30 p-3 dark:border-zinc-800 dark:bg-zinc-950/60";

function confirmQuitar(onConfirm: () => void) {
  void confirmQuitarMemoria({}).then((result) => {
    if (result.isConfirmed) onConfirm();
  });
}

function ProyectoRemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        void confirmQuitarProyectoMemoria().then((result) => {
          if (result.isConfirmed) onClick();
        });
      }}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-red-100 px-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-200 hover:no-underline cursor-pointer dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
    >
      Quitar Proyecto
    </button>
  );
}

function SectionRemoveButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => confirmQuitar(onClick)}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-lg bg-red-100 px-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-200 hover:no-underline cursor-pointer dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900",
        className,
      )}
    >
      Quitar
    </button>
  );
}

const Field = ({
  className,
  value,
  onChange,
  rows = 2,
  seccion = "proyecto",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  seccion?: ProyectoSeccionKey;
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useLayoutEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <textarea
      ref={ref}
      rows={rows}
      value={value}
      onChange={(e) => {
        onChange?.(e);
        requestAnimationFrame(resize);
      }}
      className={cn(formTextareaClass, sectionInputFocus[seccion], className)}
      {...props}
    />
  );
};

const TextInput = ({
  className,
  seccion = "proyecto",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  seccion?: ProyectoSeccionKey;
}) => (
  <input
    {...props}
    className={cn(formInputClass, sectionInputFocus[seccion], className)}
  />
);

const Label = ({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label {...props} className={cn(formLabelClass, className)} />
);

function formatHintText(hint: string): string {
  const trimmed = hint.trim();
  if (!trimmed) return trimmed;
  const withColons = trimmed.replace(
    /:\s*([a-záéíóúüñ])/gi,
    (_, letter: string) => `: ${letter.toUpperCase()}`,
  );
  const capitalized = withColons.charAt(0).toUpperCase() + withColons.slice(1);
  return capitalized.endsWith(".") ? capitalized : `${capitalized}.`;
}

function FieldLabelWithHint({
  htmlFor,
  label,
  hint,
  className,
}: {
  htmlFor?: string;
  label: string;
  hint: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        formLabelClass,
        "block text-[11px] leading-snug normal-case tracking-normal",
        className,
      )}
    >
      <span className="uppercase tracking-wider">{label}</span>
      {": "}
      <span className="font-normal text-muted-foreground dark:text-zinc-500">
        {formatHintText(hint)}
      </span>
    </label>
  );
}

function textoDependenciaJerarquica(oficina?: string, cargo?: string): string {
  return [oficina, cargo]
    .filter((s) => s?.trim())
    .map((s) => s!.trim().replace(/\s*\/\s*/g, " · "))
    .join(" · ");
}

function DatoSoloLectura({
  label,
  value,
  loading = false,
  className,
}: {
  label: string;
  value: string;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5 min-w-0", className)}>
      <Label>{label}</Label>
      <p
        className={cn(
          "min-h-10 rounded-lg border border-border/60 bg-zinc-50/40 px-3 py-2.5 text-sm font-semibold leading-snug text-foreground dark:border-zinc-700/60 dark:bg-zinc-950/40 dark:text-zinc-100",
          "lg:text-base lg:whitespace-nowrap lg:overflow-x-auto",
          loading && "text-muted-foreground animate-pulse",
        )}
      >
        {loading ? "Cargando…" : value.trim() || "—"}
      </p>
    </div>
  );
}

const FieldHint = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p
    className={cn(
      "text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-500",
      className,
    )}
  >
    {children}
  </p>
);

const NumericInput = ({
  className,
  value,
  onValueChange,
  seccion = "avance",
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: number;
  onValueChange: (value: number) => void;
  seccion?: ProyectoSeccionKey;
}) => (
  <input
    {...props}
    type="tel"
    inputMode="numeric"
    pattern="[0-9]*"
    autoComplete="off"
    value={value === 0 ? "" : String(value)}
    onChange={(e) => {
      const digits = e.target.value.replace(/\D/g, "");
      onValueChange(digits === "" ? 0 : parseInt(digits, 10));
    }}
    className={cn(
      formInputClass,
      sectionInputFocus[seccion],
      "h-9 max-w-[4.75rem] px-2 text-center text-sm",
      className,
    )}
  />
);

function ListaItemDosLineas({
  index,
  label,
  children,
}: {
  index: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-9 min-w-[2.5rem] shrink-0 items-center justify-center rounded-lg bg-muted/60 px-1 text-xs font-black text-muted-foreground dark:bg-zinc-800 dark:text-zinc-300">
          {formatoOrdinalCortoEs(index)}
        </span>
        <Label className="text-right normal-case tracking-normal text-[10px]">
          {label}
        </Label>
      </div>
      <div className="min-w-0 w-full">{children}</div>
    </div>
  );
}

function ProyectoSubseccion({
  seccion,
  title,
  icon,
  hint,
  children,
  compact = false,
  flush = false,
}: {
  seccion: ProyectoSeccionKey;
  title: string;
  icon: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  compact?: boolean;
  flush?: boolean;
}) {
  return (
    <div
      className={cn(
        flush
          ? "bg-card p-4 dark:bg-zinc-900/80"
          : compact
            ? proyectoSeccionShellCompact
            : proyectoSeccionShell,
        sectionBorderStyles[seccion],
        flush && "rounded-none border-x-0",
      )}
    >
      <p
        className={cn(
          "border-b border-border text-sm leading-snug dark:border-zinc-700",
          compact ? "mb-3 pb-2 sm:mb-4 sm:pb-3" : "mb-4 pb-3",
          sectionTitleColor[seccion],
        )}
      >
        <span className="inline-flex items-center gap-2 font-bold">
          {icon}
          {title}
          {hint ? ":" : ""}
        </span>
        {hint ? (
          <span className="font-normal opacity-90">
            {" "}
            {typeof hint === "string" ? formatHintText(hint) : hint}
          </span>
        ) : null}
      </p>
      <div className={cn("space-y-3", compact && "space-y-0 sm:space-y-3")}>
        {children}
      </div>
    </div>
  );
}

function SectionAddButton({
  label,
  color,
  onClick,
  className,
}: {
  label: string;
  color: ProyectoSeccionKey;
  onClick: () => void;
  className?: string;
}) {
  return (
    <div className={cn("pt-3", className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn(sectionAddButtonBase, sectionAddButtonStyle[color])}
      >
        <Plus className="w-4 h-4" />
        {label}
      </button>
    </div>
  );
}

export default function ProyectosMemoriaForm({
  initial = null,
  onBack,
  onSaved,
  variant = "admin",
  onCreatePublic,
  onReview,
  restoreDraft = null,
}: ProyectosMemoriaFormProps) {
  const [form, setForm] = useState<ProyectosMemoriaInput>(() => {
    if (restoreDraft) return restoreDraft;
    if (!initial) return emptyProyectoMemoria();
    const normalizados = normalizeProyectosFromDb(initial.proyectos);
    const proyectos = normalizados.length
      ? normalizados
      : [emptyProyectoItem()];
    return {
      proyectos,
      imagenes: normalizeImagenesFromDb(initial.imagenes, proyectos.length),
    };
  });
  const draftIdRef = useRef<string | null>(null);
  const imagenesRef = useRef<string[][]>(form.imagenes ?? []);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    imagenesRef.current = form.imagenes ?? [];
  }, [form.imagenes]);
  const { effectiveRole } = useUserContext();
  const isSuper = effectiveRole === "super";

  const isPublic = variant === "public";
  const isEdit = Boolean(initial) && !isPublic;

  const puedeAutocompletar = !isEdit && !restoreDraft;
  const { data: autofillUsuario, isLoading: autofillLoading } =
    useAutofillInformeUsuario(puedeAutocompletar);

  const informanteNombre =
    (isEdit ? initial?.nombre : autofillUsuario?.nombre) ?? "";
  const informanteOficina =
    (isEdit ? initial?.oficina : autofillUsuario?.oficina) ?? "";
  const informanteCargo =
    (isEdit ? initial?.cargo : autofillUsuario?.cargo) ?? "";
  const informanteLoading = puedeAutocompletar && autofillLoading;

  const updateProyecto = (
    index: number,
    field: "nombre" | "mes" | "descripcion",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      proyectos: prev.proyectos.map((p, i) =>
        i === index ? { ...p, [field]: value } : p,
      ),
    }));
  };

  const updateProyectoLista = (
    proyectoIndex: number,
    key: ProyectoListaKey,
    listaIndex: number,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      proyectos: prev.proyectos.map((p, i) =>
        i === proyectoIndex
          ? {
              ...p,
              [key]: p[key].map((v, j) => (j === listaIndex ? value : v)),
            }
          : p,
      ),
    }));
  };

  const addProyectoListaItem = (
    proyectoIndex: number,
    key: ProyectoListaKey,
  ) => {
    setForm((prev) => ({
      ...prev,
      proyectos: prev.proyectos.map((p, i) =>
        i === proyectoIndex ? { ...p, [key]: [...p[key], ""] } : p,
      ),
    }));
  };

  const removeProyectoListaItem = (
    proyectoIndex: number,
    key: ProyectoListaKey,
    listaIndex: number,
  ) => {
    setForm((prev) => ({
      ...prev,
      proyectos: prev.proyectos.map((p, i) =>
        i === proyectoIndex
          ? {
              ...p,
              [key]:
                p[key].length > 1
                  ? p[key].filter((_, j) => j !== listaIndex)
                  : p[key],
            }
          : p,
      ),
    }));
  };

  const updateProyectoAvance = (
    proyectoIndex: number,
    avanceIndex: number,
    field: keyof ProyectoAvance,
    value: string | number,
  ) => {
    setForm((prev) => ({
      ...prev,
      proyectos: prev.proyectos.map((p, i) =>
        i === proyectoIndex
          ? {
              ...p,
              avances: p.avances.map((a, j) =>
                j === avanceIndex
                  ? {
                      ...a,
                      [field]:
                        field === "descripcion"
                          ? String(value)
                          : field === "meta"
                            ? Math.max(
                                0,
                                parseInt(String(value || "0"), 10) || 0,
                              )
                            : Math.max(
                                0,
                                parseInt(String(value || "0"), 10) || 0,
                              ),
                    }
                  : a,
              ),
            }
          : p,
      ),
    }));
  };

  const addProyectoAvance = (proyectoIndex: number) => {
    setForm((prev) => ({
      ...prev,
      proyectos: prev.proyectos.map((p, i) =>
        i === proyectoIndex
          ? { ...p, avances: [...p.avances, emptyProyectoAvance()] }
          : p,
      ),
    }));
  };

  const removeProyectoAvance = (proyectoIndex: number, avanceIndex: number) => {
    setForm((prev) => ({
      ...prev,
      proyectos: prev.proyectos.map((p, i) =>
        i === proyectoIndex
          ? {
              ...p,
              avances:
                p.avances.length > 1
                  ? p.avances.filter((_, j) => j !== avanceIndex)
                  : p.avances,
            }
          : p,
      ),
    }));
  };

  const addProyecto = () => {
    setForm((prev) => ({
      ...prev,
      proyectos: [...prev.proyectos, emptyProyectoItem()],
      imagenes: [...(prev.imagenes ?? []), []],
    }));
  };

  const removeProyecto = (index: number) => {
    setForm((prev) => {
      if (prev.proyectos.length <= 1) return prev;
      return {
        ...prev,
        proyectos: prev.proyectos.filter((_, i) => i !== index),
        imagenes: (prev.imagenes ?? []).filter((_, i) => i !== index),
      };
    });
  };

  const persistImagenes = async (nextImagenes: string[][]) => {
    const memoriaId = initial?.id ?? draftIdRef.current;
    if (memoriaId) {
      await updateMemoriaImagenes(memoriaId, nextImagenes);
      return;
    }

    const attempt = { ...form, imagenes: nextImagenes };
    const parsed = proyectosMemoriaSchema.safeParse(attempt);
    if (!parsed.success) return;

    const created = await createProyectoMemoria(parsed.data);
    draftIdRef.current = created.id;
  };

  const commitImagenes = async (
    nextImagenes: string[][],
    previousImagenes: string[][],
    fallbackMessage: string,
  ) => {
    imagenesRef.current = nextImagenes;
    setForm((prev) => ({ ...prev, imagenes: nextImagenes }));
    try {
      await persistImagenes(nextImagenes);
    } catch (err) {
      imagenesRef.current = previousImagenes;
      setForm((prev) => ({ ...prev, imagenes: previousImagenes }));
      toast.error(err instanceof Error ? err.message : fallbackMessage);
      throw err;
    }
  };

  const addProyectoImagen = async (proyectoIndex: number, path: string) => {
    if (proyectoIndex < 0 || proyectoIndex >= form.proyectos.length) return;

    const previous = imagenesRef.current;
    const next = previous.map((g) => [...g]);
    while (next.length < form.proyectos.length) next.push([]);

    const grupo = next[proyectoIndex] ?? [];
    if (grupo.includes(path) || grupo.length >= MAX_IMAGENES_PROYECTO) return;
    next[proyectoIndex] = [...grupo, path];

    await commitImagenes(next, previous, "No se pudo vincular la imagen al informe.");
  };

  const removeProyectoImagen = async (proyectoIndex: number, path: string) => {
    if (proyectoIndex < 0 || proyectoIndex >= form.proyectos.length) return;

    const previous = imagenesRef.current;
    const next = previous.map((g) => [...g]);
    while (next.length < form.proyectos.length) next.push([]);
    next[proyectoIndex] = (next[proyectoIndex] ?? []).filter((p) => p !== path);

    await commitImagenes(
      next,
      previous,
      "No se pudo actualizar las imágenes del informe.",
    );
  };

  const replaceProyectoImagen = async (
    proyectoIndex: number,
    oldPath: string,
    newPath: string,
  ) => {
    if (proyectoIndex < 0 || proyectoIndex >= form.proyectos.length) return;

    const previous = imagenesRef.current;
    const next = previous.map((g) => [...g]);
    while (next.length < form.proyectos.length) next.push([]);

    const grupo = next[proyectoIndex] ?? [];
    const idx = grupo.indexOf(oldPath);
    if (idx >= 0) {
      grupo[idx] = newPath;
    } else if (grupo.length < MAX_IMAGENES_PROYECTO) {
      grupo.push(newPath);
    } else {
      return;
    }
    next[proyectoIndex] = grupo;

    await commitImagenes(
      next,
      previous,
      "No se pudo actualizar la imagen del informe.",
    );
  };

  const updateProyectoBeneficiario = (
    proyectoIndex: number,
    grupo: keyof Beneficiarios,
    campo: keyof Beneficiarios["directos"],
    value: number,
  ) => {
    setForm((prev) => ({
      ...prev,
      proyectos: prev.proyectos.map((p, i) =>
        i === proyectoIndex
          ? {
              ...p,
              beneficiarios: {
                ...p.beneficiarios,
                [grupo]: {
                  ...p.beneficiarios[grupo],
                  [campo]: Number.isFinite(value) && value >= 0 ? value : 0,
                },
              },
            }
          : p,
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = proyectosMemoriaSchema.safeParse(form);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const path = issue?.path?.join(".");
      toast.warn(
        `${path ? `${path}: ` : ""}${issue?.message ?? "Datos inválidos."}`,
      );
      return;
    }

    const data = parsed.data;

    if (isPublic && onReview) {
      onReview(data);
      return;
    }

    startTransition(async () => {
      try {
        if (isPublic) {
          if (!onCreatePublic)
            throw new Error("Acción de envío no configurada.");
          await onCreatePublic(data);
        } else if (isEdit && initial) {
          await updateProyectoMemoria(initial.id, data);
        } else if (draftIdRef.current) {
          await updateProyectoMemoria(draftIdRef.current, data);
        } else {
          await createProyectoMemoria(data);
        }
        toast.success(
          isPublic
            ? "Informe enviado."
            : isEdit
              ? "Memoria actualizada."
              : "Avances registrados.",
        );
        if (isPublic) setForm(emptyProyectoMemoria());
        onSaved();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "No se pudo guardar.",
        );
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {!isPublic && (
        <div className="flex items-start gap-3 mb-6">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-card border border-border hover:bg-accent transition-colors cursor-pointer dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground dark:text-zinc-400" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-black tracking-tight text-foreground dark:text-zinc-50 leading-tight">
              {isEdit
                ? "Editar informe"
                : "Nuevo informe de memoria de labores"}
            </h2>
            <p className="text-sm text-muted-foreground dark:text-zinc-400">
              Formulario de solicitud de información — Plan Trifinio
            </p>
          </div>
        </div>
      )}

      <div className={cn("space-y-6", isPublic && "space-y-4 sm:space-y-6")}>
        {!isPublic && isSuper && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() =>
                setForm((prev) => rellenoPruebaMemoriaLabores(prev))
              }
              className={cn(
                sectionAddButtonBase,
                sectionAddButtonStyle.avance,
                "px-4",
              )}
            >
              <Wand2 className="h-4 w-4 shrink-0" />
              Autorelleno de prueba
            </button>
          </div>
        )}
        <section
          className={cn(formSectionClass, isPublic && "rounded-xl shadow-sm")}
        >
          <div className={sectionTitleClass}>
            <CalendarDays className="w-4 h-4" />
            Quien reporta
          </div>
          <div
            className={cn(
              formSectionBodyClass(isPublic),
              "grid grid-cols-1 lg:grid-cols-[1fr_4fr] gap-3 sm:gap-4",
            )}
          >
            <DatoSoloLectura
              label="Nombre"
              value={informanteNombre}
              loading={informanteLoading}
            />
            <DatoSoloLectura
              label="Dependencia jerárquica"
              value={textoDependenciaJerarquica(informanteOficina, informanteCargo)}
              loading={informanteLoading}
            />
          </div>
        </section>

        <ProyectosEjecutadosSection
          items={form.proyectos}
          imagenes={form.imagenes ?? []}
          onChange={updateProyecto}
          onBeneficiarioChange={updateProyectoBeneficiario}
          onAvanceChange={updateProyectoAvance}
          onAvanceAdd={addProyectoAvance}
          onAvanceRemove={removeProyectoAvance}
          onListaChange={updateProyectoLista}
          onListaAdd={addProyectoListaItem}
          onListaRemove={removeProyectoListaItem}
          onAdd={addProyecto}
          onRemove={removeProyecto}
          onImagenAdd={addProyectoImagen}
          onImagenRemove={removeProyectoImagen}
          onImagenReplace={replaceProyectoImagen}
          sectionTitleClass={sectionTitleClass}
          isPublic={isPublic}
          isEdit={isEdit}
          isPending={isPending}
          onBack={onBack}
          onReview={onReview}
        />
      </div>
    </form>
  );
}

function ProyectosEjecutadosSection({
  items,
  imagenes,
  onChange,
  onBeneficiarioChange,
  onAvanceChange,
  onAvanceAdd,
  onAvanceRemove,
  onListaChange,
  onListaAdd,
  onListaRemove,
  onAdd,
  onRemove,
  onImagenAdd,
  onImagenRemove,
  onImagenReplace,
  sectionTitleClass,
  isPublic,
  isEdit,
  isPending,
  onBack,
  onReview,
}: {
  items: ProyectoItem[];
  imagenes: string[][];
  onChange: (
    index: number,
    field: "nombre" | "mes" | "descripcion",
    value: string,
  ) => void;
  onBeneficiarioChange: (
    proyectoIndex: number,
    grupo: keyof Beneficiarios,
    campo: keyof Beneficiarios["directos"],
    value: number,
  ) => void;
  onAvanceChange: (
    proyectoIndex: number,
    avanceIndex: number,
    field: keyof ProyectoAvance,
    value: string | number,
  ) => void;
  onAvanceAdd: (proyectoIndex: number) => void;
  onAvanceRemove: (proyectoIndex: number, avanceIndex: number) => void;
  onListaChange: (
    proyectoIndex: number,
    key: ProyectoListaKey,
    listaIndex: number,
    value: string,
  ) => void;
  onListaAdd: (proyectoIndex: number, key: ProyectoListaKey) => void;
  onListaRemove: (
    proyectoIndex: number,
    key: ProyectoListaKey,
    listaIndex: number,
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onImagenAdd: (proyectoIndex: number, path: string) => void;
  onImagenRemove: (proyectoIndex: number, path: string) => void;
  onImagenReplace: (
    proyectoIndex: number,
    oldPath: string,
    newPath: string,
  ) => void;
  sectionTitleClass: string;
  isPublic: boolean;
  isEdit: boolean;
  isPending: boolean;
  onBack?: () => void;
  onReview?: (input: ProyectosMemoriaInput) => void;
}) {
  return (
    <section
      className={cn(formSectionClass, isPublic && "rounded-xl shadow-sm")}
    >
      <div className={sectionTitleClass}>
        <ListChecks className="w-4 h-4 shrink-0" />
        <span>
          <span className="font-bold">Proyectos ejecutados por mes:</span>{" "}
          <span className="font-normal text-white/90">
            Agregue un bloque por cada proyecto del período con mes,
            descripción, avances, resultados y efectos.
          </span>
        </span>
      </div>
      <div className={proyectosListBodyClass}>
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((item, i) => (
            <motion.div
              key={i}
              {...listItemMotionProps}
              className={proyectoCardClass(isPublic)}
            >
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  {items.length > 1 && (
                    <div className="flex justify-end">
                      <ProyectoRemoveButton onClick={() => onRemove(i)} />
                    </div>
                  )}
                  <span
                    className={cn(
                      "block text-sm font-black leading-snug break-words",
                      sectionTitleColor.proyecto,
                    )}
                  >
                    {item.nombre.trim() || `Proyecto ${i + 1}`}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0 grid gap-1.5">
                      <FieldLabelWithHint
                        htmlFor={`proyecto-nombre-${i}`}
                        label="Nombre del proyecto"
                        hint="título o nombre con el que se identifica este proyecto dentro del informe"
                      />
                      <TextInput
                        id={`proyecto-nombre-${i}`}
                        seccion="proyecto"
                        value={item.nombre}
                        onChange={(e) => onChange(i, "nombre", e.target.value)}
                        placeholder="ej. Fortalecimiento comunitario en la frontera"
                      />
                    </div>
                    <div className="w-full sm:w-44 shrink-0 grid gap-1.5">
                      <Label htmlFor={`proyecto-mes-${i}`}>
                        Mes de ejecución
                      </Label>
                      <TextInput
                        id={`proyecto-mes-${i}`}
                        type="month"
                        seccion="proyecto"
                        value={item.mes}
                        onChange={(e) => onChange(i, "mes", e.target.value)}
                        className="min-w-0"
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <FieldLabelWithHint
                      label="Descripción del proyecto"
                      hint="resumen de qué consistió el proyecto y las actividades realizadas en ese mes"
                    />
                    <Field
                      rows={2}
                      seccion="proyecto"
                      value={item.descripcion}
                      onChange={(e) =>
                        onChange(i, "descripcion", e.target.value)
                      }
                      placeholder="Descripción del proyecto"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <ProyectoAvancesLista
                  items={item.avances}
                  compact={isPublic}
                  flush
                  onChange={(j, field, value) =>
                    onAvanceChange(i, j, field, value)
                  }
                  onAdd={() => onAvanceAdd(i)}
                  onRemove={(j) => onAvanceRemove(i, j)}
                />

                <ProyectoListaInterna
                  titulo="Principales resultados del período"
                  ayuda="logros concretos obtenidos con este proyecto durante el período reportado."
                  icon={<ListChecks className="w-3.5 h-3.5" />}
                  items={item.resultados}
                  placeholder="Descripción por proyecto"
                  addLabel="Agregar resultado"
                  addColor="resultado"
                  itemLabel="Descripción del resultado"
                  flush
                  compact={isPublic}
                  onChange={(j, v) => onListaChange(i, "resultados", j, v)}
                  onAdd={() => onListaAdd(i, "resultados")}
                  onRemove={(j) => onListaRemove(i, "resultados", j)}
                />

                <ProyectoListaInterna
                  titulo="Efectos alcanzados"
                  ayuda="cambios o impactos en comunidad: expansión de teoría, aplicación práctica o réplica de lo aprendido."
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  items={item.efectos}
                  compact={isPublic}
                  placeholder="Descripción de expansión de teoría / aplicación y réplica en comunidad"
                  addLabel="Agregar efecto alcanzado"
                  addColor="efecto"
                  itemLabel="Descripción del efecto"
                  flush
                  onChange={(j, v) => onListaChange(i, "efectos", j, v)}
                  onAdd={() => onListaAdd(i, "efectos")}
                  onRemove={(j) => onListaRemove(i, "efectos", j)}
                />

                <ProyectoBeneficiariosFields
                  proyectoIndex={i}
                  beneficiarios={item.beneficiarios}
                  compact={isPublic}
                  flush
                  onChange={onBeneficiarioChange}
                />

                <ProyectoImagenesFields
                  proyectoIndex={i}
                  paths={imagenes[i] ?? []}
                  disabled={isPending}
                  onAdd={onImagenAdd}
                  onRemove={onImagenRemove}
                  onReplace={onImagenReplace}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <SectionAddButton
          label="Agregar proyecto"
          color="proyecto"
          onClick={onAdd}
          className="px-4"
        />

        <div className="mt-2 flex flex-col-reverse items-stretch gap-3 border-t border-border pt-6 pb-8 dark:border-zinc-700 sm:flex-row sm:items-center sm:justify-center">
          {!isPublic && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-11 items-center justify-center rounded-xl border-0 bg-zinc-200 px-6 text-[10px] font-bold uppercase tracking-widest text-zinc-700 transition-colors hover:bg-zinc-300 cursor-pointer dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-0 bg-emerald-200 px-6 text-[10px] font-bold uppercase tracking-widest text-emerald-900 transition-colors hover:bg-emerald-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer dark:bg-emerald-800/70 dark:text-emerald-50 dark:hover:bg-emerald-700/80"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isPublic && onReview
              ? "Revisar informe"
              : isPublic
                ? "Enviar informe"
                : isEdit
                  ? "Guardar cambios"
                  : "Registrar avances"}
          </button>
        </div>
      </div>
    </section>
  );
}

function ProyectoBeneficiariosFields({
  proyectoIndex,
  beneficiarios,
  onChange,
  compact = false,
  flush = false,
}: {
  proyectoIndex: number;
  beneficiarios: Beneficiarios;
  onChange: (
    proyectoIndex: number,
    grupo: keyof Beneficiarios,
    campo: keyof Beneficiarios["directos"],
    value: number,
  ) => void;
  compact?: boolean;
  flush?: boolean;
}) {
  const grupos = [
    { key: "directos" as const, titulo: "Beneficiarios directos" },
    { key: "indirectos" as const, titulo: "Beneficiarios indirectos" },
  ];

  return (
    <ProyectoSubseccion
      seccion="beneficiarios"
      title="Beneficiarios alcanzados"
      icon={<Users className="w-3.5 h-3.5" />}
      hint="personas alcanzadas por este proyecto. Directos: participaron de forma activa. Indirectos: se beneficiaron sin participación directa."
      compact={compact}
      flush={flush}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
        {grupos.map((grupo) => (
          <div
            key={grupo.key}
            className={cn("min-w-0 flex-1", nestedItemShellClass)}
          >
            <p
              className={cn(
                "mb-2 text-center text-[10px] font-bold uppercase tracking-widest",
                sectionTitleColor.beneficiarios,
              )}
            >
              {grupo.titulo}
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {(["hombres", "mujeres", "jovenes"] as const).map((campo) => (
                <div
                  key={campo}
                  className="grid min-w-0 justify-items-center gap-1.5"
                >
                  <Label
                    className="text-center normal-case tracking-normal text-[10px]"
                    htmlFor={`p${proyectoIndex}-${grupo.key}-${campo}`}
                  >
                    {campo === "jovenes" ? "Jóvenes" : campo}
                  </Label>
                  <NumericInput
                    id={`p${proyectoIndex}-${grupo.key}-${campo}`}
                    seccion="beneficiarios"
                    value={beneficiarios[grupo.key][campo]}
                    onValueChange={(n) =>
                      onChange(proyectoIndex, grupo.key, campo, n)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ProyectoSubseccion>
  );
}

function ProyectoImagenesFields({
  proyectoIndex,
  paths,
  disabled,
  onAdd,
  onRemove,
  onReplace,
}: {
  proyectoIndex: number;
  paths: string[];
  disabled?: boolean;
  onAdd: (proyectoIndex: number, path: string) => void;
  onRemove: (proyectoIndex: number, path: string) => void;
  onReplace: (proyectoIndex: number, oldPath: string, newPath: string) => void;
}) {
  return (
    <ProyectoSubseccion
      seccion="proyecto"
      title="Imágenes del proyecto"
      icon={<Images className="w-3.5 h-3.5" />}
      hint="hasta 4 fotografías del proyecto; puede elegir varias a la vez en la galería. Use el lápiz para recortar una. En el teléfono puede tomar la foto con la cámara."
      flush
    >
      <ProyectoImagenes
        paths={paths}
        disabled={disabled}
        onAdd={(path) => onAdd(proyectoIndex, path)}
        onRemove={(path) => onRemove(proyectoIndex, path)}
        onReplace={(oldPath, newPath) =>
          onReplace(proyectoIndex, oldPath, newPath)
        }
      />
    </ProyectoSubseccion>
  );
}

function ProyectoAvancesLista({
  items,
  onChange,
  onAdd,
  onRemove,
  compact = false,
  flush = false,
}: {
  items: ProyectoAvance[];
  onChange: (
    index: number,
    field: keyof ProyectoAvance,
    value: string | number,
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  compact?: boolean;
  flush?: boolean;
}) {
  return (
    <ProyectoSubseccion
      seccion="avance"
      title="Avances por proyecto"
      icon={<TrendingUp className="w-3.5 h-3.5" />}
      hint="indicadores medibles del avance. Usted define la escala: puede ser 7 de 10, 15 de 20, 80 de 100, etc"
      compact={compact}
      flush={flush}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((avance, j) => (
          <motion.div
            key={j}
            {...listItemMotionProps}
            className={nestedItemShellClass}
          >
            <ListaItemDosLineas index={j + 1} label="Descripción del indicador">
              <Field
                rows={2}
                seccion="avance"
                value={avance.descripcion}
                onChange={(e) => onChange(j, "descripcion", e.target.value)}
                placeholder="ej. Talleres de capacitación realizados"
                className="w-full min-h-10"
              />
            </ListaItemDosLineas>
            <div className="flex items-end justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-end justify-start gap-3">
                <div className="grid justify-items-center gap-1.5">
                  <Label className="text-center normal-case tracking-normal text-[10px]">
                    Logrado
                  </Label>
                  <NumericInput
                    seccion="avance"
                    value={avance.logrado}
                    onValueChange={(n) => onChange(j, "logrado", n)}
                    placeholder="7"
                    className="w-[3.25rem]"
                  />
                </div>
                <span className="pb-2 text-center text-base font-black text-muted-foreground dark:text-zinc-500">
                  /
                </span>
                <div className="grid justify-items-center gap-1.5">
                  <Label className="text-center normal-case tracking-normal text-[10px]">
                    Meta
                  </Label>
                  <NumericInput
                    seccion="avance"
                    value={avance.meta}
                    onValueChange={(n) => onChange(j, "meta", n)}
                    placeholder="10"
                    className="w-[3.25rem]"
                  />
                </div>
                <div className="grid justify-items-center gap-1.5">
                  <Label className="text-center normal-case tracking-normal text-[10px]">
                    KPI
                  </Label>
                  <div className="flex h-9 w-[3.25rem] items-center justify-center rounded-lg bg-amber-100 px-1 text-xs font-black text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                    {avance.meta > 0
                      ? `${Math.min(100, Math.round((avance.logrado / avance.meta) * 100))}%`
                      : "—"}
                  </div>
                </div>
              </div>
              <SectionRemoveButton
                onClick={() => onRemove(j)}
                className="shrink-0 self-end pb-0.5"
              />
            </div>
            <FieldHint className="hidden text-[10px] leading-snug sm:block sm:text-right">
              <span className="font-semibold text-foreground/70 dark:text-zinc-400">
                Logrado:
              </span>{" "}
              Cantidad alcanzada ·{" "}
              <span className="font-semibold text-foreground/70 dark:text-zinc-400">
                Meta:
              </span>{" "}
              Objetivo planificado (cualquier escala).
            </FieldHint>
          </motion.div>
        ))}
      </AnimatePresence>
      <SectionAddButton
        label="Agregar avance por proyecto"
        color="avance"
        onClick={onAdd}
      />
    </ProyectoSubseccion>
  );
}

function ProyectoListaInterna({
  titulo,
  ayuda,
  icon,
  items,
  placeholder,
  addLabel,
  addColor,
  itemLabel,
  onChange,
  onAdd,
  onRemove,
  compact = false,
  flush = false,
}: {
  titulo: string;
  ayuda?: string;
  icon: React.ReactNode;
  items: string[];
  placeholder: string;
  addLabel: string;
  addColor: Exclude<ProyectoSeccionKey, "proyecto" | "beneficiarios">;
  itemLabel: string;
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  compact?: boolean;
  flush?: boolean;
}) {
  return (
    <ProyectoSubseccion
      seccion={addColor}
      title={titulo}
      icon={icon}
      hint={ayuda}
      compact={compact}
      flush={flush}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((value, j) => (
          <motion.div
            key={j}
            {...listItemMotionProps}
            className={nestedItemShellClass}
          >
            <ListaItemDosLineas index={j + 1} label={itemLabel}>
              <Field
                rows={2}
                seccion={addColor}
                value={value}
                onChange={(e) => onChange(j, e.target.value)}
                placeholder={placeholder}
                className="w-full"
              />
            </ListaItemDosLineas>
            <div className="flex justify-end">
              <SectionRemoveButton
                onClick={() => onRemove(j)}
                className="pb-0.5"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <SectionAddButton label={addLabel} color={addColor} onClick={onAdd} />
    </ProyectoSubseccion>
  );
}

"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Trash,
  Trash2,
  Upload,
} from "lucide";
import { ExternalLink, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  ModalField,
  ModalInput,
  ModalLabel,
  modalFieldClass,
  toast,
} from "@/components/ui/general-modal";
import {
  SigetActionButton,
  SigetActionIcon,
  sigetAccent,
  sigetBtnSurface,
} from "@/components/ui/siget-action-button";
import { RippleButton } from "@/components/ui/ripple-button";
import { cn } from "@/lib/utils";
import {
  anexoEtiquetaTipo,
  esEnlaceValido,
  MINUTA_ANEXOS_BUCKET,
  normalizarEnlace,
  nuevoAnexoId,
  type MinutaAnexo,
} from "../lib/minuta";

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_IMAGEN_BYTES = 400 * 1024;

const ANEXO_ICONO = {
  imagen: ImageIcon,
  pdf: FileText,
  enlace: LinkIcon,
} as const;

async function comprimirImagen(file: File): Promise<File> {
  const { default: imageCompression } = await import(
    "browser-image-compression"
  );

  for (const maxDim of [1600, 1280, 1024, 800]) {
    const comprimida = await imageCompression(file, {
      maxSizeMB: MAX_IMAGEN_BYTES / (1024 * 1024),
      maxWidthOrHeight: maxDim,
      useWebWorker: true,
      fileType: "image/jpeg",
      initialQuality: 0.82,
    });
    if (comprimida.size <= MAX_IMAGEN_BYTES) {
      return new File([comprimida], file.name.replace(/\.\w+$/, ".jpg"), {
        type: "image/jpeg",
      });
    }
  }

  throw new Error("No se pudo comprimir la fotografía.");
}

function rutaStorage(actividadId: string, nombre: string): string {
  const extension = nombre.split(".").pop()?.toLowerCase() || "bin";
  const aleatorio = crypto.randomUUID();
  return `${actividadId}/${aleatorio}.${extension}`;
}

function pesoLegible(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function BotonQuitarAnexo({
  onClick,
  ariaLabel,
}: {
  onClick: () => void;
  ariaLabel: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <RippleButton
      type="button"
      rippleColor="#E5E7EB"
      onClick={onClick}
      aria-label={ariaLabel}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={cn(sigetBtnSurface, "w-auto shrink-0 px-2")}
    >
      <SigetActionIcon
        from={Trash2}
        to={Trash}
        color={sigetAccent.quitar}
        hovered={hovered}
      />
    </RippleButton>
  );
}

function TarjetaAnexo({
  anexo,
  onQuitar,
}: {
  anexo: MinutaAnexo;
  onQuitar: () => void;
}) {
  const Icono = ANEXO_ICONO[anexo.tipo];
  const titulo = anexo.titulo || anexo.nombreArchivo || anexo.url;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-900"
    >
      {anexo.tipo === "imagen" ? (
        <a
          href={anexo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative size-14 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
        >
          <Image
            src={anexo.url}
            alt={titulo}
            fill
            sizes="56px"
            className="object-cover"
            unoptimized
          />
        </a>
      ) : (
        <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
          <SigetActionIcon
            from={Icono}
            to={Icono}
            color={sigetAccent.abrir}
            hovered={false}
            morphOnHover={false}
          />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {anexoEtiquetaTipo(anexo.tipo)}
          {anexo.tamano ? ` · ${pesoLegible(anexo.tamano)}` : ""}
        </p>
        <a
          href={anexo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-1 text-sm font-semibold text-azul-trifinio hover:underline"
        >
          <span className="min-w-0 truncate">{titulo}</span>
          <ExternalLink className="size-3.5 shrink-0" />
        </a>
      </div>

      <BotonQuitarAnexo onClick={onQuitar} ariaLabel="Quitar anexo" />
    </motion.li>
  );
}

export function AnexosMinuta({
  actividadId,
  anexos,
  onChange,
}: {
  actividadId: string;
  anexos: MinutaAnexo[];
  onChange: (anexos: MinutaAnexo[]) => void;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [enlaceUrl, setEnlaceUrl] = useState("");
  const [enlaceTitulo, setEnlaceTitulo] = useState("");
  const inputImagen = useRef<HTMLInputElement>(null);
  const inputPdf = useRef<HTMLInputElement>(null);

  const subirArchivo = async (file: File, tipo: "imagen" | "pdf") => {
    if (!actividadId) {
      toast.error("Guarda la actividad antes de adjuntar archivos.");
      return;
    }

    setSubiendo(true);
    try {
      const preparado =
        tipo === "imagen" ? await comprimirImagen(file) : file;

      if (tipo === "pdf" && preparado.size > MAX_PDF_BYTES) {
        toast.warn("El PDF supera los 10 MB permitidos.");
        return;
      }

      const supabase = createClient();
      const path = rutaStorage(actividadId, preparado.name);

      const { error } = await supabase.storage
        .from(MINUTA_ANEXOS_BUCKET)
        .upload(path, preparado, {
          contentType: preparado.type,
          upsert: false,
        });

      if (error) throw new Error(error.message);

      const { data } = supabase.storage
        .from(MINUTA_ANEXOS_BUCKET)
        .getPublicUrl(path);

      onChange([
        ...anexos,
        {
          id: nuevoAnexoId(),
          tipo,
          titulo: file.name,
          url: data.publicUrl,
          bucket: MINUTA_ANEXOS_BUCKET,
          path,
          nombreArchivo: file.name,
          mime: preparado.type,
          tamano: preparado.size,
        },
      ]);

      toast.success(
        tipo === "imagen" ? "Fotografía adjuntada." : "PDF adjuntado.",
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo subir el archivo.",
      );
    } finally {
      setSubiendo(false);
    }
  };

  const agregarEnlace = () => {
    if (!esEnlaceValido(enlaceUrl)) {
      toast.warn("Escribe un enlace válido.");
      return;
    }
    const url = normalizarEnlace(enlaceUrl);
    onChange([
      ...anexos,
      {
        id: nuevoAnexoId(),
        tipo: "enlace",
        titulo: enlaceTitulo.trim() || url,
        url,
        bucket: null,
        path: null,
        nombreArchivo: null,
        mime: null,
        tamano: null,
      },
    ]);
    setEnlaceUrl("");
    setEnlaceTitulo("");
    toast.success("Enlace agregado.");
  };

  const quitar = async (anexo: MinutaAnexo) => {
    onChange(anexos.filter((a) => a.id !== anexo.id));
    if (!anexo.path) return;
    try {
      const supabase = createClient();
      await supabase.storage.from(MINUTA_ANEXOS_BUCKET).remove([anexo.path]);
    } catch {
      // El registro ya salió de la minuta; el archivo huérfano no bloquea nada.
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputImagen}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void subirArchivo(file, "imagen");
        }}
      />
      <input
        ref={inputPdf}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void subirArchivo(file, "pdf");
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <SigetActionButton
          label="Foto"
          accentColor={sigetAccent.crear}
          morphFrom={ImageIcon}
          morphTo={Upload}
          onClick={() => inputImagen.current?.click()}
          disabled={subiendo}
          ariaLabel="Adjuntar fotografía"
          className="w-auto shrink-0"
        />
        <SigetActionButton
          label="PDF"
          accentColor={sigetAccent.crear}
          morphFrom={FileText}
          morphTo={Upload}
          onClick={() => inputPdf.current?.click()}
          disabled={subiendo}
          ariaLabel="Adjuntar documento PDF"
          className="w-auto shrink-0"
        />
        {subiendo ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Subiendo…
          </span>
        ) : null}
      </div>

      <div className="grid gap-2.5 rounded-xl border border-dashed border-slate-300/80 bg-zinc-50/60 p-3 dark:border-zinc-700 dark:bg-zinc-800/30 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <ModalField>
          <ModalLabel htmlFor="anexo-enlace-titulo">Nombre del enlace</ModalLabel>
          <ModalInput
            id="anexo-enlace-titulo"
            value={enlaceTitulo}
            onChange={(e) => setEnlaceTitulo(e.target.value)}
            placeholder="Informe de la sesión"
            className="bg-white dark:bg-zinc-900"
          />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="anexo-enlace-url">Enlace</ModalLabel>
          <ModalInput
            id="anexo-enlace-url"
            value={enlaceUrl}
            onChange={(e) => setEnlaceUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                agregarEnlace();
              }
            }}
            placeholder="https://ejemplo.org/documento"
            className={cn("bg-white dark:bg-zinc-900", modalFieldClass)}
          />
        </ModalField>
        <SigetActionButton
          label="Agregar"
          accentColor={sigetAccent.guardar}
          morphFrom={Plus}
          morphTo={Check}
          onClick={agregarEnlace}
          ariaLabel="Agregar enlace a los anexos"
          className="w-auto shrink-0"
        />
      </div>

      {anexos.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">
          Sin anexos. Adjunta fotografías, PDF o enlaces de respaldo.
        </p>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {anexos.map((anexo) => (
              <TarjetaAnexo
                key={anexo.id}
                anexo={anexo}
                onQuitar={() => void quitar(anexo)}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

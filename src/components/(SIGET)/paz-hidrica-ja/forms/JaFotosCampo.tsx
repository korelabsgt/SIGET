"use client";

import { useRef } from "react";
import { Camera, ImagePlus, Minus, Trash2 } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { ModalLabel, toast } from "@/components/ui/general-modal";

const MAX_FOTOS = 5;
const MAX_BYTES = 2_000_000;
const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";

async function archivoADataUrl(archivo: File): Promise<string> {
  const bitmap = await createImageBitmap(archivo);
  const maxW = 960;
  const escala = Math.min(1, maxW / bitmap.width);
  const w = Math.round(bitmap.width * escala);
  const h = Math.round(bitmap.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CANVAS");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.72);
}

export function JaFotosCampo({
  fotos,
  onChange,
  disabled = false,
}: {
  fotos: string[];
  onChange: (fotos: string[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const restantes = MAX_FOTOS - fotos.length;

  const agregar = async (archivos: File[]) => {
    const validos: File[] = [];
    for (const archivo of archivos) {
      if (!ACCEPT.split(",").includes(archivo.type) && !archivo.type.startsWith("image/")) {
        toast.warn("Usa JPG, PNG o WEBP.");
        continue;
      }
      if (archivo.size > MAX_BYTES) {
        toast.warn("Cada foto debe pesar menos de 2 MB.");
        continue;
      }
      validos.push(archivo);
    }
    const cupo = validos.slice(0, Math.max(0, restantes));
    if (cupo.length === 0) return;
    try {
      const nuevas = await Promise.all(cupo.map(archivoADataUrl));
      onChange([...fotos, ...nuevas].slice(0, MAX_FOTOS));
    } catch {
      toast.error("No se pudieron leer las fotografías.");
    }
  };

  return (
    <div className="space-y-2.5">
      <ModalLabel>Fotografías</ModalLabel>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Hasta {MAX_FOTOS} fotos del lugar, la tensión o la evidencia. JPG, PNG o WEBP.
      </p>
      {fotos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {fotos.map((src, i) => (
            <div
              key={`${src.slice(0, 48)}-${i}`}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <div className="relative aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Fotografía ${i + 1}`} className="absolute inset-0 size-full object-cover" />
              </div>
              <div className="flex justify-center p-2">
                <SigetActionButton
                  label="Quitar"
                  accentColor={sigetAccent.quitar}
                  morphFrom={Trash2}
                  morphTo={Minus}
                  onClick={() => onChange(fotos.filter((_, idx) => idx !== i))}
                  disabled={disabled}
                  ariaLabel={`Quitar fotografía ${i + 1}`}
                  className="w-auto shrink-0"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
          Aún no hay fotografías en este registro.
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        disabled={disabled || restantes <= 0}
        onChange={(e) => {
          const lista = Array.from(e.target.files ?? []);
          e.target.value = "";
          void agregar(lista);
        }}
      />
      {restantes > 0 ? (
        <SigetActionButton
          label="Añadir"
          accentColor={sigetAccent.crear}
          morphFrom={ImagePlus}
          morphTo={Camera}
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          ariaLabel="Añadir fotografías"
          className="w-auto shrink-0"
        />
      ) : null}
    </div>
  );
}

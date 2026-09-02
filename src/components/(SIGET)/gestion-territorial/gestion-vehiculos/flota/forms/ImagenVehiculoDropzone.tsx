"use client";

import { Loader2, Plus, UploadCloud, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_FOTOS_VEHICULO, MIN_FOTOS_VEHICULO } from "../lib/helpers";
import { canManageFlota } from "../../lib/permissions";

const MAX_BYTES = 2_000_000;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPT_ATTR = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export function ImagenVehiculoDropzone({
  previews,
  previewLoading = [],
  onAddFiles,
  onRemove,
  disabled,
}: {
  previews: string[];
  previewLoading?: boolean[];
  onAddFiles: (files: File[]) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const remaining = MAX_FOTOS_VEHICULO - previews.length;
  const canAdd = remaining > 0 && !disabled;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (selected.length === 0) return;

    const valid: File[] = [];
    for (const selectedFile of selected) {
      if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
        toast.error("Formato no válido. Use JPG, PNG o WEBP.");
        continue;
      }
      if (selectedFile.size > MAX_BYTES) {
        toast.error("Cada imagen no debe superar los 2 MB");
        continue;
      }
      valid.push(selectedFile);
    }

    if (valid.length === 0) return;
    onAddFiles(valid.slice(0, Math.max(0, remaining)));
  };

  return (
    <div className="space-y-2">
      <Label>Fotografías del vehículo</Label>
      <p className="text-xs text-muted-foreground">
        Obligatoria 1. Las otras {MAX_FOTOS_VEHICULO - MIN_FOTOS_VEHICULO} son opcionales.
      </p>
      {previews.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <AnimatePresence mode="popLayout" initial={false}>
            {previews.map((url, index) => {
              const loading = previewLoading[index] ?? false;
              return (
              <motion.div
                key={`${url || "pending"}-${index}`}
                layout={!prefersReducedMotion}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: -8, scale: 0.99 }
                }
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800"
              >
                {url ? (
                  <img
                    src={url}
                    alt={`Fotografía ${index + 1}`}
                    className="size-full object-cover"
                  />
                ) : loading ? (
                  <div className="flex size-full items-center justify-center bg-zinc-200 dark:bg-zinc-700">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="size-full bg-zinc-200 dark:bg-zinc-700" />
                )}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRemove(index)}
                  className="absolute right-1.5 top-1.5 inline-flex size-7 cursor-pointer items-center justify-center rounded-lg border-0 bg-red-100 text-red-600 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                  aria-label={`Quitar fotografía ${index + 1}`}
                >
                  <X className="size-3.5" />
                </button>
              </motion.div>
            );
            })}
          </AnimatePresence>
          {canAdd ? (
            <label className="relative flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl bg-sky-100 text-celeste-trifinio hover:bg-sky-200 dark:bg-sky-950 dark:hover:bg-sky-900">
              <Plus className="size-5" />
              <span className="mt-1 text-[9px] font-bold uppercase tracking-widest">
                Añadir
              </span>
              <Input
                type="file"
                accept={ACCEPT_ATTR}
                multiple
                disabled={disabled}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
                onChange={handleFileChange}
              />
            </label>
          ) : null}
        </div>
      ) : (
        <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:bg-muted/50">
          <Input
            type="file"
            accept={ACCEPT_ATTR}
            multiple
            disabled={disabled}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            onChange={handleFileChange}
          />
          <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-sky-100 text-celeste-trifinio dark:bg-sky-950/60">
            <UploadCloud className="size-5" />
          </div>
          <p className="text-sm font-medium">Haz clic o arrastra imágenes aquí</p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG o WEBP (máx. 2 MB). Mínimo {MIN_FOTOS_VEHICULO}, máximo {MAX_FOTOS_VEHICULO}.
          </p>
        </div>
      )}
    </div>
  );
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string" || result.length === 0) {
        reject(new Error("No se pudo leer la imagen"));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
}

export async function uploadImagenVehiculo(file: File, placa: string): Promise<string> {
  const { createClient } = await import("@/utils/supabase/client");
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Debes iniciar sesión para subir la fotografía.");
  }

  const role =
    (user.user_metadata?.rol as string | undefined) || user.role || "user";
  if (!canManageFlota(role)) {
    throw new Error("No tienes permisos para subir fotografías de la flota.");
  }

  const extensionFromName = file.name.split(".").pop()?.toLowerCase();
  const extensionFromType = file.type.split("/")[1]?.replace("jpeg", "jpg");
  const extension = (extensionFromName || extensionFromType || "jpg").replace(/[^a-z0-9]/g, "");
  const placaSegment =
    placa
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "vehiculo";
  const filePath = `flota/${placaSegment}_${crypto.randomUUID()}.${extension || "jpg"}`;

  const { error: uploadError } = await supabase.storage.from("vehiculos").upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });

  if (uploadError) {
    throw new Error("No se pudo guardar la imagen en Storage: " + uploadError.message);
  }

  return filePath;
}

"use client";

import { Camera, Images } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  IMAGEN_VEHICULO_ACCEPT_ATTR,
  IMAGEN_VEHICULO_CAPTURE_ATTR,
} from "./imagen-vehiculo-compress";

const mobileActionClass =
  "relative inline-flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-sky-100 px-3 py-2.5 text-xs font-bold text-celeste-trifinio transition-colors hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sky-950 dark:hover:bg-sky-900";

const hiddenFileClass = "absolute inset-0 z-10 size-full cursor-pointer opacity-0";

export function ImagenVehiculoFuentePicker({
  disabled,
  multiple = true,
  onFiles,
  className,
  compact = false,
}: {
  disabled?: boolean;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  className?: string;
  compact?: boolean;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (selected.length > 0) onFiles(selected);
  };

  return (
    <div
      className={cn(
        compact ? "flex min-w-[5.5rem] flex-col gap-1" : "flex w-full gap-2",
        "lg:hidden",
        className,
      )}
    >
      <label className={cn(mobileActionClass, compact && "min-h-9 flex-1 px-2 py-2 text-[9px]")}>
        <Camera className={cn(compact ? "size-4" : "size-4 shrink-0")} aria-hidden />
        <span>Cámara</span>
        <Input
          type="file"
          accept={IMAGEN_VEHICULO_ACCEPT_ATTR}
          capture={IMAGEN_VEHICULO_CAPTURE_ATTR}
          multiple={multiple}
          disabled={disabled}
          className={hiddenFileClass}
          aria-label="Tomar foto con la cámara"
          onChange={handleChange}
        />
      </label>
      <label className={cn(mobileActionClass, compact && "min-h-9 flex-1 px-2 py-2 text-[9px]")}>
        <Images className={cn(compact ? "size-4" : "size-4 shrink-0")} aria-hidden />
        <span>Galería</span>
        <Input
          type="file"
          accept={IMAGEN_VEHICULO_ACCEPT_ATTR}
          multiple={multiple}
          disabled={disabled}
          className={hiddenFileClass}
          aria-label="Elegir fotografías de la galería"
          onChange={handleChange}
        />
      </label>
    </div>
  );
}

export function ImagenVehiculoEscritorioFileInput({
  disabled,
  multiple = true,
  onFiles,
  overlay = true,
  className,
}: {
  disabled?: boolean;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  overlay?: boolean;
  className?: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (selected.length > 0) onFiles(selected);
  };

  if (!overlay) {
    return (
      <Input
        type="file"
        accept={IMAGEN_VEHICULO_ACCEPT_ATTR}
        multiple={multiple}
        disabled={disabled}
        className={cn("hidden", className)}
        aria-label="Subir imágenes"
        onChange={handleChange}
      />
    );
  }

  return (
    <Input
      type="file"
      accept={IMAGEN_VEHICULO_ACCEPT_ATTR}
      multiple={multiple}
      disabled={disabled}
      className={cn("absolute inset-0 size-full cursor-pointer opacity-0", "hidden lg:block", className)}
      aria-label="Subir imágenes"
      onChange={handleChange}
    />
  );
}

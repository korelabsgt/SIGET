"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { GvImagenZoomViewer } from "./gv-imagen-zoom-viewer";

export function GvImagenAmpliada({
  src,
  alt,
  onError,
  thumbClassName,
  imagenClassName,
  thumbFit = "cover",
  fillParent = false,
}: {
  src: string;
  alt: string;
  onError?: () => void;
  thumbClassName?: string;
  imagenClassName?: string;
  thumbFit?: "cover" | "contain";
  fillParent?: boolean;
}) {
  const recibo = thumbFit === "contain";
  const llenar = fillParent;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const overlay =
    open && mounted
      ? createPortal(
          <GvImagenZoomViewer src={src} alt={alt} onClose={() => setOpen(false)} />,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "block w-full cursor-pointer overflow-hidden border-0 p-0 transition-[box-shadow,opacity] hover:opacity-[0.98]",
          recibo
            ? "rounded-2xl bg-gradient-to-b from-sky-50/90 to-zinc-100/80 shadow-sm ring-1 ring-zinc-200/90 dark:from-sky-950/30 dark:to-zinc-950 dark:ring-zinc-700"
            : llenar
              ? "rounded-none bg-transparent dark:bg-transparent"
              : "rounded-xl bg-zinc-200/60 dark:bg-zinc-900/60",
          thumbClassName,
        )}
      >
        <img
          src={src}
          alt={alt}
          onError={onError}
          className={cn(
            recibo
              ? "mx-auto max-h-[min(22rem,52vh)] w-full object-contain p-4 sm:p-5"
              : llenar
                ? "size-full object-cover object-center"
                : "aspect-[4/3] w-full object-cover object-center",
            imagenClassName,
          )}
        />
      </button>
      {overlay}
    </>
  );
}

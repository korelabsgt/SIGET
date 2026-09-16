"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function GvImagenAmpliada({
  src,
  alt,
  onError,
  thumbClassName,
  imagenClassName,
}: {
  src: string;
  alt: string;
  onError?: () => void;
  thumbClassName?: string;
  imagenClassName?: string;
}) {
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
          <div
            className="fixed inset-0 z-[250] flex items-center justify-center bg-black/85 p-4"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={alt}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-black/50 text-white hover:bg-black/70"
              aria-label="Cerrar"
            >
              <X size={22} strokeWidth={2.25} />
            </button>
            <img
              src={src}
              alt={alt}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[92dvh] max-w-[min(92vw,64rem)] object-contain"
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "block w-full cursor-pointer overflow-hidden rounded-xl border-0 bg-zinc-200/60 p-0 dark:bg-zinc-900/60",
          thumbClassName,
        )}
      >
        <img
          src={src}
          alt={alt}
          onError={onError}
          className={cn("aspect-[4/3] w-full object-cover object-center", imagenClassName)}
        />
      </button>
      {overlay}
    </>
  );
}

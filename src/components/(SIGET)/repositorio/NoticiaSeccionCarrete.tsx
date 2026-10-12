"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { BlurFade } from "@/components/ui/blur-fade";
import { cn } from "@/lib/utils";

function columnasGaleria(total: number): string {
  if (total === 2 || total === 4) return "columns-2";
  return "columns-2 sm:columns-3";
}

function FotoGaleria({
  imageUrl,
  idx,
  alt,
  onOpen,
  layoutSolo,
}: {
  imageUrl: string;
  idx: number;
  alt: string;
  onOpen: () => void;
  layoutSolo: boolean;
}) {
  return (
    <BlurFade
      delay={0.25 + idx * 0.05}
      inView
      className={cn(
        "overflow-hidden rounded-2xl",
        layoutSolo
          ? "block w-full min-w-0 max-w-full"
          : "mb-4 inline-block w-full break-inside-avoid",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ver foto ${idx + 1} a pantalla completa`}
        className="block w-full min-w-0 max-w-full cursor-pointer overflow-hidden rounded-2xl border-0 bg-transparent p-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={cn(
            "block w-full min-w-full max-w-full rounded-2xl",
            layoutSolo ? "h-auto object-cover" : "object-cover",
          )}
          src={imageUrl}
          alt={`${alt} ${idx + 1}`}
        />
      </button>
    </BlurFade>
  );
}

export function NoticiaSeccionCarrete({
  images,
  alt,
  insetBleed = false,
}: {
  images: string[];
  alt: string;
  insetBleed?: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const total = images.length;
  const openSrc = openIndex !== null ? (images[openIndex] ?? null) : null;
  const unaSola = total === 1;

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenIndex(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [openIndex]);

  if (total === 0) return null;

  return (
    <>
      <section
        className={cn(
          "w-full min-w-0 max-w-full",
          unaSola && insetBleed && "-mx-2.5 w-[calc(100%+1.25rem)] max-w-none",
        )}
      >
        {unaSola ? (
          <FotoGaleria
            imageUrl={images[0]!}
            idx={0}
            alt={alt}
            layoutSolo
            onOpen={() => setOpenIndex(0)}
          />
        ) : (
          <div className={cn("w-full min-w-0 max-w-full gap-4", columnasGaleria(total))}>
            {images.map((imageUrl, idx) => (
              <FotoGaleria
                key={`${imageUrl}-${idx}`}
                imageUrl={imageUrl}
                idx={idx}
                alt={alt}
                layoutSolo={false}
                onOpen={() => setOpenIndex(idx)}
              />
            ))}
          </div>
        )}
      </section>
      <AnimatePresence>
        {openSrc ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="button"
            tabIndex={0}
            aria-label="Cerrar foto"
            onClick={() => setOpenIndex(null)}
            onKeyDown={(event) => {
              if (
                event.key === "Escape" ||
                event.key === "Enter" ||
                event.key === " "
              ) {
                setOpenIndex(null);
              }
            }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          >
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setOpenIndex(null)}
              className="absolute right-4 top-4 rounded-full bg-neutral-900/50 p-2 text-white ring-1 backdrop-blur-md dark:bg-neutral-100/50 dark:text-black"
            >
              <XIcon className="size-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={openSrc}
              alt={alt}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[92vh] max-w-[92vw] rounded-2xl object-contain"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import type { FotoMicrocuenca } from "./lib/fotos-microcuenca";
import { fotosComoGaleria } from "./lib/fotos-microcuenca";

function JaFotoFill({ src, alt }: { src: string; alt: string }) {
  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className="absolute inset-0 size-full object-cover" />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, 480px"
      className="object-cover"
    />
  );
}

function PaginadorFotos({
  actual,
  total,
  onAntes,
  onSiguiente,
}: {
  actual: number;
  total: number;
  onAntes: () => void;
  onSiguiente: () => void;
}) {
  if (total <= 1) return null;
  return (
    <div className="mt-1 flex items-center justify-end gap-2">
      <SigetActionButton
        label="Antes"
        iconOnly
        accentColor={sigetAccent.neutro}
        morphFrom={ChevronLeft}
        morphTo={ChevronLeft}
        morphOnHover={false}
        onClick={onAntes}
        ariaLabel="Foto anterior"
      />
      <span className="px-2 text-sm font-medium tabular-nums text-zinc-500">
        {actual}/{total}
      </span>
      <SigetActionButton
        label="Siguiente"
        iconOnly
        accentColor={sigetAccent.neutro}
        morphFrom={ChevronRight}
        morphTo={ChevronRight}
        morphOnHover={false}
        onClick={onSiguiente}
        ariaLabel="Foto siguiente"
      />
    </div>
  );
}

export function JaMapGaleriaSlider({
  fotos,
  titulo,
  compact = false,
}: {
  fotos: FotoMicrocuenca[] | string[];
  titulo?: string;
  compact?: boolean;
}) {
  const galeria = fotosComoGaleria(
    fotos.map((foto) => (typeof foto === "string" ? foto : foto.src)),
    fotos.every((foto) => typeof foto !== "string")
      ? (fotos as FotoMicrocuenca[])
      : undefined,
  );
  const [indice, setIndice] = useState(0);
  const total = galeria.length;

  useEffect(() => {
    setIndice(0);
  }, [fotos]);

  if (total === 0) return null;

  const actual = galeria[Math.min(indice, total - 1)];
  const anterior = () => setIndice((v) => (v - 1 + total) % total);
  const siguiente = () => setIndice((v) => (v + 1) % total);

  return (
    <div className="overflow-hidden">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={actual.src}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <JaFotoFill src={actual.src} alt={actual.alt} />
          </motion.div>
        </AnimatePresence>
      </div>

      {!compact && titulo ? (
        <div className="px-1 pt-2">
          <p className="text-xs font-semibold leading-snug text-zinc-800 dark:text-zinc-100">
            {actual.alt}
          </p>
          <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{titulo}</p>
          <PaginadorFotos
            actual={indice + 1}
            total={total}
            onAntes={anterior}
            onSiguiente={siguiente}
          />
        </div>
      ) : (
        <PaginadorFotos
          actual={indice + 1}
          total={total}
          onAntes={anterior}
          onSiguiente={siguiente}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import Image from "next/image";
import { CircleX, X } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import {
  AMBITO_CUENCA,
  GESTION_RECURSOS_HIDRICOS,
  TITULO_MODULO,
} from "./lib/catalogos";

const LOGO_JA_SRC = "/trifinio/observatorio-ja/logo-ja.png";

function lockBodyScroll() {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  const prevOverflow = document.body.style.overflow;
  const prevPaddingRight = document.body.style.paddingRight;
  document.body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
  return () => {
    document.body.style.overflow = prevOverflow;
    document.body.style.paddingRight = prevPaddingRight;
  };
}

function GlifoJaAmpliado({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const unlock = lockBodyScroll();
    return () => {
      window.removeEventListener("keydown", onKey);
      unlock();
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  const nombre = TITULO_MODULO.replace(" - SIGET", "");

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ja-glifo-titulo"
          className="fixed inset-0 z-220 flex cursor-pointer items-center justify-center bg-white/60 px-5 backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          onClick={onClose}
        >
          <motion.div
            className="relative flex w-full max-w-5xl cursor-default flex-col items-center text-center"
            initial={{ opacity: 0, scale: 0.84, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="relative mb-6">
              <span className="pointer-events-none absolute inset-[-22%] rounded-full bg-white blur-3xl" />
              <Image
                src={LOGO_JA_SRC}
                alt="Glifo Ja'"
                width={640}
                height={640}
                unoptimized
                className="relative z-10 h-[min(48vh,22rem)] w-[min(48vh,22rem)] object-contain"
              />
            </span>
            <motion.p
              className="relative text-[10px] font-black uppercase tracking-[0.28em] text-[#C59B27] md:text-xs"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.35 }}
            >
              {GESTION_RECURSOS_HIDRICOS}
            </motion.p>
            <h2
              id="ja-glifo-titulo"
              className="relative mt-3 flex flex-nowrap items-baseline justify-center gap-x-[0.38em] whitespace-nowrap text-[clamp(1.2rem,4.2vw,2.85rem)] font-black tracking-tight text-[#003882]"
            >
              {nombre.split(" ").map((palabra, i) => (
                <motion.span
                  key={`${palabra}-${i}`}
                  className="inline-block"
                  initial={{ opacity: 0, y: 22, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    delay: 0.22 + i * 0.08,
                    duration: 0.48,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {palabra}
                </motion.span>
              ))}
            </h2>
            <motion.p
              className="relative mt-5 max-w-4xl text-base font-medium leading-relaxed text-[#003882]/80 md:text-lg"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              Ja&apos; nombra el agua. Este módulo abre a la ciudadanía la {GESTION_RECURSOS_HIDRICOS} en la {AMBITO_CUENCA}: territorio, avisos, acuerdos y cuentas públicas.
            </motion.p>
            <motion.div
              className="relative mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.78, duration: 0.3 }}
            >
              <SigetActionButton
                label="Cerrar"
                accentColor={sigetAccent.cancelar}
                morphFrom={X}
                morphTo={CircleX}
                onClick={onClose}
                ariaLabel="Cerrar glifo Ja'"
                className="w-auto shrink-0"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function GlifoJaHeader({
  imageClassName,
}: {
  imageClassName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 cursor-pointer rounded-2xl bg-white p-2"
        aria-label="Ampliar glifo Ja'"
      >
        <Image
          src={LOGO_JA_SRC}
          alt="Glifo Ja'"
          width={280}
          height={280}
          priority
          unoptimized
          className={imageClassName}
        />
      </button>
      <GlifoJaAmpliado open={open} onClose={() => setOpen(false)} />
    </>
  );
}

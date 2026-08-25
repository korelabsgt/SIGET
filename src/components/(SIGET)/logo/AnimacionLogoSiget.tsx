"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AnimacionLogoSigetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnimacionLogoSiget({ isOpen, onClose }: AnimacionLogoSigetProps) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="fullscreen-overlay-siget"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[1000000] flex cursor-pointer items-center justify-center overflow-hidden bg-white/55 p-4 backdrop-blur-[20px] dark:bg-black/55 lg:p-12"
          style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}
        >
          <motion.button
            type="button"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            className="absolute top-8 right-8 z-20 cursor-pointer rounded-full bg-black/10 p-3 text-azul-trifinio-hero transition-colors hover:bg-black/20 dark:bg-white/15 dark:text-white dark:hover:bg-white/25"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </motion.button>

          <motion.div
            initial={{ scale: 1.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none flex h-full w-full items-center justify-center"
          >
            <div
              className={cn(
                "pointer-events-auto flex max-w-xl flex-col items-center justify-center rounded-3xl px-8 py-10 text-center shadow-2xl sm:px-12 sm:py-12",
                "border border-white/70 bg-white/95 backdrop-blur-sm",
                "dark:border-zinc-700/40 dark:bg-zinc-100/98",
              )}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 50, damping: 16, duration: 2.4 }}
                className="mb-6 shrink-0 sm:mb-8"
              >
                <Image
                  src="/trifinio/logo-vertical.png"
                  alt="Plan Trifinio"
                  width={400}
                  height={480}
                  className="h-auto w-[200px] object-contain sm:w-[260px] lg:w-[320px]"
                  priority
                />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 40, damping: 18, duration: 1.3 }}
                className="font-black leading-[0.95] text-azul-trifinio-hero"
                style={{ fontFamily: "'Arial Black', sans-serif", fontSize: "clamp(2.6rem, 9vw, 5rem)" }}
              >
                SIGET
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 50, damping: 16, duration: 1.1 }}
                className="mt-4 max-w-md font-semibold leading-snug text-azul-trifinio-hero sm:max-w-lg"
                style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(1rem, 2.8vw, 1.45rem)" }}
              >
                Sistema Integral de Gestión Estratégica Trifinio
              </motion.p>
            </div>
          </motion.div>

          <div className="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce text-[10px] font-black tracking-[0.5em] text-azul-trifinio-hero/70 uppercase dark:text-white/70">
            Click en cualquier lugar para cerrar
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

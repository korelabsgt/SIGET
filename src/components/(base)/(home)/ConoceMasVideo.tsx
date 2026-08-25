"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, Globe } from "lucide-react";
import Link from "next/link";
import LogoTrifinio from "@/components/(SIGET)/logo/LogoTrifinio";
import LogoTrifinioMobile from "@/components/(SIGET)/logo/LogoTrifinio-mobile";
import { cn } from "@/lib/utils";

const YOUTUBE_VIDEO_ID = "TA0GAUs8vXc";

const YOUTUBE_EMBED_PARAMS = [
  "autoplay=1",
  "controls=0",
  "rel=0",
  "modestbranding=1",
  "iv_load_policy=3",
  "cc_load_policy=0",
  "playsinline=1",
  "fs=0",
  "disablekb=1",
  "enablejsapi=0",
].join("&");

const fadeTransition = { duration: 0.4, ease: [0.25, 1, 0.5, 1] as const };

export function ConoceMasButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative flex items-center gap-2.5 px-4 py-2 md:px-5 md:py-2.5 rounded-lg overflow-hidden cursor-pointer",
        className,
      )}
    >
      <div className="absolute inset-0 rounded-lg border border-white/50 bg-white/55 backdrop-blur-md" />
      <Play className="relative size-4 shrink-0 fill-azul-trifinio-hero text-azul-trifinio-hero" />
      <span className="relative whitespace-nowrap text-sm font-semibold tracking-wide text-azul-trifinio-hero md:text-base">
        Conoce más
      </span>
    </motion.button>
  );
}

function YouTubePlayer() {
  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?${YOUTUBE_EMBED_PARAMS}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      className="absolute inset-0 h-full w-full border-0"
      title="Plan Trifinio — Conoce más"
    />
  );
}

/** Un solo reproductor a nivel página — evita audio duplicado si hay hero móvil + desktop. */
export function VideoPlayerOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Fondo con blur transparente y sutil color de capa */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[200] bg-black/10 backdrop-blur-xl"
            onClick={onClose}
          />
          {/* Contenedor del reproductor perfectamente centrado */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={fadeTransition}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto flex flex-col items-center w-full max-w-3xl">
              <div
                className="relative w-full aspect-video overflow-hidden rounded-xl shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <YouTubePlayer />
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white/80 hover:text-white transition-colors cursor-pointer z-10 backdrop-blur-sm"
                  aria-label="Cerrar video"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="relative mt-4 px-4 py-2 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-full" />
                <p className="relative text-center text-xs md:text-sm font-medium text-white/90">
                  Clic fuera del video para cerrar
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function HeroVideoLayout({
  videoOpen,
  onOpen,
  mobile = false,
}: {
  videoOpen: boolean;
  onOpen: () => void;
  mobile?: boolean;
}) {
  if (videoOpen) return null;

  return (
    <div className="relative z-[6] mx-auto w-full max-w-2xl px-2">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fadeTransition}
        className="flex w-full flex-col items-center"
      >
        <div className="relative isolate w-full">
          {mobile ? (
            <LogoTrifinioMobile backgroundEffect="blur" forceAzulColors />
          ) : (
            <LogoTrifinio backgroundEffect="blur" forceAzulColors />
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 md:mt-8">
          <ConoceMasButton onClick={onOpen} />
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/observatorio-web"
              className="relative flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-lg px-4 py-2 md:px-5 md:py-2.5"
            >
              <div className="absolute inset-0 rounded-lg border border-white/50 bg-white/55 backdrop-blur-md" />
              <Globe className="relative size-4 shrink-0 text-azul-trifinio-hero" />
              <span className="relative whitespace-nowrap text-sm font-semibold tracking-wide text-azul-trifinio-hero md:text-base">
                Observatorio Web
              </span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

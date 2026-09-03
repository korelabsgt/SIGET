"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import Image from "next/image";

interface AnimacionLogoSigetProps {
  isOpen: boolean;
  onClose: () => void;
}

const EASE_OUT = [0.4, 0, 0.2, 1] as const;
const EASE_SNAP = [0.22, 1, 0.36, 1] as const;
const EASE_INSTITUTIONAL = [0.4, 0, 0.2, 1] as const;

const shellVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: EASE_SNAP },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.38, ease: EASE_OUT },
  },
};

const logoStampVariants: Variants = {
  hidden: {
    scale: 2.75,
    opacity: 0,
  },
  visible: {
    scale: [2.75, 0.97, 1],
    opacity: [0, 1, 1],
    transition: {
      duration: 0.72,
      times: [0, 0.72, 1],
      ease: EASE_SNAP,
      delay: 0.06,
    },
  },
};

const institutionalReveal = (delay: number, blurPx: number): Variants => ({
  hidden: {
    opacity: 0,
    filter: `blur(${blurPx}px)`,
    y: 4,
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: {
      delay,
      duration: 1.35,
      ease: EASE_INSTITUTIONAL,
      opacity: { duration: 1.15, ease: EASE_INSTITUTIONAL },
      filter: { duration: 1.35, ease: EASE_INSTITUTIONAL },
      y: { duration: 1.25, ease: EASE_INSTITUTIONAL },
    },
  },
});

const titleVariants = institutionalReveal(0.58, 5);
const subtitleVariants = institutionalReveal(0.9, 4);

const titleStyle = {
  fontFamily: "'Arial Black', sans-serif",
  fontSize: "clamp(2.25rem, 14vw, 5rem)",
} as const;

const subtitleStyle = {
  fontFamily: "Arial, sans-serif",
  fontSize: "clamp(0.8125rem, 3.8vw, 1.45rem)",
} as const;

export default function AnimacionLogoSiget({
  isOpen,
  onClose,
}: AnimacionLogoSigetProps) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="fullscreen-overlay-siget"
          variants={shellVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 z-[1000000] flex cursor-pointer items-center justify-center overflow-hidden bg-white/25 p-0 backdrop-blur-md dark:bg-black/30 sm:p-4 lg:p-12"
          style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}
        >
          <div className="pointer-events-auto flex w-full max-w-none flex-col items-stretch justify-center px-4 py-8 text-center sm:items-center sm:px-12 sm:py-12">
            <motion.div
              variants={logoStampVariants}
              initial="hidden"
              animate="visible"
              className="mb-5 w-full shrink-0 origin-center sm:mb-8 sm:w-auto"
            >
              <Image
                src="/trifinio/logo-vertical.png"
                alt="Plan Trifinio"
                width={400}
                height={480}
                className="mx-auto h-auto w-[95%] max-w-[95%] object-contain sm:w-full sm:max-w-[260px] lg:max-w-[320px]"
                priority
              />
            </motion.div>

            <motion.h1
              variants={titleVariants}
              initial="hidden"
              animate="visible"
              className="mx-auto w-fit max-w-[95%] font-black leading-[0.95] tracking-tight text-azul-trifinio-hero sm:max-w-full"
              style={titleStyle}
            >
              SIGET
            </motion.h1>

            <motion.p
              variants={subtitleVariants}
              initial="hidden"
              animate="visible"
              className="mx-auto mt-3 w-[95%] max-w-none font-semibold leading-snug text-balance text-azul-trifinio-hero sm:mt-4 sm:w-full"
              style={subtitleStyle}
            >
              Sistema Integral de Gestión Estratégica Trifinio
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import {
  BannerHeroSequence,
  ObservatorioFooterCurtain,
  FOOTER_SCROLL_SPACER_VH,
  useFooterCurtainReveal,
} from "@/components/(base)/(home)/ObservatorioHomeSections";
import {
  ConocimientoCanalesHubSection,
  ConocimientoHomeSections,
} from "./ConocimientoHomeSections";
import { cn } from "@/lib/utils";

const HERO_IMAGE = "/trifinio/hero-background2.jpg";
const HERO_OVERLAY =
  "bg-linear-to-r from-[#0a1628]/90 via-[#2c5f9b]/50 to-[#1a95d3]/30";

function ConocimientoHeroFoto({
  compact = false,
  logoY,
  logoOpacity,
}: {
  compact?: boolean;
  logoY?: MotionValue<number>;
  logoOpacity?: MotionValue<number>;
}) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-[#0a1628]",
        !compact &&
          "h-[min(58vh,30rem)] sm:h-[min(56vh,32rem)] md:h-[min(52vh,34rem)]",
      )}
    >
      <img
        src={HERO_IMAGE}
        alt="Plan Trifinio"
        className={cn(
          "w-full",
          compact
            ? "block h-auto object-contain"
            : "absolute inset-0 size-full object-cover object-center",
        )}
      />
      <div
        className={`pointer-events-none absolute inset-0 ${HERO_OVERLAY}`}
        aria-hidden
      />
      <motion.div
        className={cn(
          "absolute inset-0 flex items-center justify-center px-4",
          compact ? "py-8 md:py-10" : "py-6 md:py-8",
        )}
        style={
          logoY && logoOpacity
            ? { y: logoY, opacity: logoOpacity }
            : undefined
        }
      >
        <div
          className={
            compact
              ? "w-full max-w-md"
              : "w-full max-w-xl md:max-w-2xl lg:max-w-3xl"
          }
        >
          <BannerHeroSequence
            label="Centro de Conocimiento"
            compact
            compactProminent={!compact}
          />
        </div>
      </motion.div>
    </div>
  );
}

export function ConocimientoPublicHome() {
  const { scrollY } = useScroll();
  const logoY = useTransform(scrollY, [0, 400], [0, -120]);
  const logoOpacity = useTransform(scrollY, [0, 280], [1, 0]);

  const footerRevealed = useFooterCurtainReveal(true);

  return (
    <div className="relative flex w-full flex-col">
      <section className="relative z-10 hidden w-full shrink-0 md:block">
        <ConocimientoHeroFoto logoY={logoY} logoOpacity={logoOpacity} />
      </section>

      <div className="relative z-20 w-full shrink-0 md:bg-[#0a1628]">
        <section className="relative w-full shrink-0 overflow-hidden bg-background dark:bg-background">
          <div className="relative md:hidden">
            <ConocimientoHeroFoto
              compact
              logoY={logoY}
              logoOpacity={logoOpacity}
            />
          </div>

          <div className="relative overflow-hidden bg-background">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-60 dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)]"
              aria-hidden
            />
            <div className="relative z-10">
              <ConocimientoCanalesHubSection />
              <ConocimientoHomeSections />
            </div>
          </div>
        </section>
      </div>

      <div className="hidden w-full shrink-0" style={{ height: `0vh` }} aria-hidden />
      <div
        className="hidden w-full shrink-0 bg-[#0a1628] md:block"
        style={{ height: `${FOOTER_SCROLL_SPACER_VH}vh` }}
        aria-hidden
      />

      <ObservatorioFooterCurtain
        revealed={footerRevealed}
        variant="conocimiento"
        compensateParentZoom={false}
      />
    </div>
  );
}

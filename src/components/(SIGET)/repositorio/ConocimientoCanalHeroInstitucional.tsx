"use client";

import {
  BannerHeroBlurReveal,
  BannerHeroSequence,
  getBannerCatalogFooterDelays,
} from "@/components/(base)/(home)/ObservatorioHomeSections";

const HERO_IMAGE = "/trifinio/hero-background2.jpg";
const HERO_OVERLAY =
  "bg-linear-to-r from-[#0a1628]/92 via-[#2c5f9b]/55 to-[#1a95d3]/35";

export function ConocimientoCanalHeroInstitucional({
  kicker,
  titulo,
  descripcion,
}: {
  kicker: string;
  titulo?: string;
  descripcion: string;
}) {
  const footerDelays = getBannerCatalogFooterDelays();

  return (
    <section className="relative w-full shrink-0 overflow-hidden bg-[#0a1628]">
      <div className="relative min-h-[min(52vw,17.5rem)] w-full md:min-h-[min(36vh,20rem)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 size-full object-cover object-center"
        />
        <div
          className={`pointer-events-none absolute inset-0 ${HERO_OVERLAY}`}
          aria-hidden
        />
        <div className="relative z-10 flex flex-col items-center justify-center px-4 pb-7 pt-5 md:px-8 md:pb-9 md:pt-6">
          <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl">
            <BannerHeroSequence
              label="Centro de Conocimiento"
              compact
              compactProminent
            />
          </div>

          <div className="mt-2 w-full max-w-2xl text-center md:mt-3">
            <BannerHeroBlurReveal delay={footerDelays.kicker}>
              <div className="flex items-center justify-center gap-3 md:gap-5">
                <span
                  className="h-0 w-6 shrink-0 border-t border-white/80 md:w-10"
                  aria-hidden
                />
                <h1 className="text-base font-bold uppercase tracking-[0.16em] text-white md:text-2xl md:tracking-[0.18em]">
                  {kicker}
                </h1>
                <span
                  className="h-0 w-6 shrink-0 border-t border-white/80 md:w-10"
                  aria-hidden
                />
              </div>
              {titulo ? (
                <p className="mt-2 text-sm font-bold leading-snug text-white md:text-lg">
                  {titulo}
                </p>
              ) : null}
            </BannerHeroBlurReveal>

            <BannerHeroBlurReveal
              delay={footerDelays.divider}
              className="mx-auto mt-4 w-40 sm:w-52 md:mt-5 md:w-64"
            >
              <div className="h-px w-full bg-white/50" aria-hidden />
            </BannerHeroBlurReveal>

            <BannerHeroBlurReveal delay={footerDelays.descripcion}>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/85 md:mt-5 md:text-base">
                {descripcion}
              </p>
            </BannerHeroBlurReveal>
          </div>
        </div>
      </div>
    </section>
  );
}

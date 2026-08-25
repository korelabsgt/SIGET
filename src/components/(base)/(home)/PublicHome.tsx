"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { HeroVideoLayout, VideoPlayerOverlay } from "@/components/(base)/(home)/ConoceMasVideo";
import {
  ObservatorioHomeSections,
  ObservatorioFooterCurtain,
  FOOTER_SCROLL_SPACER_VH,
  FOOTER_SCROLL_SPACER_MOBILE_VH,
} from "@/components/(base)/(home)/ObservatorioHomeSections";
import { useUser } from "@/components/(base)/providers/UserProvider";

export function PublicHome() {
  const user = useUser();
  const [videoOpen, setVideoOpen] = useState(false);
  const { scrollY } = useScroll();
  const logoY = useTransform(scrollY, [0, 600], [0, -300]);
  const logoOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  const [footerRevealed, setFooterRevealed] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      const spacerVh =
        window.innerWidth < 768
          ? FOOTER_SCROLL_SPACER_MOBILE_VH
          : FOOTER_SCROLL_SPACER_VH;
      const footerPx = (spacerVh / 100) * window.innerHeight;
      setFooterRevealed(scrolled >= total - footerPx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const headerOffset = 0;

  return (
    <>
      <VideoPlayerOverlay open={videoOpen} onClose={() => setVideoOpen(false)} />
      <div className="relative flex w-full flex-col" style={{ zoom: 0.9 }}>

      {/* Hero desktop — imagen fija con cover */}
      <div
        aria-hidden
        className="fixed inset-0 z-10 hidden bg-cover bg-center md:block"
        style={{
          backgroundImage: "url('/trifinio/hero-background2.jpg')",
          opacity: footerRevealed ? 0 : 1,
          visibility: footerRevealed ? "hidden" : "visible",
          pointerEvents: footerRevealed ? "none" : undefined,
        }}
      />

      {/* Hero desktop — spacer + contenido con parallax */}
      <section className="relative z-10 hidden h-screen w-full shrink-0 md:block">
        <motion.div
          className="absolute inset-0 z-5 flex items-center justify-center px-4 pt-16 lg:px-8"
          style={{ y: logoY, opacity: logoOpacity }}
        >
          <div className="w-full max-w-5xl origin-center scale-[0.85] lg:scale-90">
            <HeroVideoLayout
              videoOpen={videoOpen}
              onOpen={() => setVideoOpen(true)}
            />
          </div>
        </motion.div>
      </section>

      {/* Contenido — móvil: hero + blanco en un solo bloque opaco bajo el header */}
      <div className="relative z-20 w-full shrink-0 md:bg-[#0a1628]">
      <section className="relative w-full shrink-0 overflow-hidden rounded-b-2xl bg-background shadow-[0_28px_80px_rgba(10,22,40,0.14)] dark:bg-background md:-mt-15 md:rounded-t-[3rem] md:rounded-b-[3rem]">
        {/* Móvil: imagen completa sin zoom, empieza bajo el header */}
        <div
          className="relative md:hidden -mt-0.5"
          style={{ paddingTop: headerOffset }}
        >
          <img
            src="/trifinio/hero-background2.jpg"
            alt="Plan Trifinio"
            className="w-full h-auto block"
          />
          <motion.div
            className="absolute inset-x-0 top-0 flex flex-col items-center px-4"
            style={{
              paddingTop: headerOffset + 8,
              y: logoY,
              opacity: logoOpacity,
            }}
          >
            <HeroVideoLayout
              videoOpen={videoOpen}
              onOpen={() => setVideoOpen(true)}
              mobile
            />
          </motion.div>
        </div>

        {/* Blanco — cubre todo hasta arriba en móvil (solapa el hero) */}
        <div className="relative -mt-8 overflow-hidden rounded-t-2xl rounded-b-2xl bg-background md:mt-0 md:rounded-none">
          <div className="pointer-events-none absolute inset-0 rounded-t-2xl rounded-b-2xl bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-60 dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] md:rounded-t-[3rem] md:rounded-b-[3rem]" />
          <div className="relative z-10 pt-0">
            <ObservatorioHomeSections />
          </div>
        </div>
      </section>
      </div>

      {/* Spacer: revela el footer fijo al llegar abajo */}
      <div
        className="hidden w-full shrink-0"
        style={{ height: `0vh`, zoom: 1 / 0.9 }}
        aria-hidden
      />
      <div
        className="hidden w-full shrink-0 bg-[#0a1628] md:block"
        style={{ height: `${FOOTER_SCROLL_SPACER_VH}vh`, zoom: 1 / 0.9 }}
        aria-hidden
      />

      <ObservatorioFooterCurtain revealed={footerRevealed} />
    </div>
    </>
  );
}

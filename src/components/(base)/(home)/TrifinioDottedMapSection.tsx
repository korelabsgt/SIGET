"use client";

import { motion } from "framer-motion";
import { DottedMap, type Marker } from "@/components/ui/dotted-map";

/** Centro aproximado de la región Trifinio */
const TRIFINIO_MARKER: Marker[] = [
  {
    lat: 14.15,
    lng: -89.05,
    size: 2.6,
  },
];

const TRIFINIO_MAP_CLIP_ID = "trifinio-map-logo-clip";

export function TrifinioDottedMapSection({
  title = "Observatorio Web",
  description = "El área de análisis del Observatorio Web de Plan Trifinio es la región Trifinio.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="flex w-full flex-col pt-40 pb-16 md:pt-48 md:pb-20 overflow-x-hidden">
      <div className="mx-auto max-w-6xl w-full px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="mb-6 pt-6 text-center md:pt-10"
        >
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-celeste-trifinio md:text-base">
            — Región Trifinio —
          </p>
          <h2 className="mt-4 text-3xl md:text-4xl font-black text-foreground leading-tight">
            {title}
          </h2>
          <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-celeste-trifinio" />
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground text-base md:text-lg leading-relaxed">
            {description}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.75, delay: 0.1 }}
        className="relative mt-2 w-full max-md:h-[500px] md:mt-6 md:aspect-[3.1/1] md:h-auto md:min-h-[255px] lg:min-h-[270px] overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0 z-10 hidden md:block bg-[radial-gradient(ellipse_at_center,transparent_50%,var(--background)_95%)] opacity-30" />

        {/* móvil: mapa más ancho + recorte lateral (sin scale que lo mandaba fuera) */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="size-full max-md:h-full max-md:w-[210%] max-md:max-w-none">
            <DottedMap
              pulse
              className="size-full"
              markers={TRIFINIO_MARKER}
              markerColor="#2c5f9b"
              dotColor="#64748b"
              dotRadius={0.24}
              renderMarkerOverlay={({ x, y, r }) => {
                const logoR = r * 1.75;
                const fontSize = r * 0.95;
                const label = "Plan Trifinio";
                const pillH = r * 1.55;
                const pillW = label.length * (fontSize * 0.55) + r * 1.3;
                const pillX = x + logoR + r * 0.5;
                const pillY = y - pillH / 2;

                return (
                  <g style={{ pointerEvents: "none" }}>
                    <clipPath id={TRIFINIO_MAP_CLIP_ID}>
                      <circle cx={x} cy={y} r={logoR} />
                    </clipPath>
                    <circle cx={x} cy={y} r={logoR + 0.22} fill="white" />
                    <image
                      href="/trifinio/logo.png"
                      x={x - logoR}
                      y={y - logoR}
                      width={logoR * 2}
                      height={logoR * 2}
                      preserveAspectRatio="xMidYMid meet"
                      clipPath={`url(#${TRIFINIO_MAP_CLIP_ID})`}
                    />
                    <rect
                      x={pillX}
                      y={pillY}
                      width={pillW}
                      height={pillH}
                      rx={pillH / 2}
                      fill="#2c5f9b"
                    />
                    <text
                      x={pillX + r * 0.55}
                      y={y + fontSize * 0.35}
                      fontSize={fontSize}
                      fill="white"
                      fontWeight={700}
                    >
                      {label}
                    </text>
                  </g>
                );
              }}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

import type { Microcuenca } from "./catalogos";

export type FotoMicrocuenca = {
  src: string;
  alt: string;
};

const COMUNIDAD_BASE: FotoMicrocuenca[] = [
  {
    src: "/paz-hidrica-ja/comunidad/01-campesinos-guatemala.jpg",
    alt: "Campesinos en un camino rural de Guatemala",
  },
  {
    src: "/paz-hidrica-ja/comunidad/02-tejedora-tzutujil.jpg",
    alt: "Tejedora tz'utujil trabajando en telar de cintura",
  },
  {
    src: "/paz-hidrica-ja/comunidad/03-mercado-solola.jpg",
    alt: "Comerciante en el mercado de Sololá",
  },
  {
    src: "/paz-hidrica-ja/comunidad/04-mujeres-mercado.jpg",
    alt: "Mujeres seleccionando ejotes en el mercado de Sololá",
  },
  {
    src: "/paz-hidrica-ja/comunidad/05-mercado-chichicastenango.jpg",
    alt: "Gente en el mercado de Chichicastenango",
  },
];

export const FOTOS_MICROCUENCA: Record<Microcuenca, FotoMicrocuenca[]> = {
  Muyurco: COMUNIDAD_BASE,
  "Río Taco": COMUNIDAD_BASE,
  Guaraquiche: COMUNIDAD_BASE,
  "Río Cayur": COMUNIDAD_BASE,
  "Quebrada Carcaj": COMUNIDAD_BASE,
};

export const FOTOS_NATURALEZA_SRCS = COMUNIDAD_BASE.map((foto) => foto.src);

export function fotosSeed(indice: number, cantidad = 3): string[] {
  const total = FOTOS_NATURALEZA_SRCS.length;
  if (total === 0) return [];
  return Array.from({ length: Math.min(cantidad, total) }, (_, i) => {
    return FOTOS_NATURALEZA_SRCS[(indice + i) % total];
  });
}

export function fotosComoGaleria(
  srcs: string[],
  fallback: FotoMicrocuenca[] = COMUNIDAD_BASE,
): FotoMicrocuenca[] {
  if (srcs.length === 0) return fallback;
  return srcs.map((src, i) => {
    const conocida = COMUNIDAD_BASE.find((foto) => foto.src === src);
    return conocida ?? { src, alt: `Fotografía ${i + 1}` };
  });
}

import {
  MAX_IMAGEN_BYTES,
  MEMORIA_IMAGEN_ASPECT,
} from "@/components/(base)/imgs/constants";

export const NOTICIA_MAX_IMAGEN_BYTES = MAX_IMAGEN_BYTES;
export const NOTICIA_MAX_IMAGEN_DIMENSION = 1920;

export const NOTICIA_SECCION_ASPECT = 1024 / 390;

export const NOTICIA_ASPECT_OPTIONS = [
  { id: "libre", label: "Libre", value: undefined },
  { id: "seccion", label: "Sección", value: NOTICIA_SECCION_ASPECT },
  { id: "memoria", label: "Memoria", value: MEMORIA_IMAGEN_ASPECT },
  { id: "16-9", label: "16:9", value: 16 / 9 },
  { id: "4-3", label: "4:3", value: 4 / 3 },
  { id: "1-1", label: "1:1", value: 1 },
  { id: "3-4", label: "3:4", value: 3 / 4 },
  { id: "9-16", label: "9:16", value: 9 / 16 },
] as const;

export type NoticiaAspectId = (typeof NOTICIA_ASPECT_OPTIONS)[number]["id"];

export function esNoticiaAspectId(value: string | null | undefined): value is NoticiaAspectId {
  if (!value) return false;
  return NOTICIA_ASPECT_OPTIONS.some((item) => item.id === value);
}

export function noticiaAspectValue(id: NoticiaAspectId): number | undefined {
  const option = NOTICIA_ASPECT_OPTIONS.find((item) => item.id === id);
  return option?.value;
}

export function noticiaCropBoxClass(aspectId: NoticiaAspectId): string {
  const base =
    "relative mx-auto w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 max-h-[min(52dvh,480px)]";
  switch (aspectId) {
    case "seccion":
      return `${base} aspect-[1024/390]`;
    case "9-16":
      return `${base} aspect-[9/16]`;
    case "3-4":
    case "memoria":
      return `${base} aspect-[3/4]`;
    case "1-1":
      return `${base} aspect-square`;
    case "4-3":
      return `${base} aspect-[4/3]`;
    case "16-9":
      return `${base} aspect-video`;
    case "libre":
      return `${base} aspect-[4/3]`;
    default:
      return `${base} aspect-video`;
  }
}

function generateWebpName(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.webp`;
}

const WEBP_QUALITY_MAX = 0.98;
const WEBP_QUALITY_MIN = 0.42;

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function scaledSize(
  width: number,
  height: number,
  maxDim: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxDim / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function encodeWebp(
  image: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo comprimir la imagen");
  ctx.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("Error al comprimir")),
      "image/webp",
      quality,
    );
  });

  return new File([blob], generateWebpName(), { type: "image/webp" });
}

async function encodeNearestUnderLimit(
  image: HTMLImageElement,
  width: number,
  height: number,
): Promise<File> {
  const high = await encodeWebp(image, width, height, WEBP_QUALITY_MAX);
  if (high.size <= NOTICIA_MAX_IMAGEN_BYTES) return high;

  let lo = WEBP_QUALITY_MIN;
  let hi = WEBP_QUALITY_MAX;
  let best: File | null = null;

  for (let i = 0; i < 8; i++) {
    const mid = (lo + hi) / 2;
    const candidate = await encodeWebp(image, width, height, mid);
    if (candidate.size <= NOTICIA_MAX_IMAGEN_BYTES) {
      best = candidate;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  if (best) return best;
  return encodeWebp(image, width, height, WEBP_QUALITY_MIN);
}

export async function compressNoticiaImagen(file: File): Promise<File> {
  const image = await loadImageFromFile(file);
  const maxDims = [
    NOTICIA_MAX_IMAGEN_DIMENSION,
    1100,
    960,
    820,
    720,
    640,
  ];

  for (const maxDim of maxDims) {
    const { width, height } = scaledSize(image.width, image.height, maxDim);
    const encoded = await encodeNearestUnderLimit(image, width, height);
    if (encoded.size <= NOTICIA_MAX_IMAGEN_BYTES) return encoded;
  }

  throw new Error(
    "No se pudo comprimir la foto por debajo de 200 KB. Prueba otra imagen.",
  );
}

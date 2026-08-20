/**
 * Paleta equilibrada para reportes: formal, clara y con familias de color bien separadas.
 * Sin índigo/morado (confunde con azul) ni verdes/teals repetidos en la misma vista.
 */

/** Celeste para Guatemalteco(a) */
export const GUATEMALTECO_CELESTE = "#38BDF8";

/** Gris neutro para «Sin especificar» */
export const SIN_ESPECIFICAR = "#94A3B8";

export const HEATMAP_RGB = "59, 130, 246";

/** Nacionalidad (excl. GT y sin especificar): azul, ámbar, tierra, rojo, pizarra */
const NAC_OTHERS = [
  "#3B82F6",
  "#D97706",
  "#78716C",
  "#DC2626",
  "#64748B",
  "#B45309",
];

/**
 * Perfil: tonos cálidos y neutros (sin azul ni verde).
 * Con 2 segmentos → pizarra + ámbar, muy distinguibles.
 */
const PERFIL = [
  "#64748B",
  "#D97706",
  "#DC2626",
  "#78716C",
  "#B45309",
  "#94A3B8",
];

/**
 * Indicador: frío + contraste cálido (sin morado ni teal).
 * Con 2 segmentos → azul + rojo, clásico institucional.
 */
const INDICADOR = [
  "#2563EB",
  "#DC2626",
  "#D97706",
  "#64748B",
  "#78716C",
  "#0891B2",
];

/** Barras: alterna familias (azul → ámbar → gris → rojo → tierra → cyan) */
export const BAR_COLORS = [
  "#3B82F6",
  "#D97706",
  "#64748B",
  "#DC2626",
  "#78716C",
  "#0891B2",
  "#2563EB",
  "#B45309",
  "#94A3B8",
  "#38BDF8",
];

export function isGuatemalteco(name: string): boolean {
  const n = name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  return n.includes("guatemalteco") || n.includes("guatemala");
}

export function nationalityColor(name: string, fallbackIndex: number): string {
  if (isGuatemalteco(name)) return GUATEMALTECO_CELESTE;
  if (/sin especificar/i.test(name)) return SIN_ESPECIFICAR;
  return NAC_OTHERS[fallbackIndex % NAC_OTHERS.length];
}

export function perfilColor(index: number): string {
  return PERFIL[index % PERFIL.length];
}

export function indicadorColor(index: number): string {
  return INDICADOR[index % INDICADOR.length];
}

export function softBarColor(index: number): string {
  return BAR_COLORS[index % BAR_COLORS.length];
}

export function nacPerfilBarColor(nacionalidadLabel: string, index: number): string {
  if (isGuatemalteco(nacionalidadLabel)) return GUATEMALTECO_CELESTE;
  return softBarColor(index);
}

export function chartColor(index: number): string {
  return softBarColor(index);
}

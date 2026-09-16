import type { Criticidad, Microcuenca, Municipio } from "./catalogos";

export type LatLng = [number, number];

export const CENTRO_CUENCA: LatLng = [14.78, -89.43];
export const ZOOM_CUENCA = 11;
export const ZOOM_DETALLE = 13;

export const MUNICIPIO_COORDS: Record<Municipio, LatLng> = {
  Camotán: [14.8206, -89.3722],
  Jocotán: [14.821, -89.3908],
  Olopa: [14.6922, -89.35],
  "San Juan Ermita": [14.7647, -89.4308],
  Chiquimula: [14.7997, -89.5436],
};

export const MICROCUENCA_COORDS: Record<
  Microcuenca,
  { centro: LatLng; radio: number }
> = {
  Muyurco: { centro: [14.838, -89.348], radio: 2300 },
  "Río Taco": { centro: [14.805, -89.408], radio: 2100 },
  Guaraquiche: { centro: [14.705, -89.338], radio: 2000 },
  "Río Cayur": { centro: [14.758, -89.452], radio: 2100 },
  "Quebrada Carcaj": { centro: [14.785, -89.538], radio: 2500 },
};

export type ZonaRecarga = {
  id: string;
  nombre: string;
  microcuenca: Microcuenca;
  centro: LatLng;
  radio: number;
};

export const ZONAS_RECARGA: ZonaRecarga[] = [
  {
    id: "rec-muyurco",
    nombre: "Zona de recarga El Guayabo",
    microcuenca: "Muyurco",
    centro: [14.846, -89.338],
    radio: 900,
  },
  {
    id: "rec-taco",
    nombre: "Zona de recarga Río Taco",
    microcuenca: "Río Taco",
    centro: [14.812, -89.398],
    radio: 850,
  },
  {
    id: "rec-guara",
    nombre: "Zona de recarga Guaraquiche",
    microcuenca: "Guaraquiche",
    centro: [14.712, -89.328],
    radio: 800,
  },
  {
    id: "rec-cayur",
    nombre: "Zona de recarga Río Cayur",
    microcuenca: "Río Cayur",
    centro: [14.765, -89.442],
    radio: 820,
  },
  {
    id: "rec-carcaj",
    nombre: "Zona de recarga Quebrada Carcaj",
    microcuenca: "Quebrada Carcaj",
    centro: [14.792, -89.528],
    radio: 950,
  },
];

export type NacimientoProtegido = {
  id: string;
  nombre: string;
  microcuenca: Microcuenca;
  posicion: LatLng;
};

export const NACIMIENTOS_PROTEGIDOS: NacimientoProtegido[] = [
  { id: "nac-01", nombre: "Nacimiento El Guayabo", microcuenca: "Muyurco", posicion: [14.849, -89.341] },
  { id: "nac-02", nombre: "Nacimiento Shalaguá", microcuenca: "Muyurco", posicion: [14.833, -89.355] },
  { id: "nac-03", nombre: "Nacimiento Taco", microcuenca: "Río Taco", posicion: [14.808, -89.401] },
  { id: "nac-04", nombre: "Nacimiento Las Flores", microcuenca: "Guaraquiche", posicion: [14.698, -89.332] },
  { id: "nac-05", nombre: "Nacimiento El Rodeo", microcuenca: "Río Cayur", posicion: [14.752, -89.448] },
  { id: "nac-06", nombre: "Nacimiento Carcaj", microcuenca: "Quebrada Carcaj", posicion: [14.788, -89.534] },
];

export const POLIGONO_CUENCA: LatLng[] = [
  [14.88, -89.45],
  [14.875, -89.36],
  [14.86, -89.3],
  [14.78, -89.29],
  [14.69, -89.3],
  [14.64, -89.35],
  [14.655, -89.48],
  [14.73, -89.58],
  [14.82, -89.57],
  [14.86, -89.52],
];

export const COLOR_ALERTA: Record<Criticidad, string> = {
  alerta_verde: "#2DD4A8",
  alerta_amarilla: "#F5B942",
  latente: "#FF9F7A",
  manifiesto: "#FF6B6B",
};

export function desplazarPunto(
  base: LatLng,
  indice: number,
  serie: number,
): LatLng {
  const angulo = indice * 2.15 + serie * 0.9;
  const d = 0.0034 + (indice % 3) * 0.0012;
  return [base[0] + Math.sin(angulo) * d, base[1] + Math.cos(angulo) * d];
}

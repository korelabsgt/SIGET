import {
  COMUNIDADES_MICROCUENCA,
  MICROCUENCA_MUNICIPIO,
  MICROCUENCAS,
  type Microcuenca,
} from "./catalogos";

export const FICHAS_MICROCUENCA: Record<
  Microcuenca,
  { descripcion: string; afluentes: string; recarga: string }
> = {
  Muyurco: {
    descripcion:
      "Microcuenca prioritaria de Camotán en la Cuenca del Río Grande. Concentra caseríos de ladera y sistemas comunitarios de agua.",
    afluentes: "Caudal reducido en canícula; nacimientos vigilados por el comité de agua.",
    recarga: "Ladera norte de El Guayabo y bosque de recarga de Shalaguá.",
  },
  "Río Taco": {
    descripcion:
      "Unidad hídrica de Jocotán con tomas comunitarias y presión sobre la zona de recarga alta.",
    afluentes: "Afluente principal con turbidez estacional y vigilancia de desechos.",
    recarga: "Franja alta de Aldea Taco y Pajcó, con nacimientos protegidos.",
  },
  Guaraquiche: {
    descripcion:
      "Microcuenca de Olopa con acuerdos de reforestación y ordenanza municipal de protección de recarga.",
    afluentes: "Quebradas de Las Flores con caudal irregular en verano.",
    recarga: "Ladera de Guaraquiche y bosque de El Amatillo.",
  },
  "Río Cayur": {
    descripcion:
      "Ámbito de San Juan Ermita con turnos de riego y coordinación del comité de microcuenca.",
    afluentes: "Río Cayur con tomas ribereñas y reglamento provisional de turnos.",
    recarga: "Bosque de recarga de Aldea El Rodeo y Chancó.",
  },
  "Quebrada Carcaj": {
    descripcion:
      "Microcuenca periurbana de Chiquimula, con presión de crecimiento y protección de nacimientos.",
    afluentes: "Quebrada Carcaj con tramos de contaminación por aguas residuales.",
    recarga: "Ladera de Santa Rosalía y nacimiento Carcaj.",
  },
};

export type SaberPublico = {
  id: string;
  titulo: string;
  categoria: "mediacion" | "ancestral" | "protocolo";
  autor: string;
  anio: number;
  pesoKb: number;
  resumen: string;
};

export const SABERES_PUBLICOS: SaberPublico[] = [
  {
    id: "sab-001",
    titulo: "Protocolo de mediación con pertinencia Maya Ch'orti'",
    categoria: "mediacion",
    autor: "Pluriversidad Maya Ch'orti' y mesas de concertación",
    anio: 2026,
    pesoKb: 186,
    resumen:
      "Guía de palabra circular, tiempos rituales y reserva de identidad para controversias hídricas.",
  },
  {
    id: "sab-002",
    titulo: "Acción Sin Daño en alertas de la Cuenca del Río Grande",
    categoria: "mediacion",
    autor: "Observatorio de Paz Hídrica Ja'",
    anio: 2026,
    pesoKb: 94,
    resumen:
      "Anonimización, códigos de seguimiento y derivación a OMAS, UGAM y comités comunitarios.",
  },
  {
    id: "sab-003",
    titulo: "Saberes del agua Ja' y calendario agrícola Ch'orti'",
    categoria: "ancestral",
    autor: "Pluriversidad Maya Ch'orti' · Instituto Upejkna'r E Ja'",
    anio: 2025,
    pesoKb: 142,
    resumen:
      "Lectura de canícula, nacimientos y prácticas de respeto al territorio hídrico.",
  },
  {
    id: "sab-004",
    titulo: "Pedagogía del agua Ja' para comités comunitarios",
    categoria: "ancestral",
    autor: "Instituto Upejkna'r E Ja'",
    anio: 2026,
    pesoKb: 118,
    resumen:
      "Material de formación breve para redes móviles: glifo Ja', cuenca y corresponsabilidad.",
  },
  {
    id: "sab-005",
    titulo: "Protocolo de operación de comités comunitarios de agua",
    categoria: "protocolo",
    autor: "OMAS / UGAM · Comités de microcuenca",
    anio: 2026,
    pesoKb: 128,
    resumen:
      "Turnos, bitácora de caudal, asamblea y canalización de alertas a la municipalidad.",
  },
  {
    id: "sab-006",
    titulo: "Guía de cosecha y almacenamiento de agua de lluvia",
    categoria: "protocolo",
    autor: "Banco de innovación hídrica · PNUD / FAO",
    anio: 2025,
    pesoKb: 156,
    resumen:
      "Cisternas familiares, filtros y mantenimiento en caseríos de ladera.",
  },
];

export const CATEGORIA_SABER_LABEL: Record<SaberPublico["categoria"], string> = {
  mediacion: "Resolución pacífica",
  ancestral: "Saberes ancestrales",
  protocolo: "Comités y cosecha",
};

export type InformePublico = {
  id: string;
  titulo: string;
  periodo: string;
  pesoKb: number;
  resumen: string;
};

export const INFORMES_PUBLICOS: InformePublico[] = [
  {
    id: "inf-2026-1",
    titulo: "Informe público semestral I-2026",
    periodo: "Enero–junio 2026",
    pesoKb: 240,
    resumen:
      "Acuerdos, pilotos y confianza ciudadana en la Gestión de los Recursos Hídricos.",
  },
  {
    id: "inf-2025-2",
    titulo: "Informe público semestral II-2025",
    periodo: "Julio–diciembre 2025",
    pesoKb: 228,
    resumen: "Línea de base PBF y primeras mesas de concertación en cinco microcuencas.",
  },
];

export const CONFIANZA_LIKERT = [
  { name: "1", value: 4 },
  { name: "2", value: 8 },
  { name: "3", value: 22 },
  { name: "4", value: 31 },
  { name: "5", value: 19 },
];

export function comunidadesDeMicrocuenca(microcuenca: Microcuenca): readonly string[] {
  return COMUNIDADES_MICROCUENCA[microcuenca];
}

export function fichaPublica(microcuenca: Microcuenca) {
  return {
    microcuenca,
    municipio: MICROCUENCA_MUNICIPIO[microcuenca],
    comunidades: COMUNIDADES_MICROCUENCA[microcuenca],
    ...FICHAS_MICROCUENCA[microcuenca],
  };
}

export const MICROCUENCAS_PUBLICAS = MICROCUENCAS;

export type ContactoDirectorio = {
  id: string;
  nombre: string;
  actor: string;
  municipio: string;
  telefono: string;
};

export const DIRECTORIO_PUBLICO: ContactoDirectorio[] = [
  { id: "dir-omas-camotan", nombre: "OMAS Camotán", actor: "OMAS", municipio: "Camotán", telefono: "50250123401" },
  { id: "dir-omas-jocotan", nombre: "OMAS Jocotán", actor: "OMAS", municipio: "Jocotán", telefono: "50250123402" },
  { id: "dir-omas-olopa", nombre: "OMAS Olopa", actor: "OMAS", municipio: "Olopa", telefono: "50250123403" },
  { id: "dir-omas-sje", nombre: "OMAS San Juan Ermita", actor: "OMAS", municipio: "San Juan Ermita", telefono: "50250123404" },
  { id: "dir-omas-chiq", nombre: "OMAS Chiquimula", actor: "OMAS", municipio: "Chiquimula", telefono: "50250123405" },
  { id: "dir-ugam-camotan", nombre: "UGAM Camotán", actor: "UGAM", municipio: "Camotán", telefono: "50258412011" },
  { id: "dir-ugam-jocotan", nombre: "UGAM Jocotán", actor: "UGAM", municipio: "Jocotán", telefono: "50258412012" },
  { id: "dir-ugam-olopa", nombre: "UGAM Olopa", actor: "UGAM", municipio: "Olopa", telefono: "50258412013" },
  { id: "dir-ugam-sje", nombre: "UGAM San Juan Ermita", actor: "UGAM", municipio: "San Juan Ermita", telefono: "50258412014" },
  { id: "dir-ugam-chiq", nombre: "UGAM Chiquimula", actor: "UGAM", municipio: "Chiquimula", telefono: "50258412015" },
  { id: "dir-cc-muyurco", nombre: "Comité de Agua Muyurco", actor: "Comité comunitario", municipio: "Camotán", telefono: "50241227801" },
  { id: "dir-cc-taco", nombre: "Comité de Agua Río Taco", actor: "Comité comunitario", municipio: "Jocotán", telefono: "50241227802" },
  { id: "dir-cc-guara", nombre: "Comité de Agua Guaraquiche", actor: "Comité comunitario", municipio: "Olopa", telefono: "50241227803" },
  { id: "dir-cc-cayur", nombre: "Comité de Agua Río Cayur", actor: "Comité comunitario", municipio: "San Juan Ermita", telefono: "50241227804" },
  { id: "dir-cc-carcaj", nombre: "Comité de Agua Quebrada Carcaj", actor: "Comité comunitario", municipio: "Chiquimula", telefono: "50241227805" },
];

export const MENSAJE_WHATSAPP_JA =
  "Hola, escribo desde el Espacio ciudadano Ja' de la Cuenca del Río Grande.";

export function enlaceWhatsApp(telefono: string, mensaje = MENSAJE_WHATSAPP_JA): string {
  const digits = telefono.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(mensaje)}`;
}

export const AMBITO_CUENCA = "Cuenca del Río Grande" as const;
export const GESTION_RECURSOS_HIDRICOS = "Gestión de los Recursos Hídricos" as const;
export const TITULO_MODULO = "Observatorio de Paz Hídrica Ja' - SIGET" as const;

export const JA_PALETA = {
  sky: "#3B9EFF",
  mint: "#2DD4A8",
  gold: "#F5B942",
  coral: "#FF6B6B",
  violet: "#8B7CFF",
  peach: "#FF9F7A",
} as const;

export const JA_AZUL_GRAFICA = JA_PALETA.sky;

export const MUNICIPIOS = [
  "Camotán",
  "Jocotán",
  "Olopa",
  "San Juan Ermita",
  "Chiquimula",
] as const;

export type Municipio = (typeof MUNICIPIOS)[number];

export const MICROCUENCAS = [
  "Muyurco",
  "Río Taco",
  "Guaraquiche",
  "Río Cayur",
  "Quebrada Carcaj",
] as const;

export type Microcuenca = (typeof MICROCUENCAS)[number];

export const MICROCUENCA_MUNICIPIO: Record<Microcuenca, Municipio> = {
  Muyurco: "Camotán",
  "Río Taco": "Jocotán",
  Guaraquiche: "Olopa",
  "Río Cayur": "San Juan Ermita",
  "Quebrada Carcaj": "Chiquimula",
};

export const COMUNIDADES_MICROCUENCA: Record<Microcuenca, readonly string[]> = {
  Muyurco: ["Aldea El Guayabo", "Shalaguá", "Tisipe", "Lelá Chancó"],
  "Río Taco": ["Aldea Taco", "Pajcó", "Suchiquer", "Oquen"],
  Guaraquiche: ["Guaraquiche", "Caserío Las Flores", "El Amatillo", "Piedra de Cal"],
  "Río Cayur": ["Aldea El Rodeo", "Cayur", "Chancó", "El Barrial"],
  "Quebrada Carcaj": ["Carcaj", "Santa Rosalía", "El Barrio", "Shalaguá Chiquimula"],
};

export const TIPOLOGIAS = [
  "Déficit por canículas prolongadas",
  "Contaminación por desechos y aguas residuales",
  "Degradación de zona de recarga",
  "Actividades extractivas o productivas sin control",
  "Disputas intermunicipales o comunitarias",
] as const;

export type TipologiaTension = (typeof TIPOLOGIAS)[number];

export const CRITICIDADES = [
  "alerta_verde",
  "alerta_amarilla",
  "latente",
  "manifiesto",
] as const;

export type Criticidad = (typeof CRITICIDADES)[number];

export const CRITICIDAD_META: Record<
  Criticidad,
  { label: string; grupo: string; color: string; bg: string; ring: string }
> = {
  alerta_verde: {
    label: "Alerta temprana",
    grupo: "Alerta Temprana",
    color: "text-emerald-800 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-950/60",
    ring: "ring-emerald-400/50",
  },
  alerta_amarilla: {
    label: "Alerta temprana",
    grupo: "Alerta Temprana",
    color: "text-amber-800 dark:text-amber-300",
    bg: "bg-amber-100 dark:bg-amber-950/60",
    ring: "ring-amber-400/50",
  },
  latente: {
    label: "Conflicto latente",
    grupo: "Conflicto Latente",
    color: "text-orange-800 dark:text-orange-300",
    bg: "bg-orange-100 dark:bg-orange-950/60",
    ring: "ring-orange-400/50",
  },
  manifiesto: {
    label: "Conflicto manifiesto",
    grupo: "Conflicto Manifiesto",
    color: "text-red-800 dark:text-red-300",
    bg: "bg-red-100 dark:bg-red-950/60",
    ring: "ring-red-400/50",
  },
};

export const CRITICIDAD_SELECT_LABEL: Record<Criticidad, string> = {
  alerta_verde: "Alerta temprana — Verde",
  alerta_amarilla: "Alerta temprana — Amarillo",
  latente: "Conflicto latente — Naranja",
  manifiesto: "Conflicto manifiesto — Rojo",
};

export const CRITICIDAD_GRAFICA_LABEL: Record<Criticidad, string> = {
  alerta_verde: "Temprana",
  alerta_amarilla: "Preventiva",
  latente: "Latente",
  manifiesto: "Manifiesto",
};

export const DERIVACIONES = [
  "OMAS",
  "UGAM",
  "Comités Comunitarios de Agua",
] as const;

export type DerivacionInstitucional = (typeof DERIVACIONES)[number];

export const FASES_DIALOGO = [
  "preparatoria",
  "intercambio",
  "formal",
] as const;

export type FaseDialogo = (typeof FASES_DIALOGO)[number];

export const FASE_DIALOGO_LABEL: Record<FaseDialogo, string> = {
  preparatoria: "Fase preparatoria",
  intercambio: "Intercambio intrasectorial",
  formal: "Sesión formal instalada",
};

export const INSTITUCIONES_RESPONSABLES = [
  "MARN",
  "Alcaldía",
  "COCODE",
  "OMAS",
  "UGAM",
  "Comité Comunitario de Agua",
  "Plan Trifinio",
] as const;

export type InstitucionResponsable = (typeof INSTITUCIONES_RESPONSABLES)[number];

export const ESTADOS_ACUERDO = ["en_proceso", "cumplido", "incumplido"] as const;

export type EstadoAcuerdo = (typeof ESTADOS_ACUERDO)[number];

export const ESTADO_ACUERDO_LABEL: Record<EstadoAcuerdo, string> = {
  en_proceso: "En proceso",
  cumplido: "Cumplido",
  incumplido: "Incumplido",
};

export const AGENCIAS = ["PNUD", "FAO"] as const;

export type AgenciaCoejecutora = (typeof AGENCIAS)[number];

export const TIPOLOGIAS_PROYECTO = [
  "Cosecha de agua de lluvia",
  "Protección de nacimientos",
  "Sistemas de micro-riego",
  "Conservación forestal de recarga",
] as const;

export type TipologiaProyecto = (typeof TIPOLOGIAS_PROYECTO)[number];

export const ROLES_JA = [
  "admin_marn",
  "tecnico",
  "dialogo",
  "auditor",
] as const;

export type RolJa = (typeof ROLES_JA)[number];

export const ROL_JA_LABEL: Record<RolJa, string> = {
  admin_marn: "Administrador MARN/Trifinio",
  tecnico: "Técnico Evaluador (OMAS/UGAM)",
  dialogo: "Gestor de Diálogo",
  auditor: "Auditor PBF",
};

export const ETIQUETAS_SEGURIDAD = [
  "Pública",
  "Reservada",
  "Confidencial — Acción Sin Daño",
] as const;

export type EtiquetaSeguridad = (typeof ETIQUETAS_SEGURIDAD)[number];

export const INSTITUCIONES_ASIGNABLES_JA = [
  {
    id: "f4a8c2e1-6b3d-4f9a-9c1e-2d8b7a5f3e01",
    nombre: "OMAS Camotán",
    actor: "OMAS",
    municipio: "Camotán",
  },
  {
    id: "a9d3e7b2-1c4f-4a8e-8d2b-5e6f9a1c3d02",
    nombre: "OMAS Jocotán",
    actor: "OMAS",
    municipio: "Jocotán",
  },
  {
    id: "b2e6f1a8-3d7c-4b9f-9e4a-7c8d2f1a6b03",
    nombre: "OMAS Olopa",
    actor: "OMAS",
    municipio: "Olopa",
  },
  {
    id: "c5f9a2d4-8e1b-4c7a-9f3d-1a2b4e6c8d04",
    nombre: "OMAS San Juan Ermita",
    actor: "OMAS",
    municipio: "San Juan Ermita",
  },
  {
    id: "d8a1c4e7-2f6b-4d9a-8c5e-3b7d9f2a1e05",
    nombre: "OMAS Chiquimula",
    actor: "OMAS",
    municipio: "Chiquimula",
  },
  {
    id: "e1b4d7f0-5a9c-4e2b-9d6f-4c8e1a3b5f06",
    nombre: "UGAM Camotán",
    actor: "UGAM",
    municipio: "Camotán",
  },
  {
    id: "f4c7e0a3-8b2d-4f5c-9e8a-5d1f4b7c9a07",
    nombre: "UGAM Jocotán",
    actor: "UGAM",
    municipio: "Jocotán",
  },
  {
    id: "a7d0f3b6-1e5a-4b8d-8f1c-6e9a2d4f7b08",
    nombre: "UGAM Olopa",
    actor: "UGAM",
    municipio: "Olopa",
  },
  {
    id: "b0e3a6c9-4f8b-4c1e-9a4d-7f2b5e8a1c09",
    nombre: "UGAM San Juan Ermita",
    actor: "UGAM",
    municipio: "San Juan Ermita",
  },
  {
    id: "c3f6b9d2-7a1e-4d4b-8b7e-9a4c1f6d3e10",
    nombre: "Comité Comunitario de Agua Muyurco",
    actor: "Comités Comunitarios de Agua",
    municipio: "Camotán",
  },
  {
    id: "d6a9c2e5-0b4f-4e7c-8e1a-2d7f9b3c6f11",
    nombre: "Comité Comunitario de Agua Guaraquiche",
    actor: "Comités Comunitarios de Agua",
    municipio: "Jocotán",
  },
  {
    id: "e9c2f5a8-3c7b-4a0d-9d4e-5a8c1e4f7b12",
    nombre: "Comité Comunitario de Agua Río Cayur",
    actor: "Comités Comunitarios de Agua",
    municipio: "San Juan Ermita",
  },
  {
    id: "f2e5a8c1-6d0e-4b3a-8f7d-8b1e4a7c9d13",
    nombre: "Comité Comunitario de Agua Quebrada Carcaj",
    actor: "Comités Comunitarios de Agua",
    municipio: "Olopa",
  },
] as const;

export type InstitucionAsignableJa = (typeof INSTITUCIONES_ASIGNABLES_JA)[number];

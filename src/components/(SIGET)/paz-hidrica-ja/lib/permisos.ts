import type { RolJa } from "./catalogos";

export type AccionJa =
  | "incidentes.crear"
  | "incidentes.editar"
  | "incidentes.asignar"
  | "sesiones.crear"
  | "sesiones.editar"
  | "acuerdos.crear"
  | "acuerdos.editar"
  | "proyectos.editar"
  | "evidencias.exportar"
  | "identidad.ver"
  | "procesos.crear"
  | "procesos.quitar";

const MATRIZ: Record<RolJa, AccionJa[]> = {
  admin_marn: [
    "incidentes.crear",
    "incidentes.editar",
    "incidentes.asignar",
    "sesiones.crear",
    "sesiones.editar",
    "acuerdos.crear",
    "acuerdos.editar",
    "proyectos.editar",
    "evidencias.exportar",
    "identidad.ver",
    "procesos.crear",
    "procesos.quitar",
  ],
  tecnico: [
    "incidentes.crear",
    "incidentes.editar",
    "incidentes.asignar",
    "evidencias.exportar",
    "procesos.crear",
    "procesos.quitar",
  ],
  dialogo: [
    "sesiones.crear",
    "sesiones.editar",
    "acuerdos.crear",
    "acuerdos.editar",
    "procesos.crear",
    "procesos.quitar",
  ],
  auditor: ["evidencias.exportar"],
};

export function puede(rol: RolJa, accion: AccionJa): boolean {
  return MATRIZ[rol].includes(accion);
}

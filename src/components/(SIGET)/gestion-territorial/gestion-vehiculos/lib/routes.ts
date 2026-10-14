export const GV_BASE_ROUTE = "/siget/gestion-territorial/gestion-vehiculos";

export const GV_SECTION_QUERY_KEY = "seccion";

export const GV_MANTENIMIENTO_SECCION = "mantenimiento";

export function gestionVehiculosMantenimientoPathname(): string {
  return GV_BASE_ROUTE;
}

export function gestionVehiculosMantenimientoSearch(): string {
  return `${GV_SECTION_QUERY_KEY}=${GV_MANTENIMIENTO_SECCION}`;
}

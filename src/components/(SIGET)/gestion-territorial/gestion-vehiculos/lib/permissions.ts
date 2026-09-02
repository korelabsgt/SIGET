export const FLOTA_MANAGE_ROLES = ["admin", "administrador-ot", "admin-ot"] as const;

export function normalizeRoleSlug(role: string): string {
  return role.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

export function isSuperRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return normalizeRoleSlug(role) === "super";
}

export function isAdministradorOtRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const slug = normalizeRoleSlug(role);
  if (slug === "administrador-ot" || slug === "admin-ot") return true;
  const compact = slug.replace(/-/g, "");
  return compact === "administradorot" || (slug.includes("administrador") && slug.endsWith("ot"));
}

export function canManageFlota(role: string | null | undefined): boolean {
  if (!role) return false;
  if (isSuperRole(role)) return true;
  const slug = normalizeRoleSlug(role);
  return slug === "admin" || isAdministradorOtRole(role);
}

export function canDeleteVehiculoFotos(role: string | null | undefined): boolean {
  return canManageFlota(role);
}

export function canManageSolicitudesVehiculos(role: string | null | undefined): boolean {
  if (!role) return false;
  if (isSuperRole(role)) return true;
  const slug = normalizeRoleSlug(role);
  return slug === "admin" || isAdministradorOtRole(role);
}

export function canAccessGestionTerritorial(role: string | null | undefined): boolean {
  if (!role) return false;
  if (isSuperRole(role)) return true;
  const slug = normalizeRoleSlug(role);
  return slug === "admin" || isAdministradorOtRole(role);
}

export function canViewAllSolicitudes(role: string | null | undefined): boolean {
  return canManageSolicitudesVehiculos(role);
}

export function canViewAllBitacoras(role: string | null | undefined): boolean {
  return canManageFlota(role);
}

export function canExportBitacoraReporte(role: string | null | undefined): boolean {
  return canManageFlota(role);
}

export function canManageMantenimiento(role: string | null | undefined): boolean {
  return canManageFlota(role);
}

export function canExportMantenimientoReporte(role: string | null | undefined): boolean {
  return canManageFlota(role);
}

export function canViewAllFallasMantenimiento(role: string | null | undefined): boolean {
  return canManageFlota(role);
}

export function canGestionarFallasMantenimiento(role: string | null | undefined): boolean {
  if (!role) return false;
  if (canManageFlota(role)) return true;
  const slug = normalizeRoleSlug(role);
  return slug === "taller" || slug === "mecanico";
}

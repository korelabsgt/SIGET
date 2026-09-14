import {
  isAdministradorOtRole,
  isSuperRole,
  normalizeRoleSlug,
} from "../../gestion-vehiculos/lib/permissions";

/** Debe coincidir con is_admin() en db/migrations/ot_combustible.sql (profiles.rol slug, no etiqueta UI). */
export function canManageCombustibleAdmin(role: string | null | undefined): boolean {
  if (!role) return false;
  if (isSuperRole(role)) return true;
  const slug = normalizeRoleSlug(role);
  return slug === "admin" || isAdministradorOtRole(role);
}

export function canCreateSolicitudCombustible(_role: string | null | undefined): boolean {
  return true;
}

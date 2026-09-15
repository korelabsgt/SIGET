import {
  isAdministradorOtRole,
  isSuperRole,
  normalizeRoleSlug,
} from "../../gestion-vehiculos/lib/permissions";

export function isAdminNormalRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return normalizeRoleSlug(role) === "admin";
}

/** Aprobar / rechazar solicitudes: super, admin central y administrador OT. */
export function canAprobarRechazarSolicitudCombustible(role: string | null | undefined): boolean {
  if (!role) return false;
  if (isSuperRole(role)) return true;
  return isAdminNormalRole(role) || isAdministradorOtRole(role);
}

/** Exportar requisición a Excel: super, admin central y administrador OT. */
export function canExportCombustibleExcel(role: string | null | undefined): boolean {
  if (!role) return false;
  if (isSuperRole(role)) return true;
  return isAdminNormalRole(role) || isAdministradorOtRole(role);
}

/** Ver pestaña y datos de vales (inventario): super, admin central y administrador OT. */
export function canViewValesCombustible(role: string | null | undefined): boolean {
  if (!role) return false;
  if (isSuperRole(role)) return true;
  return isAdminNormalRole(role) || isAdministradorOtRole(role);
}

/** Registrar lotes de vales (admin central y administrador OT). */
export function canManageValesCombustible(role: string | null | undefined): boolean {
  return canViewValesCombustible(role);
}

/** Eliminar lotes de vales: solo super. */
export function canDeleteValeCombustible(role: string | null | undefined): boolean {
  return isSuperRole(role);
}

/**
 * @deprecated Usar funciones específicas (aprobar, exportar, vales).
 * Mantenido para compatibilidad con checks amplios admin + OT.
 */
export function canManageCombustibleAdmin(role: string | null | undefined): boolean {
  return canAprobarRechazarSolicitudCombustible(role);
}

export function canCreateSolicitudCombustible(_role: string | null | undefined): boolean {
  return true;
}

export function canViewSolicitudesCombustible(_role: string | null | undefined): boolean {
  return true;
}

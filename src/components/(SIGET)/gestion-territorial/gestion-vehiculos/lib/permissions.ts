export const FLOTA_MANAGE_ROLES = ["admin", "administrador-ot", "admin-ot"] as const;

export function normalizeRoleSlug(role: string): string {
  return role
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[\s_]+/g, "-");
}

export function isSuperRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return normalizeRoleSlug(role) === "super";
}

export function roleFromAuthUser(user: {
  user_metadata?: Record<string, unknown>;
  role?: string;
}): string {
  const meta = user.user_metadata?.rol;
  if (typeof meta === "string" && meta.trim()) return meta.trim();
  if (user.role && user.role !== "authenticated") return user.role;
  return "user";
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

export function canDeleteVehiculo(role: string | null | undefined): boolean {
  return isSuperRole(role);
}

export function canDeleteVehiculoFotos(role: string | null | undefined): boolean {
  return isSuperRole(role);
}

export function canExportFlotaReporte(role: string | null | undefined): boolean {
  return canManageFlota(role);
}

export function canViewAlertasFlota(role: string | null | undefined): boolean {
  return canManageFlota(role);
}

export function canViewGvCampanaNotificaciones(role: string | null | undefined): boolean {
  return canViewAlertasFlota(role);
}

export function canManageSolicitudesVehiculos(role: string | null | undefined): boolean {
  if (!role) return false;
  if (isSuperRole(role)) return true;
  const slug = normalizeRoleSlug(role);
  return slug === "admin" || isAdministradorOtRole(role);
}

export function canAprobarRechazarSolicitudes(role: string | null | undefined): boolean {
  return canManageSolicitudesVehiculos(role);
}

export function canGestionarMisionPropiaSolicitud(role: string | null | undefined): boolean {
  if (isSuperRole(role)) return true;
  return !canManageSolicitudesVehiculos(role);
}

export function canGestionarMisionSolicitud(
  role: string | null | undefined,
  solicitudSolicitanteId: string,
  userId: string | null | undefined,
): boolean {
  if (isSuperRole(role)) return true;
  if (canManageSolicitudesVehiculos(role)) return false;
  return Boolean(userId && solicitudSolicitanteId === userId);
}

export function canSeeFlotaYCombustible(role: string | null | undefined): boolean {
  if (!role) return false;
  if (isSuperRole(role)) return true;

  const slug = normalizeRoleSlug(role);
  if (slug === "admin" || isAdministradorOtRole(role)) return true;
  if (slug === "user") return true;
  if (slug === "taller" || slug === "mecanico") return true;

  return false;
}

export function canAccessGestionTerritorial(role: string | null | undefined): boolean {
  return canSeeFlotaYCombustible(role);
}

export function canViewAllSolicitudes(role: string | null | undefined): boolean {
  return canManageSolicitudesVehiculos(role);
}

export function canViewAllBitacoras(role: string | null | undefined): boolean {
  return canManageFlota(role);
}

export function canViewBitacoraMetricas(role: string | null | undefined): boolean {
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
  if (!role) return false;
  if (isSuperRole(role) || canManageFlota(role)) return true;
  const slug = normalizeRoleSlug(role);
  return slug === "taller" || slug === "mecanico";
}

export function canGestionarFallasMantenimiento(role: string | null | undefined): boolean {
  if (!role) return false;
  if (canManageFlota(role)) return true;
  const slug = normalizeRoleSlug(role);
  return slug === "taller" || slug === "mecanico";
}


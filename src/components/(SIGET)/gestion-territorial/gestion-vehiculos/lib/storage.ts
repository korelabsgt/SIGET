export const VEHICULOS_STORAGE_BUCKET = "vehiculos";
export const VEHICULOS_SIGNED_URL_TTL_SEC = 3600;

export function isLocalImageSrc(value: string): boolean {
  return value.startsWith("blob:") || value.startsWith("data:");
}

export function normalizeVehiculoStoragePath(
  path: string | null | undefined,
): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed || isLocalImageSrc(trimmed)) return null;

  const bucket = VEHICULOS_STORAGE_BUCKET;
  const markers = [
    `/storage/v1/object/public/${bucket}/`,
    `/storage/v1/object/sign/${bucket}/`,
    `/storage/v1/object/authenticated/${bucket}/`,
  ];

  for (const marker of markers) {
    const idx = trimmed.indexOf(marker);
    if (idx >= 0) {
      const rest = trimmed.slice(idx + marker.length).split("?")[0] ?? "";
      return decodeURIComponent(rest).replace(/^\//, "") || null;
    }
  }

  const bucketPrefix = `${bucket}/`;
  if (trimmed.startsWith(bucketPrefix)) {
    return trimmed.slice(bucketPrefix.length);
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const pathname = new URL(trimmed).pathname;
      const needle = `/${bucket}/`;
      const pos = pathname.indexOf(needle);
      if (pos >= 0) {
        return decodeURIComponent(pathname.slice(pos + needle.length)).replace(/^\//, "") || null;
      }
    } catch {
      return null;
    }
    return null;
  }

  return trimmed.replace(/^\//, "") || null;
}

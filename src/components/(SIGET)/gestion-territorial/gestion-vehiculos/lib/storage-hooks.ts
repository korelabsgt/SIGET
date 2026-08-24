"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import {
  normalizeVehiculoStoragePath,
  VEHICULOS_SIGNED_URL_TTL_SEC,
  VEHICULOS_STORAGE_BUCKET,
} from "./storage";

export function useSignedStorageUrls(paths: string[]) {
  const cleaned = [
    ...new Set(
      paths
        .map((path) => normalizeVehiculoStoragePath(path))
        .filter((path): path is string => Boolean(path)),
    ),
  ];

  return useQuery({
    queryKey: ["vehiculos-storage-signed", cleaned],
    enabled: cleaned.length > 0,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from(VEHICULOS_STORAGE_BUCKET)
        .createSignedUrls(cleaned, VEHICULOS_SIGNED_URL_TTL_SEC);

      if (error) throw new Error(error.message);

      const map: Record<string, string> = {};
      for (let i = 0; i < cleaned.length; i += 1) {
        const item = data?.[i];
        if (item?.signedUrl && !item.error) {
          map[cleaned[i]] = item.signedUrl;
        }
      }
      return map;
    },
  });
}

export function resolveStorageDisplaySrc(
  path: string,
  signedMap: Record<string, string>,
): string {
  if (path.startsWith("blob:") || path.startsWith("data:")) return path;
  const key = normalizeVehiculoStoragePath(path);
  if (!key) return "";
  return signedMap[key] ?? "";
}

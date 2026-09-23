"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { canSeeFlotaYCombustible } from "./permissions";

export function useGvPermissionRole() {
  const { effectiveRole } = useUserContext();

  return useMemo(() => effectiveRole || "user", [effectiveRole]);
}

export function useRequireFlotaYCombustible() {
  const role = useGvPermissionRole();
  const router = useRouter();
  const allowed = canSeeFlotaYCombustible(role);

  useEffect(() => {
    if (!allowed) {
      router.replace("/siget/gestion-territorial");
    }
  }, [allowed, router]);

  return allowed;
}

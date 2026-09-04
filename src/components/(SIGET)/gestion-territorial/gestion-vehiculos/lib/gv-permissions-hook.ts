"use client";

import { useMemo } from "react";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { resolveGvRoleForPermissions } from "./permissions";

export function useGvPermissionRole() {
  const { realRole, effectiveRole } = useUserContext();

  return useMemo(
    () => resolveGvRoleForPermissions(realRole, effectiveRole),
    [realRole, effectiveRole],
  );
}

"use client";

import { useMemo } from "react";
import { useUserContext } from "@/components/(base)/providers/UserProvider";

export function useGvPermissionRole() {
  const { effectiveRole } = useUserContext();

  return useMemo(() => effectiveRole || "user", [effectiveRole]);
}

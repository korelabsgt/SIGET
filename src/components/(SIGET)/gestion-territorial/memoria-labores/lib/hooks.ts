"use client";

import { useQuery } from "@tanstack/react-query";
import { getAutofillInformeUsuario } from "./actions";

const AUTOFILL_INFORME_KEY = ["autofill-informe-usuario"];

export function useAutofillInformeUsuario(enabled: boolean) {
  return useQuery({
    queryKey: AUTOFILL_INFORME_KEY,
    queryFn: getAutofillInformeUsuario,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

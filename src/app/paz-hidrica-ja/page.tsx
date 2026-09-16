import { Suspense } from "react";
import type { Metadata } from "next";
import { PortalPublicoJa } from "@/components/(SIGET)/paz-hidrica-ja/publico/PortalPublicoJa";

export const metadata: Metadata = {
  title: "Espacio ciudadano Ja' · Gestión de los Recursos Hídricos",
  description:
    "Portal público del Observatorio de Paz Hídrica Ja' en la Cuenca del Río Grande.",
};

export default function Page() {
  return (
    <Suspense>
      <PortalPublicoJa />
    </Suspense>
  );
}

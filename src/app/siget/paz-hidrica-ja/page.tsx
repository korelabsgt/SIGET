import { Suspense } from "react";
import type { Metadata } from "next";
import { ObservatorioPazHidrica } from "@/components/(SIGET)/paz-hidrica-ja/ObservatorioPazHidrica";

export const metadata: Metadata = {
  title: "Observatorio de Paz Hídrica Ja' - SIGET",
  description:
    "Gestión de los Recursos Hídricos en la Cuenca del Río Grande.",
};

export default function Page() {
  return (
    <Suspense>
      <ObservatorioPazHidrica />
    </Suspense>
  );
}

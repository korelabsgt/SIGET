import { Suspense } from "react";
import { VehiculosPanel } from "@/components/(SIGET)/gestion-territorial/gestion-vehiculos/flota/VehiculosPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestión de Flota Vehicular - SIGET",
  description: "Catálogo y gestión de flota vehicular de SIGET",
};

export default function VehiculosPage() {
  return (
    <Suspense>
      <VehiculosPanel />
    </Suspense>
  );
}

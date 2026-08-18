import { Suspense } from "react";
import { BitacorasPanel } from "@/components/(SIGET)/gestion-territorial/gestion-vehiculos/bitacoras/BitacorasPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bitácora Digital - SIGET",
  description: "Registro de viajes y control operativo de vehículos",
};

export default function BitacorasPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Cargando módulo de bitácoras...</div>}>
      <BitacorasPanel />
    </Suspense>
  );
}

import { Suspense } from "react";
import { SolicitudesPanel } from "@/components/(SIGET)/gestion-territorial/gestion-vehiculos/solicitudes/SolicitudesPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solicitudes de Vehículos - SIGET",
  description: "Reserva de flota vehicular de SIGET",
};

export default function SolicitudesPage() {
  return (
    <Suspense>
      <SolicitudesPanel />
    </Suspense>
  );
}

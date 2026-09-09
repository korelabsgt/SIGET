import { Suspense } from "react";
import { SolicitudCombustiblePanel } from "@/components/(SIGET)/gestion-territorial/solicitud-combustible/SolicitudCombustiblePanel";

export default function SolicitudCombustiblePage() {
  return (
    <Suspense>
      <SolicitudCombustiblePanel />
    </Suspense>
  );
}

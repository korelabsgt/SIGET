import { Suspense } from "react";
import { ConocimientoCatalogo } from "@/components/(SIGET)/repositorio/ConocimientoCatalogo";

export default function ConocimientoPage() {
  return (
    <Suspense>
      <ConocimientoCatalogo />
    </Suspense>
  );
}

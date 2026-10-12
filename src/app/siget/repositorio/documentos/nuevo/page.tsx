import { Suspense } from "react";
import { RepositorioCrear } from "@/components/(SIGET)/repositorio/forms/Crear";

export default function RepositorioDocumentosNuevoPage() {
  return (
    <Suspense>
      <RepositorioCrear />
    </Suspense>
  );
}

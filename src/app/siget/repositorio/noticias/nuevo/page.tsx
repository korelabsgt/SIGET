import { Suspense } from "react";
import { CrearNoticia } from "@/components/(SIGET)/repositorio/forms/CrearNoticia";

export default function RepositorioNoticiasNuevoPage() {
  return (
    <Suspense>
      <CrearNoticia />
    </Suspense>
  );
}

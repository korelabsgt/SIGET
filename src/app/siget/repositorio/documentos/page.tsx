import { Suspense } from "react";
import { RepositorioBandeja } from "@/components/(SIGET)/repositorio/RepositorioBandeja";

export default function RepositorioDocumentosPage() {
  return (
    <Suspense>
      <RepositorioBandeja modo="documentos" />
    </Suspense>
  );
}

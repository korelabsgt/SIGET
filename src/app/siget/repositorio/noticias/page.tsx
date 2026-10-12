import { Suspense } from "react";
import { RepositorioBandeja } from "@/components/(SIGET)/repositorio/RepositorioBandeja";

export default function RepositorioNoticiasPage() {
  return (
    <Suspense>
      <RepositorioBandeja modo="noticias" />
    </Suspense>
  );
}

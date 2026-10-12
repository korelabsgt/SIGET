import { Suspense } from "react";
import { RepositorioInicio } from "@/components/(SIGET)/repositorio/RepositorioInicio";

export default function RepositorioPage() {
  return (
    <Suspense>
      <RepositorioInicio />
    </Suspense>
  );
}

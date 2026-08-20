import { Suspense } from "react";
import { MemoriaLaboresPanel } from "@/components/(SIGET)/gestion-territorial/memoria-labores/MemoriaLaboresPanel";

export default function MemoriaLaboresPage() {
  return (
    <Suspense>
      <MemoriaLaboresPanel />
    </Suspense>
  );
}

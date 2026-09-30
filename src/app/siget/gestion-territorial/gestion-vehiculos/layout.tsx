import { GestionVehiculosShell } from "@/components/(SIGET)/gestion-territorial/gestion-vehiculos/GestionVehiculosShell";

export default function GestionVehiculosLayout({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col lg:h-0 lg:overflow-hidden">
      <GestionVehiculosShell />
    </div>
  );
}


import { GestionVehiculosShell } from "@/components/(SIGET)/gestion-territorial/gestion-vehiculos/GestionVehiculosShell";

export default function GestionVehiculosLayout({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full min-h-0 flex-1 flex-col">
      <GestionVehiculosShell />
    </div>
  );
}


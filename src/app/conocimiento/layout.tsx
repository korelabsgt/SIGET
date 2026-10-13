import { ConocimientoPaginaShell } from "@/components/(SIGET)/repositorio/ConocimientoPaginaShell";

export default function ConocimientoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConocimientoPaginaShell>{children}</ConocimientoPaginaShell>;
}

import { PUBLIC_CANAL_SLUGS } from "@/components/(SIGET)/repositorio/lib/zod";

export const dynamicParams = false;

export function generateStaticParams() {
  return PUBLIC_CANAL_SLUGS.map((canal) => ({ canal }));
}

export default function ConocimientoCanalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

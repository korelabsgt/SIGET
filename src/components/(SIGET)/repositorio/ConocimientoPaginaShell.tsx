"use client";

import { usePathname } from "next/navigation";
import {
  ObservatorioFooterCurtain,
  FOOTER_SCROLL_SPACER_VH,
  useFooterCurtainReveal,
} from "@/components/(base)/(home)/ObservatorioHomeSections";
import { ConocimientoFondoModerno } from "./ConocimientoFondoModerno";

export function ConocimientoPaginaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const esHome = pathname === "/conocimiento";

  const footerRevealed = useFooterCurtainReveal(!esHome);

  if (esHome) {
    return children;
  }

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col">
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <ConocimientoFondoModerno />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
      <div
        className="hidden w-full shrink-0 bg-[#0a1628] md:block"
        style={{ height: `${FOOTER_SCROLL_SPACER_VH}vh` }}
        aria-hidden
      />
      <ObservatorioFooterCurtain
        revealed={footerRevealed}
        variant="conocimiento"
        compensateParentZoom={false}
      />
    </div>
  );
}

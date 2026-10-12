"use client";

import { useRouter } from "next/navigation";
import { ArrowDownToLine, Download, Eye } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { registerDownloadAction } from "./lib/actions";

export function ConocimientoDetalleAcciones({
  slug,
  nombre,
  puedeVer,
  visorHref,
  rawHref,
}: {
  slug: string;
  nombre: string;
  puedeVer: boolean;
  visorHref: string;
  rawHref: string;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
      <p className="min-w-0 truncate text-sm font-medium text-foreground">{nombre}</p>
      <div className="flex gap-2">
        {puedeVer ? (
          <SigetActionButton
            label="Leer"
            accentColor={sigetAccent.abrir}
            morphFrom={Eye}
            morphTo={Eye}
            morphOnHover={false}
            onClick={() => router.push(visorHref)}
            className="w-auto shrink-0"
          />
        ) : null}
        <SigetActionButton
          label="Descargar"
          accentColor={sigetAccent.excel}
          morphFrom={ArrowDownToLine}
          morphTo={Download}
          onClick={() => {
            void registerDownloadAction(slug);
            const a = document.createElement("a");
            a.href = rawHref;
            a.download = nombre;
            a.rel = "noopener";
            document.body.appendChild(a);
            a.click();
            a.remove();
          }}
          className="w-auto shrink-0"
        />
      </div>
    </div>
  );
}

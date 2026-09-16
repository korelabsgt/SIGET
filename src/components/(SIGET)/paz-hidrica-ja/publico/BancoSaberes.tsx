"use client";

import { useMemo, useState } from "react";
import { Download, FileText } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { toast } from "@/components/ui/general-modal";
import {
  CATEGORIA_SABER_LABEL,
  SABERES_PUBLICOS,
  type SaberPublico,
} from "../lib/publico-mock";
import { descargarSaber } from "../lib/publico-pdf";
import { JaPestanas, JaRecordCard } from "../lib/ui";

type Filtro = "todas" | SaberPublico["categoria"];

export function BancoSaberes() {
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const lista = useMemo(() => {
    if (filtro === "todas") return SABERES_PUBLICOS;
    return SABERES_PUBLICOS.filter((row) => row.categoria === filtro);
  }, [filtro]);

  return (
    <div className="space-y-4">
      <JaPestanas
        layoutId="ja-saberes-pub"
        value={filtro}
        onChange={setFiltro}
        items={[
          { id: "todas", label: "Todas", count: SABERES_PUBLICOS.length },
          {
            id: "mediacion",
            label: CATEGORIA_SABER_LABEL.mediacion,
            count: SABERES_PUBLICOS.filter((r) => r.categoria === "mediacion").length,
          },
          {
            id: "ancestral",
            label: CATEGORIA_SABER_LABEL.ancestral,
            count: SABERES_PUBLICOS.filter((r) => r.categoria === "ancestral").length,
          },
          {
            id: "protocolo",
            label: CATEGORIA_SABER_LABEL.protocolo,
            count: SABERES_PUBLICOS.filter((r) => r.categoria === "protocolo").length,
          },
        ]}
      />

      <div className="grid gap-3 md:grid-cols-2">
        {lista.map((row) => (
          <JaRecordCard
            key={row.id}
            kicker={CATEGORIA_SABER_LABEL[row.categoria]}
            title={row.titulo}
            meta={`${row.autor} · ${row.anio}`}
          >
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{row.resumen}</p>
            <div className="mt-auto flex items-center justify-between gap-2 pt-4">
              <p className="text-xs font-bold text-zinc-500">{row.pesoKb} KB</p>
              <SigetActionButton
                label="Bajar"
                accentColor={sigetAccent.excel}
                morphFrom={FileText}
                morphTo={Download}
                onClick={() => {
                  descargarSaber(row);
                  toast.success("Guía descargada.");
                }}
                ariaLabel={`Descargar ${row.titulo}`}
                className="w-auto shrink-0"
              />
            </div>
          </JaRecordCard>
        ))}
      </div>
    </div>
  );
}

"use client";

import { Download, FileText } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { toast } from "@/components/ui/general-modal";
import { ESTADO_ACUERDO_LABEL, JA_PALETA } from "../lib/catalogos";
import { porcentaje } from "../lib/helpers";
import { CONFIANZA_LIKERT, INFORMES_PUBLICOS } from "../lib/publico-mock";
import { descargarInforme } from "../lib/publico-pdf";
import { JaBarras, JaDonut, JaKpiStrip, JaRecordCard } from "../lib/ui";
import type { AcuerdoRecord, IncidenteRecord } from "../lib/zod";

export function TableroTransparencia({
  acuerdos,
  incidentes,
}: {
  acuerdos: AcuerdoRecord[];
  incidentes: IncidenteRecord[];
}) {
  const atendidas = incidentes.length;
  const suscritos = acuerdos.length;
  const cumplidos = acuerdos.filter((a) => a.estado === "cumplido").length;
  const pct = porcentaje(cumplidos, suscritos);
  const donaEstados = (["cumplido", "en_proceso", "incumplido"] as const).map((estado) => ({
    name: ESTADO_ACUERDO_LABEL[estado],
    value: acuerdos.filter((a) => a.estado === estado).length,
    color:
      estado === "cumplido"
        ? JA_PALETA.mint
        : estado === "en_proceso"
          ? JA_PALETA.gold
          : JA_PALETA.coral,
  }));

  return (
    <div className="space-y-4">
      <JaKpiStrip
        items={[
          {
            label: "Controversias atendidas",
            value: String(atendidas),
            hint: "Canalizadas de forma pacífica en la cuenca",
          },
          {
            label: "Acuerdos suscritos",
            value: String(suscritos),
            hint: `${pct}% de cumplimiento formal`,
          },
          {
            label: "Cumplidos",
            value: String(cumplidos),
            hint: "Bitácora pública de compromisos",
          },
        ]}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <JaDonut title="Cumplimiento de acuerdos" data={donaEstados} centro="Acuerdos" />
        <JaBarras
          title="Confianza ciudadana (Likert 1–5)"
          data={CONFIANZA_LIKERT}
          series={[{ key: "value", color: JA_PALETA.sky }]}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {INFORMES_PUBLICOS.map((row) => (
          <JaRecordCard key={row.id} kicker={row.periodo} title={row.titulo} meta={`${row.pesoKb} KB`}>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{row.resumen}</p>
            <div className="mt-auto pt-4">
              <SigetActionButton
                label="Informe"
                accentColor={sigetAccent.excel}
                morphFrom={FileText}
                morphTo={Download}
                onClick={() => {
                  descargarInforme(row);
                  toast.success("Informe público descargado.");
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

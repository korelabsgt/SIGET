"use client";

import { formatoQ } from "../lib/helpers";
import { JaRecordCard } from "../lib/ui";
import type { ProyectoRecord } from "../lib/zod";

export function ProyectosDemostrativos({ proyectos }: { proyectos: ProyectoRecord[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {proyectos.map((row) => {
        const mujeres = Math.round(row.representatividad_comunitaria * 0.46);
        const jovenes = Math.round(row.representatividad_comunitaria * 0.32);
        const autoridades = Math.max(
          0,
          row.representatividad_comunitaria - mujeres - jovenes,
        );
        return (
          <JaRecordCard
            key={row.id}
            kicker={`${row.agencia} · ${row.tipologia}`}
            title={row.nombre}
            meta={`${row.comunidad} · ${row.municipio}`}
          >
            <p className="text-xs font-bold text-zinc-500">
              Inversión {formatoQ(row.presupuesto_ejecutado)} de {formatoQ(row.presupuesto_total)}
            </p>
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs font-bold">
                <span className="text-zinc-500">Avance físico</span>
                <span className="text-[#003882] dark:text-[#6f9fd4]">{row.avance_fisico}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-[#003882]"
                  style={{ width: `${row.avance_fisico}%` }}
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-zinc-50 px-2 py-2 dark:bg-zinc-800">
                <p className="text-lg font-black text-[#003882] dark:text-[#6f9fd4]">{mujeres}%</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                  Mujeres
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-50 px-2 py-2 dark:bg-zinc-800">
                <p className="text-lg font-black text-[#1B5E20]">{jovenes}%</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                  Jóvenes
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-50 px-2 py-2 dark:bg-zinc-800">
                <p className="text-lg font-black text-[#C59B27]">{autoridades}%</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                  Autoridades
                </p>
              </div>
            </div>
          </JaRecordCard>
        );
      })}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Pencil, SquarePen } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import {
  AGENCIAS,
  JA_PALETA,
  TIPOLOGIAS_PROYECTO,
} from "./lib/catalogos";
import { formatoQ, porcentaje } from "./lib/helpers";
import { puede } from "./lib/permisos";
import {
  JaBarras,
  JaDonut,
  JaKpiStrip,
  JaRecordCard,
  JaTable,
  JaTd,
  JaTh,
} from "./lib/ui";
import type { ProyectoRecord, RolJaPersistido } from "./lib/zod";
import { VerEditarProyecto } from "./forms/VerEditarProyecto";

const COLOR_TIPO: Record<string, string> = {
  "Cosecha de agua de lluvia": JA_PALETA.sky,
  "Protección de nacimientos": JA_PALETA.violet,
  "Sistemas de micro-riego": JA_PALETA.mint,
  "Conservación forestal de recarga": JA_PALETA.gold,
};

export function BancoInnovacion({
  proyectos,
  rol,
}: {
  proyectos: ProyectoRecord[];
  rol: RolJaPersistido;
}) {
  const [editar, setEditar] = useState<ProyectoRecord | null>(null);

  const kpis = useMemo(() => {
    const avance =
      proyectos.length === 0
        ? 0
        : Math.round(
            proyectos.reduce((acc, p) => acc + p.avance_fisico, 0) / proyectos.length,
          );
    const ejecutado = proyectos.reduce((acc, p) => acc + p.presupuesto_ejecutado, 0);
    const total = proyectos.reduce((acc, p) => acc + p.presupuesto_total, 0);
    const impacto =
      proyectos.length === 0
        ? 0
        : Math.round(
            (proyectos.reduce((acc, p) => acc + p.impacto_medios_vida, 0) /
              proyectos.length) *
              10,
          ) / 10;
    return { avance, ejecutado, total, impacto };
  }, [proyectos]);

  const donaAgencia = AGENCIAS.map((agencia) => ({
    name: agencia,
    value: proyectos.filter((p) => p.agencia === agencia).length,
    color: agencia === "PNUD" ? JA_PALETA.sky : JA_PALETA.mint,
  }));

  const donaTipo = TIPOLOGIAS_PROYECTO.map((tip) => ({
    name: tip,
    value: proyectos.filter((p) => p.tipologia === tip).length,
    color: COLOR_TIPO[tip],
  }));

  const barrasAvance = proyectos.map((p) => ({
    name: p.comunidad,
    Avance: p.avance_fisico,
  }));

  return (
    <section className="flex flex-col gap-10">
      <JaKpiStrip
        items={[
          { label: "Avance medio", value: `${kpis.avance}%` },
          { label: "Ejecutado", value: formatoQ(kpis.ejecutado) },
          { label: "Presupuesto", value: formatoQ(kpis.total) },
          { label: "Medios de vida", value: `${kpis.impacto}/5` },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <JaDonut title="Proyectos por agencia" data={donaAgencia} centro="Fichas" />
        <JaDonut title="Tipología técnica" data={donaTipo} centro="Pilotos" />
        <JaBarras
          title="Avance físico por comunidad"
          data={barrasAvance}
          series={[{ key: "Avance", color: JA_PALETA.sky }]}
        />
      </div>

      <JaTable title="Matriz de auditoría de proyectos">
        <thead>
          <tr>
            <JaTh>Proyecto</JaTh>
            <JaTh>Agencia</JaTh>
            <JaTh>Microcuenca</JaTh>
            <JaTh>Avance</JaTh>
            <JaTh>Ejecutado</JaTh>
            <JaTh>Medios de vida</JaTh>
            <JaTh>Innovación</JaTh>
            <JaTh />
          </tr>
        </thead>
        <tbody>
          {proyectos.map((p) => (
            <tr key={p.id}>
              <JaTd className="font-bold">{p.nombre}</JaTd>
              <JaTd>{p.agencia}</JaTd>
              <JaTd>{p.microcuenca}</JaTd>
              <JaTd className="font-mono font-black">{p.avance_fisico}%</JaTd>
              <JaTd className="font-mono text-xs">
                {formatoQ(p.presupuesto_ejecutado)}
              </JaTd>
              <JaTd className="font-mono">{p.impacto_medios_vida}/5</JaTd>
              <JaTd className="font-mono">{p.innovacion_climatica}/5</JaTd>
              <JaTd>
                {puede(rol, "proyectos.editar") ? (
                  <SigetActionButton
                    label="Editar"
                    accentColor={sigetAccent.editar}
                    morphFrom={Pencil}
                    morphTo={SquarePen}
                    onClick={() => setEditar(p)}
                    className="w-auto shrink-0"
                  />
                ) : null}
              </JaTd>
            </tr>
          ))}
        </tbody>
      </JaTable>

      <div className="grid gap-3 md:grid-cols-2">
        {proyectos.map((proyecto) => {
          const pctPresupuesto = porcentaje(
            proyecto.presupuesto_ejecutado,
            proyecto.presupuesto_total,
          );
          return (
            <JaRecordCard
              key={proyecto.id}
              kicker={`${proyecto.agencia} · ${proyecto.tipologia}`}
              title={proyecto.nombre}
              meta={`${proyecto.comunidad} · ${proyecto.microcuenca} · ${proyecto.municipio}`}
              tone={COLOR_TIPO[proyecto.tipologia] ?? JA_PALETA.sky}
              fotos={proyecto.fotos}
            >
              <Barra label="Avance físico" valor={proyecto.avance_fisico} color={JA_PALETA.sky} />
              <Barra label="Presupuesto" valor={pctPresupuesto} color={JA_PALETA.mint} />
              <Barra
                label="Representatividad comunitaria"
                valor={proyecto.representatividad_comunitaria}
                color={JA_PALETA.gold}
              />
              <p className="mt-3 font-mono text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                Medios de vida {proyecto.impacto_medios_vida}/5 · Innovación{" "}
                {proyecto.innovacion_climatica}/5
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {formatoQ(proyecto.presupuesto_ejecutado)} de {formatoQ(proyecto.presupuesto_total)}
              </p>
              {puede(rol, "proyectos.editar") ? (
                <div className="mt-4">
                  <SigetActionButton
                    label="Editar"
                    accentColor={sigetAccent.editar}
                    morphFrom={Pencil}
                    morphTo={SquarePen}
                    onClick={() => setEditar(proyecto)}
                    className="w-auto shrink-0"
                  />
                </div>
              ) : null}
            </JaRecordCard>
          );
        })}
      </div>

      <VerEditarProyecto
        open={Boolean(editar)}
        onOpenChange={(open) => {
          if (!open) setEditar(null);
        }}
        registro={editar}
      />
    </section>
  );
}

function Barra({
  label,
  valor,
  color,
}: {
  label: string;
  valor: number;
  color: string;
}) {
  return (
    <div className="mt-2">
      <div className="mb-1 flex justify-between text-[11px] font-bold text-zinc-500">
        <span>{label}</span>
        <span className="font-mono">{valor}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className="h-full rounded-full" style={{ width: `${valor}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { MICROCUENCAS, JA_PALETA } from "./lib/catalogos";
import { filtroTexto, porcentaje } from "./lib/helpers";
import {
  JaBarras,
  JaDonut,
  JaKpiStrip,
  JaRecordCard,
  JaSelect,
  JaTable,
  JaTd,
  JaTh,
} from "./lib/ui";
import type { MetodologiaRecord, OrganizacionAliadaRecord } from "./lib/zod";

const COLOR_TIPO: Record<string, string> = {
  Guía: JA_PALETA.sky,
  "Protocolo de mediación": JA_PALETA.mint,
  "Estudio de caso": JA_PALETA.gold,
};

export function RedesInclusivas({
  metodologias,
  organizaciones,
}: {
  metodologias: MetodologiaRecord[];
  organizaciones: OrganizacionAliadaRecord[];
}) {
  const [tipo, setTipo] = useState<string>("todas");
  const [q, setQ] = useState("");

  const tipos = useMemo(
    () => ["todas", ...Array.from(new Set(metodologias.map((m) => m.tipo)))],
    [metodologias],
  );

  const guias = useMemo(
    () =>
      metodologias.filter((m) => {
        const tipoOk = tipo === "todas" || m.tipo === tipo;
        return tipoOk && filtroTexto(`${m.titulo} ${m.resumen} ${m.pertinencia}`, q);
      }),
    [metodologias, q, tipo],
  );

  const liderazgo = useMemo(() => {
    const mujeres = organizaciones.reduce((acc, o) => acc + o.mujeres_liderazgo, 0);
    const juventudes = organizaciones.reduce((acc, o) => acc + o.juventudes_liderazgo, 0);
    const total = mujeres + juventudes;
    return {
      mujeres,
      juventudes,
      total,
      pctMujeres: porcentaje(mujeres, total),
      pctJuventudes: porcentaje(juventudes, total),
    };
  }, [organizaciones]);

  const donaLiderazgo = [
    { name: "Mujeres", value: liderazgo.mujeres, color: JA_PALETA.mint },
    { name: "Juventudes", value: liderazgo.juventudes, color: JA_PALETA.gold },
  ];

  const donaTipos = Object.keys(COLOR_TIPO).map((nombre) => ({
    name: nombre,
    value: metodologias.filter((m) => m.tipo === nombre).length,
    color: COLOR_TIPO[nombre],
  }));

  const barrasOrgs = organizaciones.map((org) => ({
    name: org.nombre.split(" ").slice(0, 2).join(" "),
    Mujeres: org.mujeres_liderazgo,
    Juventudes: org.juventudes_liderazgo,
  }));

  return (
    <section className="flex flex-col gap-10">
      <JaKpiStrip
        items={[
          { label: "Mujeres", value: `${liderazgo.pctMujeres}%`, hint: `${liderazgo.mujeres} liderazgos` },
          { label: "Juventudes", value: `${liderazgo.pctJuventudes}%`, hint: `${liderazgo.juventudes} liderazgos` },
          { label: "Saberes", value: String(guias.length), hint: "Metodologías visibles" },
          { label: "Aliadas", value: String(organizaciones.length), hint: "Organizaciones" },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <JaDonut title="Liderazgo en decisión" data={donaLiderazgo} centro="Personas" />
        <JaDonut title="Banco de saberes" data={donaTipos} centro="Guías" />
        <JaBarras
          title="Liderazgo por organización"
          data={barrasOrgs}
          series={[
            { key: "Mujeres", color: JA_PALETA.mint },
            { key: "Juventudes", color: JA_PALETA.gold },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <JaSelect
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="w-auto min-w-52"
        >
          {tipos.map((item) => (
            <option key={item} value={item}>
              {item === "todas" ? "Todas las metodologías" : item}
            </option>
          ))}
        </JaSelect>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrar saberes"
          className="h-10 rounded-lg border border-zinc-200/80 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <JaTable title="Banco de metodologías y saberes">
        <thead>
          <tr>
            <JaTh>Título</JaTh>
            <JaTh>Tipo</JaTh>
            <JaTh>Pertinencia</JaTh>
            <JaTh>Microcuenca</JaTh>
          </tr>
        </thead>
        <tbody>
          {guias.map((guia) => (
            <tr key={guia.id}>
              <JaTd className="font-bold">{guia.titulo}</JaTd>
              <JaTd>{guia.tipo}</JaTd>
              <JaTd className="text-xs">{guia.pertinencia}</JaTd>
              <JaTd>{guia.microcuenca ?? "Cuenca del Río Grande"}</JaTd>
            </tr>
          ))}
        </tbody>
      </JaTable>

      <div className="grid gap-3 md:grid-cols-2">
        {guias.map((guia) => (
          <JaRecordCard
            key={guia.id}
            kicker={guia.tipo}
            title={guia.titulo}
            meta={guia.microcuenca ? `${guia.pertinencia} · ${guia.microcuenca}` : guia.pertinencia}
            tone={COLOR_TIPO[guia.tipo] ?? JA_PALETA.sky}
            fotos={guia.fotos}
          >
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{guia.resumen}</p>
          </JaRecordCard>
        ))}
      </div>

      <JaTable title="Directorio de articulación comunitaria">
        <thead>
          <tr>
            <JaTh>Organización</JaTh>
            <JaTh>Tipo</JaTh>
            <JaTh>Municipio</JaTh>
            <JaTh>Mujeres</JaTh>
            <JaTh>Juventudes</JaTh>
            <JaTh>Contacto</JaTh>
          </tr>
        </thead>
        <tbody>
          {organizaciones.map((org) => (
            <tr key={org.id}>
              <JaTd className="font-bold">{org.nombre}</JaTd>
              <JaTd>{org.tipo}</JaTd>
              <JaTd>{org.municipio}</JaTd>
              <JaTd className="font-mono font-black">{org.mujeres_liderazgo}</JaTd>
              <JaTd className="font-mono font-black">{org.juventudes_liderazgo}</JaTd>
              <JaTd className="text-xs">{org.contacto}</JaTd>
            </tr>
          ))}
        </tbody>
      </JaTable>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {organizaciones.map((org) => (
          <JaRecordCard
            key={org.id}
            kicker={org.tipo}
            title={org.nombre}
            meta={org.municipio}
            tone="jade"
            fotos={org.fotos}
          >
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{org.descripcion}</p>
            <p className="mt-3 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
              {org.mujeres_liderazgo} mujeres · {org.juventudes_liderazgo} juventudes
            </p>
          </JaRecordCard>
        ))}
      </div>

      <p className="text-xs text-zinc-500">
        Microcuencas de referencia: {MICROCUENCAS.join(", ")}.
      </p>
    </section>
  );
}

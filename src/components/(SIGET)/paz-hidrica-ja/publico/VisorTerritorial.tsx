"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Eye, EyeOff } from "lucide";
import {
  ModalShell,
  ModalForm,
  ModalField,
  ModalLabel,
  ModalFooter,
  ModalCancelButton,
} from "@/components/ui/general-modal";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import {
  MICROCUENCAS,
  MUNICIPIOS,
  type Microcuenca,
  type Municipio,
} from "../lib/catalogos";
import { fichaPublica } from "../lib/publico-mock";
import { formatoQ } from "../lib/helpers";
import { JaSelect } from "../lib/ui";
import { JA_MAP_VISTA_DEFAULT, type JaMapVista } from "../lib/map-tiles";
import { JaMapBasemapSwitches } from "../JaMapBasemapSwitches";
import { JaMapLeyenda } from "../JaMapLeyenda";
import type { IncidenteRecord, ProyectoRecord, SesionRecord } from "../lib/zod";
import { PubMarco } from "./ui";
import { VisorDetallePanel } from "./VisorDetallePanel";

const JaMapaPublico = dynamic(
  () => import("../JaMapaPublico").then((m) => m.JaMapaPublico),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-72 w-full items-center justify-center rounded-[1.25rem] bg-white text-sm font-semibold text-[#003882] dark:bg-zinc-900 dark:text-[#6f9fd4]">
        Cargando visor territorial…
      </div>
    ),
  },
);

export function VisorTerritorial({
  proyectos,
  sesiones,
  incidentes,
}: {
  proyectos: ProyectoRecord[];
  sesiones: SesionRecord[];
  incidentes: IncidenteRecord[];
}) {
  const [muni, setMuni] = useState<Municipio | "todos">("todos");
  const [micro, setMicro] = useState<Microcuenca | "todas">("todas");
  const [piloto, setPiloto] = useState<ProyectoRecord | null>(null);
  const [capaRecarga, setCapaRecarga] = useState(true);
  const [capaNacimientos, setCapaNacimientos] = useState(true);
  const [capaAlertas, setCapaAlertas] = useState(true);
  const [capaProyectos, setCapaProyectos] = useState(true);
  const [capaDialogo, setCapaDialogo] = useState(true);
  const [panelAmpliado, setPanelAmpliado] = useState(false);
  const [vistaMapa, setVistaMapa] = useState<JaMapVista>(JA_MAP_VISTA_DEFAULT);

  const microsOpcion = useMemo(() => {
    if (muni === "todos") return MICROCUENCAS;
    return MICROCUENCAS.filter((item) => {
      const ficha = fichaPublica(item);
      return ficha.municipio === muni;
    });
  }, [muni]);

  const coincideMuni = (municipio: Municipio) => muni === "todos" || municipio === muni;

  const proyectosMapa = useMemo(
    () => proyectos.filter((p) => coincideMuni(p.municipio)),
    [proyectos, muni],
  );
  const sesionesMapa = useMemo(
    () => sesiones.filter((s) => coincideMuni(s.municipio)),
    [sesiones, muni],
  );
  const incidentesMapa = useMemo(
    () => incidentes.filter((i) => coincideMuni(i.municipio)),
    [incidentes, muni],
  );
  const proyectosPanel =
    micro === "todas" ? [] : proyectosMapa.filter((p) => p.microcuenca === micro);

  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <PubMarco>
          <div className="flex flex-wrap items-end gap-3 px-5 py-4">
            <div className="min-w-40 flex-1">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#C59B27]">
                Municipio
              </p>
              <JaSelect
                value={muni}
                onChange={(e) => {
                  const next = e.target.value as Municipio | "todos";
                  setMuni(next);
                  setMicro("todas");
                  setPanelAmpliado(false);
                }}
                aria-label="Filtrar por municipio"
              >
                <option value="todos">Todos</option>
                {MUNICIPIOS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </JaSelect>
            </div>
            <div className="min-w-40 flex-1">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#C59B27]">
                Microcuenca
              </p>
              <JaSelect
                value={micro}
                onChange={(e) => {
                  const next = e.target.value as Microcuenca | "todas";
                  setMicro(next);
                  if (next === "todas") setPanelAmpliado(false);
                }}
                aria-label="Filtrar por microcuenca"
              >
                <option value="todas">Todas</option>
                {microsOpcion.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </JaSelect>
            </div>
            <SigetActionButton
              label="Recarga"
              accentColor={capaRecarga ? sigetAccent.activa : sigetAccent.inactiva}
              morphFrom={capaRecarga ? Eye : EyeOff}
              morphTo={capaRecarga ? EyeOff : Eye}
              onClick={() => setCapaRecarga((v) => !v)}
              ariaLabel="Alternar capa de recarga"
              className="w-auto shrink-0"
            />
            <SigetActionButton
              label="Alertas"
              accentColor={capaAlertas ? sigetAccent.activa : sigetAccent.inactiva}
              morphFrom={capaAlertas ? Eye : EyeOff}
              morphTo={capaAlertas ? EyeOff : Eye}
              onClick={() => setCapaAlertas((v) => !v)}
              ariaLabel="Alternar capa de incidentes"
              className="w-auto shrink-0"
            />
            <SigetActionButton
              label="Manantial"
              accentColor={capaNacimientos ? sigetAccent.activa : sigetAccent.inactiva}
              morphFrom={capaNacimientos ? Eye : EyeOff}
              morphTo={capaNacimientos ? EyeOff : Eye}
              onClick={() => setCapaNacimientos((v) => !v)}
              ariaLabel="Alternar capa de manantiales (nacimientos de agua)"
              className="w-auto shrink-0"
            />
            <SigetActionButton
              label="Pilotos"
              accentColor={capaProyectos ? sigetAccent.activa : sigetAccent.inactiva}
              morphFrom={capaProyectos ? Eye : EyeOff}
              morphTo={capaProyectos ? EyeOff : Eye}
              onClick={() => setCapaProyectos((v) => !v)}
              ariaLabel="Alternar capa de pilotos"
              className="w-auto shrink-0"
            />
            <SigetActionButton
              label="Diálogo"
              accentColor={capaDialogo ? sigetAccent.activa : sigetAccent.inactiva}
              morphFrom={capaDialogo ? Eye : EyeOff}
              morphTo={capaDialogo ? EyeOff : Eye}
              onClick={() => setCapaDialogo((v) => !v)}
              ariaLabel="Alternar capa de diálogo"
              className="w-auto shrink-0"
            />
          </div>
          <div className="flex justify-center px-5 pb-2">
            <JaMapBasemapSwitches
              vista={vistaMapa}
              onVistaChange={setVistaMapa}
            />
          </div>
          <p className="px-5 pb-3 text-center text-xs font-medium text-zinc-500">
            Clic en una microcuenca para abrir el panel. Sin denuncias ni nombres.
          </p>
        </PubMarco>
      </div>

      <div className="w-full px-3 md:px-4">
        <div className="relative mx-auto w-[85%]">
          <div className="w-full">
            <JaMapaPublico
              micro={micro}
              muni={muni}
              proyectos={proyectosMapa}
              sesiones={sesionesMapa}
              incidentes={incidentesMapa}
              capaRecarga={capaRecarga}
              capaNacimientos={capaNacimientos}
              capaProyectos={capaProyectos}
              capaDialogo={capaDialogo}
              capaAlertas={capaAlertas}
              vista={vistaMapa}
              layoutTick={0}
              onSelectMicro={setMicro}
              onSelectProyecto={setPiloto}
            />
          </div>
          <AnimatePresence>
            {micro !== "todas" ? (
              <VisorDetallePanel
                key={micro}
                microcuenca={micro}
                proyectos={proyectosPanel}
                ampliado={panelAmpliado}
                onAmpliar={() => setPanelAmpliado((v) => !v)}
                onCerrar={() => {
                  setPanelAmpliado(false);
                  setMicro("todas");
                }}
              />
            ) : null}
          </AnimatePresence>
          <JaMapLeyenda variante="publico" />
        </div>
      </div>

      <ModalShell
        open={Boolean(piloto)}
        onClose={() => setPiloto(null)}
        title={piloto?.nombre ?? "Piloto"}
        maxWidth="max-w-lg"
      >
        {piloto ? (
          <ModalForm
            onSubmit={(e) => {
              e.preventDefault();
              setPiloto(null);
            }}
          >
            <ModalField>
              <ModalLabel>Comunidad</ModalLabel>
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                {piloto.comunidad} · {piloto.municipio} · {piloto.microcuenca}
              </p>
            </ModalField>
            <ModalField>
              <ModalLabel>Tipología</ModalLabel>
              <p className="text-sm text-zinc-700 dark:text-zinc-200">{piloto.tipologia}</p>
            </ModalField>
            <ModalField>
              <ModalLabel>Cooperación</ModalLabel>
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                {piloto.agencia} · {formatoQ(piloto.presupuesto_total)}
              </p>
            </ModalField>
            <ModalField>
              <ModalLabel>Avance</ModalLabel>
              <p className="text-sm font-bold text-[#003882] dark:text-[#6f9fd4]">
                {piloto.avance_fisico}% físico
              </p>
            </ModalField>
            <ModalFooter>
              <ModalCancelButton onClick={() => setPiloto(null)} />
            </ModalFooter>
          </ModalForm>
        ) : null}
      </ModalShell>
    </div>
  );
}

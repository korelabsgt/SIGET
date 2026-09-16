"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Download, Eye, EyeOff, FileSpreadsheet } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { toast } from "@/components/ui/general-modal";
import { formatFechaCompactaGt } from "@/lib/fechas-gt";
import {
  AMBITO_CUENCA,
  CRITICIDADES,
  CRITICIDAD_GRAFICA_LABEL,
  DERIVACIONES,
  JA_PALETA,
  MICROCUENCAS,
  MUNICIPIOS,
  type Microcuenca,
  type Municipio,
} from "./lib/catalogos";
import { exportarEvidencias, exportarModuloPazHidricaJa } from "./lib/exportar";
import { COLOR_ALERTA } from "./lib/geo";
import { porcentaje, totalPoblacion } from "./lib/helpers";
import { puede } from "./lib/permisos";
import {
  JaBarras,
  JaDonut,
  JaKpiStrip,
  JaPanel,
  JaSelect,
  JaTable,
  JaTd,
  JaTh,
  SemaforoBadge,
} from "./lib/ui";
import { JaMapDetallePanel } from "./JaMapDetallePanel";
import type { JaStoreState, RolJaPersistido } from "./lib/zod";

const COLOR_DERIVACION: Record<string, string> = {
  OMAS: JA_PALETA.sky,
  UGAM: JA_PALETA.mint,
  "Comités Comunitarios de Agua": JA_PALETA.gold,
};

const JaLeafletMap = dynamic(
  () => import("./JaLeafletMap").then((m) => m.JaLeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-128 w-full items-center justify-center bg-sky-50 text-sm font-semibold text-sky-700 dark:bg-zinc-900 dark:text-sky-300 md:min-h-168">
        Cargando visor Leaflet…
      </div>
    ),
  },
);

export function GeografiaTablero({
  state,
  rol,
}: {
  state: JaStoreState;
  rol: RolJaPersistido;
}) {
  const [micro, setMicro] = useState<Microcuenca | "todas">("todas");
  const [muni, setMuni] = useState<Municipio | "todos">("todos");
  const [capaAlertas, setCapaAlertas] = useState(true);
  const [capaProyectos, setCapaProyectos] = useState(true);
  const [capaDialogo, setCapaDialogo] = useState(true);
  const [panelAmpliado, setPanelAmpliado] = useState(false);

  const coincide = (_microcuenca: Microcuenca, municipio: Municipio) => {
    return muni === "todos" || municipio === muni;
  };

  const coincideMuni = (municipio: Municipio) => muni === "todos" || municipio === muni;

  const incidentes = state.incidentes.filter((r) => coincide(r.microcuenca, r.municipio));
  const proyectos = state.proyectos.filter((r) => coincide(r.microcuenca, r.municipio));
  const sesiones = state.sesiones.filter((r) => coincide(r.microcuenca, r.municipio));

  const incidentesMapa = state.incidentes.filter((r) => coincideMuni(r.municipio));
  const proyectosMapa = state.proyectos.filter((r) => coincideMuni(r.municipio));
  const sesionesMapa = state.sesiones.filter((r) => coincideMuni(r.municipio));
  const acuerdos = state.acuerdos.filter((a) => {
    const inc = state.incidentes.find((i) => i.id === a.incidente_id);
    return inc ? coincide(inc.microcuenca, inc.municipio) : true;
  });

  const kpis = useMemo(() => {
    const gestionados = acuerdos.filter((a) => a.estado !== "incumplido").length;
    const pctPacificos = porcentaje(gestionados, Math.max(incidentes.length, 1));
    const confianza =
      acuerdos.length === 0
        ? 0
        : Math.round(
            (acuerdos.reduce((acc, a) => acc + a.efectividad, 0) / acuerdos.length) * 10,
          ) / 10;
    const manifiestos = incidentes.filter((r) => r.criticidad === "manifiesto").length;
    const latentes = incidentes.filter((r) => r.criticidad === "latente").length;
    const poblacion = incidentes.reduce((acc, r) => acc + totalPoblacion(r), 0);
    return {
      pctPacificos,
      confianza,
      manifiestos,
      latentes,
      poblacion,
      total: incidentes.length,
    };
  }, [acuerdos, incidentes]);

  const barras = MICROCUENCAS.map((nombre) => ({
    name: nombre,
    Incidentes: incidentes.filter((i) => i.microcuenca === nombre).length,
    Proyectos: proyectos.filter((p) => p.microcuenca === nombre).length,
    Diálogo: sesiones.filter((s) => s.microcuenca === nombre).length,
  }));

  const donaCriticidad = CRITICIDADES.map((c) => ({
    name: CRITICIDAD_GRAFICA_LABEL[c],
    value: incidentes.filter((i) => i.criticidad === c).length,
    color: COLOR_ALERTA[c],
  }));

  const donaDerivacion = DERIVACIONES.map((nombre) => ({
    name: nombre,
    value: incidentes.filter((i) => i.derivacion === nombre).length,
    color: COLOR_DERIVACION[nombre],
  }));

  const exportar = async (tipo: "reporte" | "evidencias") => {
    if (!puede(rol, "evidencias.exportar")) {
      toast.warn("Tu rol simulado no exporta evidencias.");
      return;
    }
    if (tipo === "reporte") {
      await exportarModuloPazHidricaJa(state);
      toast.success("Reporte Excel descargado.");
      return;
    }
    await exportarEvidencias(state);
    toast.success("Listado de evidencias descargado.");
  };

  return (
    <section className="flex flex-col gap-10">
      <JaKpiStrip
        items={[
          { label: "Incidentes", value: String(kpis.total), hint: "Bandeja filtrada" },
          { label: "Manifiestos", value: String(kpis.manifiestos), hint: "Prioridad roja" },
          { label: "Latentes", value: String(kpis.latentes), hint: "Seguimiento naranja" },
          { label: "Población", value: String(kpis.poblacion), hint: "Personas desagregadas" },
          { label: "Gestionados", value: `${kpis.pctPacificos}%`, hint: "Vía diálogo y acuerdos" },
          { label: "Confianza", value: `${kpis.confianza}/5`, hint: "Escala Likert" },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <JaSelect
          value={muni}
          onChange={(e) => setMuni(e.target.value as Municipio | "todos")}
          className="w-auto min-w-48 bg-white dark:bg-zinc-900"
        >
          <option value="todos">Todos los municipios</option>
          {MUNICIPIOS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </JaSelect>
        <SigetActionButton
          label="Alertas"
          accentColor={capaAlertas ? sigetAccent.activa : sigetAccent.inactiva}
          morphFrom={capaAlertas ? Eye : EyeOff}
          morphTo={capaAlertas ? EyeOff : Eye}
          onClick={() => setCapaAlertas((v) => !v)}
          ariaLabel="Alternar capa de alertas"
          className="w-auto shrink-0"
        />
        <SigetActionButton
          label="Pilotos"
          accentColor={capaProyectos ? sigetAccent.activa : sigetAccent.inactiva}
          morphFrom={capaProyectos ? Eye : EyeOff}
          morphTo={capaProyectos ? EyeOff : Eye}
          onClick={() => setCapaProyectos((v) => !v)}
          ariaLabel="Alternar capa de proyectos"
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

      <JaPanel title={`Visor geoespacial · ${AMBITO_CUENCA} · ${kpis.total} incidentes`} flush>
        <div className="relative p-3 md:p-4">
          <div className="w-full">
            <JaLeafletMap
              microSeleccionada={micro !== "todas" ? micro : null}
              muni={muni}
              incidentes={incidentesMapa}
              proyectos={proyectosMapa}
              sesiones={sesionesMapa}
              capaAlertas={capaAlertas}
              capaProyectos={capaProyectos}
              capaDialogo={capaDialogo}
              onSelectMicro={(nombre) => setMicro(nombre)}
            />
          </div>
          <AnimatePresence>
            {micro !== "todas" ? (
              <JaMapDetallePanel
                key={micro}
                microcuenca={micro}
                state={state}
                rol={rol}
                ampliado={panelAmpliado}
                onAmpliar={() => setPanelAmpliado((v) => !v)}
                onCerrar={() => {
                  setPanelAmpliado(false);
                  setMicro("todas");
                }}
              />
            ) : null}
          </AnimatePresence>
          <div className="pointer-events-none absolute bottom-7 left-7 z-1 max-w-[min(calc(100%-1.5rem),18rem)] rounded-2xl border border-zinc-200/80 bg-white px-3 py-2 text-[11px] font-medium text-zinc-600 opacity-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            <p className="font-semibold text-zinc-900 dark:text-white">
              Capas
            </p>
            <p>Círculos verdes: microcuencas. Clic para ver detalle.</p>
            <p>Puntos: incidentes. Cuadros dorados: pilotos. Triángulos: diálogo.</p>
          </div>
        </div>
      </JaPanel>

      <div className="grid gap-4 xl:grid-cols-3">
        <JaDonut title="Incidentes por criticidad" data={donaCriticidad} centro="Casos" />
        <JaDonut title="Derivación institucional" data={donaDerivacion} centro="Fichas" />
        <JaBarras
          title="Carga territorial por microcuenca"
          data={barras}
          series={[
            { key: "Incidentes", color: JA_PALETA.sky },
            { key: "Proyectos", color: JA_PALETA.gold },
            { key: "Diálogo", color: JA_PALETA.mint },
          ]}
        />
      </div>

      <JaTable title={`Incidentes en el territorio (${kpis.total})`}>
        <thead>
          <tr>
            <JaTh>Folio</JaTh>
            <JaTh>Fecha</JaTh>
            <JaTh>Criticidad</JaTh>
            <JaTh>Territorio</JaTh>
            <JaTh>Tipología</JaTh>
            <JaTh>Población</JaTh>
            <JaTh>Derivación</JaTh>
          </tr>
        </thead>
        <tbody>
          {incidentes.map((row) => (
            <tr key={row.id}>
              <JaTd className="font-mono text-xs font-bold">
                {row.confidencial ? row.id_anonimo : row.folio}
              </JaTd>
              <JaTd>{formatFechaCompactaGt(row.fecha)}</JaTd>
              <JaTd>
                <SemaforoBadge criticidad={row.criticidad} />
              </JaTd>
              <JaTd>
                {row.microcuenca}
                <span className="block text-xs text-zinc-500">{row.municipio}</span>
              </JaTd>
              <JaTd>{row.tipologia}</JaTd>
              <JaTd className="font-mono font-black">{totalPoblacion(row)}</JaTd>
              <JaTd>{row.derivacion}</JaTd>
            </tr>
          ))}
        </tbody>
      </JaTable>

      <JaTable title="Pilotos visibles en el recorte">
        <thead>
          <tr>
            <JaTh>Proyecto</JaTh>
            <JaTh>Agencia</JaTh>
            <JaTh>Microcuenca</JaTh>
            <JaTh>Avance</JaTh>
            <JaTh>Comunidad</JaTh>
          </tr>
        </thead>
        <tbody>
          {proyectos.map((row) => (
            <tr key={row.id}>
              <JaTd className="font-bold">{row.nombre}</JaTd>
              <JaTd>{row.agencia}</JaTd>
              <JaTd>{row.microcuenca}</JaTd>
              <JaTd className="font-mono font-black">{row.avance_fisico}%</JaTd>
              <JaTd>{row.comunidad}</JaTd>
            </tr>
          ))}
        </tbody>
      </JaTable>

      <JaTable
        title="Evidencias y auditoría"
        action={
          <div className="flex flex-wrap gap-2">
            <SigetActionButton
              label="Evidencias"
              accentColor={sigetAccent.excel}
              morphFrom={Download}
              morphTo={FileSpreadsheet}
              onClick={() => exportar("evidencias")}
              ariaLabel="Descargar evidencias"
              className="w-auto shrink-0"
            />
            <SigetActionButton
              label="Excel"
              accentColor={sigetAccent.excel}
              morphFrom={FileSpreadsheet}
              morphTo={Download}
              onClick={() => exportar("reporte")}
              ariaLabel="Descargar reporte Excel"
              className="w-auto shrink-0"
            />
          </div>
        }
      >
        <thead>
          <tr>
            <JaTh>Fecha</JaTh>
            <JaTh>Evidencia</JaTh>
            <JaTh>Tipo</JaTh>
            <JaTh>Seguridad</JaTh>
            <JaTh>Vínculo</JaTh>
          </tr>
        </thead>
        <tbody>
          {state.evidencias.map((row) => (
            <tr key={row.id}>
              <JaTd>{formatFechaCompactaGt(row.fecha)}</JaTd>
              <JaTd className="font-medium">{row.titulo}</JaTd>
              <JaTd>{row.tipo}</JaTd>
              <JaTd>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                    row.etiqueta.startsWith("Confidencial")
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                      : row.etiqueta === "Reservada"
                        ? "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200"
                        : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
                  }`}
                >
                  {row.etiqueta}
                </span>
              </JaTd>
              <JaTd className="text-xs">{row.vinculado}</JaTd>
            </tr>
          ))}
        </tbody>
      </JaTable>
    </section>
  );
}

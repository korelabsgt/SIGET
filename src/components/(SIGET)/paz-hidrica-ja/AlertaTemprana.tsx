"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatFechaCompactaGt } from "@/lib/fechas-gt";
import { ChevronLeft, ChevronRight, Pencil, Plus, Route, SquarePen } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import {
  CRITICIDADES,
  CRITICIDAD_GRAFICA_LABEL,
  CRITICIDAD_META,
  JA_AZUL_GRAFICA,
  MICROCUENCAS,
  type Criticidad,
} from "./lib/catalogos";
import { COLOR_ALERTA } from "./lib/geo";
import { totalPoblacion } from "./lib/helpers";
import { puede } from "./lib/permisos";
import {
  JaBarras,
  JaDonut,
  JaKpiStrip,
  JaPestanas,
  JaRecordCard,
  JaTable,
  JaTd,
  JaTh,
  SemaforoBadge,
} from "./lib/ui";
import type { IncidenteRecord, RolJaPersistido } from "./lib/zod";
import { CrearIncidente } from "./forms/CrearIncidente";
import { DerivarIncidente } from "./forms/DerivarIncidente";
import { VerEditarIncidente } from "./forms/VerEditarIncidente";

const CARDS_POR_PAGINA = 6;
const FILAS_POR_PAGINA = 8;

type SeccionBandeja = "todas" | Criticidad;

function paginar<T>(items: T[], pagina: number, tamano: number) {
  const total = Math.max(1, Math.ceil(items.length / tamano));
  const actual = Math.min(Math.max(pagina, 1), total);
  const inicio = (actual - 1) * tamano;
  return {
    actual,
    total,
    slice: items.slice(inicio, inicio + tamano),
  };
}

export function AlertaTemprana({
  incidentes,
  rol,
}: {
  incidentes: IncidenteRecord[];
  rol: RolJaPersistido;
}) {
  const [seccion, setSeccion] = useState<SeccionBandeja>("todas");
  const [paginaCards, setPaginaCards] = useState(1);
  const [paginaTabla, setPaginaTabla] = useState(1);
  const [crear, setCrear] = useState(false);
  const [editar, setEditar] = useState<IncidenteRecord | null>(null);
  const [asignar, setAsignar] = useState<IncidenteRecord | null>(null);

  useEffect(() => {
    setPaginaCards(1);
    setPaginaTabla(1);
  }, [incidentes]);

  const kpis = useMemo(() => {
    const total = incidentes.length;
    const manifiesto = incidentes.filter((r) => r.criticidad === "manifiesto").length;
    const confidenciales = incidentes.filter((r) => r.confidencial).length;
    const poblacion = incidentes.reduce((acc, r) => acc + totalPoblacion(r), 0);
    return { total, manifiesto, confidenciales, poblacion };
  }, [incidentes]);

  const dona = CRITICIDADES.map((c) => ({
    name: CRITICIDAD_GRAFICA_LABEL[c],
    value: incidentes.filter((r) => r.criticidad === c).length,
    color: COLOR_ALERTA[c],
  }));

  const barras = MICROCUENCAS.map((nombre) => ({
    name: nombre,
    Incidentes: incidentes.filter((r) => r.microcuenca === nombre).length,
  }));

  const seccionados = useMemo(
    () =>
      incidentes.filter((row) => (seccion === "todas" ? true : row.criticidad === seccion)),
    [incidentes, seccion],
  );

  const cards = paginar(seccionados, paginaCards, CARDS_POR_PAGINA);
  const filas = paginar(seccionados, paginaTabla, FILAS_POR_PAGINA);

  const cambiarSeccion = (valor: SeccionBandeja) => {
    setSeccion(valor);
    setPaginaCards(1);
    setPaginaTabla(1);
  };

  const conteoSeccion = (id: SeccionBandeja) =>
    id === "todas"
      ? incidentes.length
      : incidentes.filter((r) => r.criticidad === id).length;

  return (
    <section className="flex flex-col gap-10">
      <JaKpiStrip
        items={[
          { label: "Incidentes", value: String(kpis.total), hint: "Bandeja activa" },
          { label: "Manifiestos", value: String(kpis.manifiesto), hint: "Prioridad roja" },
          { label: "Reservados", value: String(kpis.confidenciales), hint: "Acción Sin Daño" },
          { label: "Población", value: String(kpis.poblacion), hint: "Personas desagregadas" },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <JaDonut title="Criticidad de la bandeja" data={dona} centro="Casos" />
        <JaBarras
          title="Incidentes por microcuenca"
          data={barras}
          series={[{ key: "Incidentes", color: JA_AZUL_GRAFICA }]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <JaPestanas
          value={seccion}
          onChange={cambiarSeccion}
          layoutId="ja-alerta-pestanas"
          items={[
            {
              id: "todas" as const,
              label: "Todas",
              count: conteoSeccion("todas"),
              bgClass: "bg-zinc-100 dark:bg-zinc-800",
              textClass: "text-zinc-800 dark:text-zinc-200",
            },
            ...CRITICIDADES.map((item) => ({
              id: item,
              label: CRITICIDAD_GRAFICA_LABEL[item],
              count: conteoSeccion(item),
              bgClass: CRITICIDAD_META[item].bg,
              textClass: CRITICIDAD_META[item].color,
            })),
          ]}
        />
        {puede(rol, "incidentes.crear") ? (
          <SigetActionButton
            label="Registrar"
            accentColor={sigetAccent.crear}
            morphFrom={Plus}
            morphTo={SquarePen}
            onClick={() => setCrear(true)}
            ariaLabel="Registrar tensión hídrica"
            className="ml-auto w-auto shrink-0"
          />
        ) : null}
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">
          Fichas · {seccionados.length} en esta sección
        </p>
        <AnimatePresence mode="popLayout" initial={false}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.slice.map((row) => (
              <motion.div
                key={row.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                className="min-h-0"
              >
                <JaRecordCard
                  kicker={row.confidencial ? (row.id_anonimo ?? row.folio) : row.folio}
                  title={row.tipologia}
                  meta={`${row.microcuenca} · ${row.municipio}`}
                  fecha={formatFechaCompactaGt(row.fecha)}
                  tone={COLOR_ALERTA[row.criticidad]}
                  fotos={row.fotos}
                >
                  <p className="line-clamp-3 min-h-15 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {row.descripcion}
                  </p>
                  <div className="mt-auto flex min-h-0 flex-1 items-end justify-between gap-3 pt-4">
                    <SemaforoBadge criticidad={row.criticidad} />
                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
                      {puede(rol, "incidentes.editar") ? (
                        <SigetActionButton
                          label="Editar"
                          accentColor={sigetAccent.editar}
                          morphFrom={Pencil}
                          morphTo={SquarePen}
                          onClick={() => setEditar(row)}
                          className="w-auto shrink-0"
                        />
                      ) : null}
                      {puede(rol, "incidentes.asignar") ? (
                        <SigetActionButton
                          label="Derivar"
                          accentColor={sigetAccent.enlace}
                          morphFrom={Route}
                          morphTo={Route}
                          onClick={() => setAsignar(row)}
                          className="w-auto shrink-0"
                        />
                      ) : null}
                    </div>
                  </div>
                </JaRecordCard>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
        {seccionados.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            No hay incidentes en esta sección.
          </p>
        ) : (
          <Paginador
            actual={cards.actual}
            total={cards.total}
            onAntes={() => setPaginaCards((n) => Math.max(1, n - 1))}
            onSiguiente={() => setPaginaCards((n) => Math.min(cards.total, n + 1))}
          />
        )}
      </div>

      <div>
        <JaTable title={`Bandeja · ${seccionados.length}`}>
          <thead>
            <tr>
              <JaTh>Folio</JaTh>
              <JaTh>Fecha</JaTh>
              <JaTh>Criticidad</JaTh>
              <JaTh>Territorio</JaTh>
              <JaTh>Tipología</JaTh>
              <JaTh>Población</JaTh>
              <JaTh>Derivación</JaTh>
              <JaTh />
            </tr>
          </thead>
          <tbody>
            {filas.slice.map((row) => (
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
                <JaTd className="font-mono font-semibold">{totalPoblacion(row)}</JaTd>
                <JaTd>{row.derivacion}</JaTd>
                <JaTd>
                  {puede(rol, "incidentes.editar") ? (
                    <SigetActionButton
                      label="Editar"
                      accentColor={sigetAccent.editar}
                      morphFrom={Pencil}
                      morphTo={SquarePen}
                      onClick={() => setEditar(row)}
                      className="w-auto shrink-0"
                    />
                  ) : null}
                </JaTd>
              </tr>
            ))}
          </tbody>
        </JaTable>
        {seccionados.length > 0 ? (
          <Paginador
            actual={filas.actual}
            total={filas.total}
            onAntes={() => setPaginaTabla((n) => Math.max(1, n - 1))}
            onSiguiente={() => setPaginaTabla((n) => Math.min(filas.total, n + 1))}
          />
        ) : null}
      </div>

      <CrearIncidente open={crear} onOpenChange={setCrear} />
      <VerEditarIncidente
        open={Boolean(editar)}
        onOpenChange={(open) => {
          if (!open) setEditar(null);
        }}
        registro={editar}
      />
      <DerivarIncidente
        open={Boolean(asignar)}
        onOpenChange={(open) => {
          if (!open) setAsignar(null);
        }}
        registro={asignar}
      />
    </section>
  );
}

function Paginador({
  actual,
  total,
  onAntes,
  onSiguiente,
}: {
  actual: number;
  total: number;
  onAntes: () => void;
  onSiguiente: () => void;
}) {
  if (total <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      <SigetActionButton
        label="Antes"
        iconOnly
        accentColor={sigetAccent.neutro}
        morphFrom={ChevronLeft}
        morphTo={ChevronLeft}
        morphOnHover={false}
        onClick={onAntes}
        disabled={actual <= 1}
        ariaLabel="Página anterior"
      />
      <span className="px-2 text-sm font-medium tabular-nums text-zinc-500">
        {actual}/{total}
      </span>
      <SigetActionButton
        label="Siguiente"
        iconOnly
        accentColor={sigetAccent.neutro}
        morphFrom={ChevronRight}
        morphTo={ChevronRight}
        morphOnHover={false}
        onClick={onSiguiente}
        disabled={actual >= total}
        ariaLabel="Página siguiente"
      />
    </div>
  );
}

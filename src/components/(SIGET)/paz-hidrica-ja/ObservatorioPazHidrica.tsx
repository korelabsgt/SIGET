"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  Droplet,
  Droplets,
  FolderKanban,
  FolderOpen,
  Globe,
  Globe2,
  Map,
  MapPinned,
  MessageSquare,
  MessagesSquare,
  Download,
  FileSpreadsheet,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  Users,
  UsersRound,
} from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { toast } from "@/components/ui/general-modal";
import { cn } from "@/lib/utils";
import { AlertaTemprana } from "./AlertaTemprana";
import { BancoInnovacion } from "./BancoInnovacion";
import { GeografiaTablero } from "./GeografiaTablero";
import { GlifoJaHeader } from "./GlifoJaHeader";
import { MesasConcertacion } from "./MesasConcertacion";
import { RedesInclusivas } from "./RedesInclusivas";
import {
  AMBITO_CUENCA,
  GESTION_RECURSOS_HIDRICOS,
  MICROCUENCAS,
  ROLES_JA,
  ROL_JA_LABEL,
  type Microcuenca,
  type RolJa,
} from "./lib/catalogos";
import { exportarModuloPazHidricaJa } from "./lib/exportar";
import { filtrarEstadoObservatorio } from "./lib/helpers";
import { useJaState, useReiniciarJa, useRolJa, useSetRolJa } from "./lib/hooks";
import { puede } from "./lib/permisos";
import { JaMesInput, JaSelect } from "./lib/ui";

const VISTAS = [
  { id: "alertas", label: "Alertas", from: ShieldAlert, to: Shield },
  { id: "mesas", label: "Mesas", from: MessageSquare, to: MessagesSquare },
  { id: "redes", label: "Redes", from: Users, to: UsersRound },
  { id: "pilotos", label: "Pilotos", from: FolderKanban, to: FolderOpen },
  { id: "tablero", label: "Tablero", from: MapPinned, to: Map },
] as const;

type VistaId = (typeof VISTAS)[number]["id"];

const TITULOS: Record<VistaId, string> = {
  alertas: "Sistema de alerta temprana y conflictividades hídricas",
  mesas: "Mesas de concertación y bitácora de acuerdos",
  redes: "Redes inclusivas e intercambio de conocimientos",
  pilotos: "Banco de innovación y proyectos piloto",
  tablero: "Geografía hidrográfica y rendición de cuentas PBF",
};

export function ObservatorioPazHidrica() {
  const router = useRouter();
  const { data: state, isLoading } = useJaState();
  const { data: rol = "admin_marn" } = useRolJa();
  const setRol = useSetRolJa();
  const reiniciar = useReiniciarJa();
  const [vista, setVista] = useState<VistaId>("alertas");
  const [colapsado, setColapsado] = useState(true);
  const [esMd, setEsMd] = useState(false);
  const [filtroMicro, setFiltroMicro] = useState<Microcuenca | "todas">("todas");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  const filtrado = useMemo(() => {
    if (!state) return null;
    return filtrarEstadoObservatorio(state, filtroMicro, filtroDesde, filtroHasta);
  }, [filtroDesde, filtroHasta, filtroMicro, state]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setEsMd(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const expandido = esMd ? !colapsado : true;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-100 dark:bg-zinc-800">
      <header className="relative overflow-hidden bg-[#003882] text-white">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] md:block">
          <Image
            src="/paz-hidrica-ja/comunidad/04-mujeres-mercado.jpg"
            alt=""
            fill
            sizes="42vw"
            className="object-cover object-center opacity-70"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-l from-transparent via-[#003882]/40 to-[#003882]" />
        </div>
        <div className="relative flex flex-col gap-4 px-4 py-6 md:px-6 md:py-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 md:gap-5">
            <GlifoJaHeader imageClassName="h-28 w-28 object-contain md:h-36 md:w-36" />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#C59B27]">
                {GESTION_RECURSOS_HIDRICOS}
              </p>
              <h1 className="mt-1.5 max-w-xl text-2xl font-black leading-[1.1] tracking-tight md:text-4xl">
                Observatorio de Paz Hídrica Ja&apos;
              </h1>
              <p className="mt-2 max-w-md text-sm font-medium text-sky-100/90">
                {AMBITO_CUENCA} · Camotán, Jocotán, Olopa, San Juan Ermita y Chiquimula
              </p>
            </div>
          </div>
          <div className="relative flex flex-wrap items-center gap-2">
            <JaSelect
              value={rol}
              onChange={(e) => {
                const next = e.target.value as RolJa;
                setRol.mutate(next);
                toast.success(`Rol simulado: ${ROL_JA_LABEL[next]}`);
              }}
              className="w-auto min-w-56 bg-white dark:bg-zinc-900"
              aria-label="Rol institucional simulado"
            >
              {ROLES_JA.map((item) => (
                <option key={item} value={item}>
                  {ROL_JA_LABEL[item]}
                </option>
              ))}
            </JaSelect>
            <SigetActionButton
              label="Público"
              accentColor={sigetAccent.abrir}
              morphFrom={Globe}
              morphTo={Globe2}
              onClick={() => router.push("/paz-hidrica-ja")}
              ariaLabel="Abrir portal público ciudadano"
              className="w-auto shrink-0"
            />
            <SigetActionButton
              label="Reiniciar"
              accentColor={sigetAccent.cancelar}
              morphFrom={RefreshCw}
              morphTo={RotateCcw}
              onClick={async () => {
                const res = await reiniciar.mutateAsync();
                if (res.success) {
                  toast.success("Datos de demostración restaurados.");
                  return;
                }
                toast.error("No se pudieron restaurar los datos.");
              }}
              ariaLabel="Restaurar datos de demostración"
              className="w-auto shrink-0"
            />
          </div>
        </div>
        <div className="h-1 bg-[#C59B27]" />
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "hidden shrink-0 border-r border-zinc-200 bg-zinc-100 transition-[width] duration-300 dark:border-zinc-800 dark:bg-zinc-800 md:flex md:flex-col",
            expandido ? "w-44" : "w-14",
          )}
        >
          <button
            type="button"
            onClick={() => setColapsado((v) => !v)}
            className="flex cursor-pointer items-center justify-center border-b border-zinc-200 py-3 text-[#003882] dark:border-zinc-700 dark:text-[#6f9fd4]"
            aria-label={expandido ? "Contraer menú" : "Expandir menú"}
          >
            <MorphHoverIcon
              from={Droplets}
              to={Droplet}
              size={20}
              color="currentColor"
              spring="snappy"
            />
          </button>
          {VISTAS.map((item) => {
            const activa = vista === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setVista(item.id)}
                className={cn(
                  "flex cursor-pointer items-center border-b border-zinc-200 px-3 py-3 text-sm font-bold transition-colors dark:border-zinc-700",
                  expandido ? "gap-2" : "justify-center px-0",
                  activa
                    ? "bg-white text-[#003882] dark:bg-zinc-900 dark:text-[#6f9fd4]"
                    : "text-zinc-500 hover:bg-white/70 dark:hover:bg-zinc-900/70",
                )}
                aria-label={item.label}
              >
                <MorphHoverIcon
                  from={item.from}
                  to={item.to}
                  size={18}
                  color="currentColor"
                  spring="snappy"
                />
                {expandido ? item.label : null}
              </button>
            );
          })}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-zinc-100 dark:bg-zinc-800">
          <nav className="flex gap-1 overflow-x-auto border-b border-zinc-200 bg-zinc-100 px-2 py-2 dark:border-zinc-800 dark:bg-zinc-800 md:hidden">
            {VISTAS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setVista(item.id)}
                className={cn(
                  "shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wide",
                  vista === item.id
                    ? "bg-[#003882] text-white"
                    : "bg-white text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300",
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto bg-zinc-100 px-4 py-5 dark:bg-zinc-800 md:px-6">
            <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900">
              <div className="bg-celeste-trifinio pt-1">
                <div className="overflow-hidden rounded-t-2xl bg-card dark:bg-zinc-900">
                  <div className="flex flex-col gap-3 border-b border-border px-4 py-3 dark:border-zinc-700">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
                          {TITULOS[vista]}
                        </h2>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Recorte de microcuenca y fechas para todas las vistas. El Excel usa el mismo recorte.
                        </p>
                      </div>
                      {puede(rol, "evidencias.exportar") ? (
                        <SigetActionButton
                          label="Excel"
                          accentColor={sigetAccent.excel}
                          morphFrom={FileSpreadsheet}
                          morphTo={Download}
                          onClick={async () => {
                            if (!filtrado) {
                              toast.warn("Aún no hay datos para exportar.");
                              return;
                            }
                            await exportarModuloPazHidricaJa(filtrado);
                            toast.success("Reporte Excel descargado.");
                          }}
                          ariaLabel="Descargar Excel"
                          className="w-auto shrink-0"
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <JaSelect
                        value={filtroMicro}
                        onChange={(e) =>
                          setFiltroMicro(e.target.value as Microcuenca | "todas")
                        }
                        className="w-auto min-w-48"
                        aria-label="Filtrar por microcuenca"
                      >
                        <option value="todas">Todas las microcuencas</option>
                        {MICROCUENCAS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </JaSelect>
                      <JaMesInput
                        id="ja-observatorio-desde"
                        label="Desde"
                        value={filtroDesde}
                        onChange={setFiltroDesde}
                      />
                      <JaMesInput
                        id="ja-observatorio-hasta"
                        label="Hasta"
                        value={filtroHasta}
                        onChange={setFiltroHasta}
                      />
                      {filtroDesde || filtroHasta ? (
                        <SigetActionButton
                          label="Todos"
                          accentColor={sigetAccent.cancelar}
                          morphFrom={RotateCcw}
                          morphTo={RefreshCw}
                          onClick={() => {
                            setFiltroDesde("");
                            setFiltroHasta("");
                          }}
                          ariaLabel="Restablecer fechas y mostrar todos"
                          className="w-auto shrink-0"
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isLoading || !filtrado ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-32 animate-pulse rounded-2xl bg-white dark:bg-zinc-900" />
                <div className="h-32 animate-pulse rounded-2xl bg-white dark:bg-zinc-900" />
              </div>
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={vista}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  {vista === "alertas" ? (
                    <AlertaTemprana incidentes={filtrado.incidentes} rol={rol} />
                  ) : null}
                  {vista === "mesas" ? (
                    <MesasConcertacion
                      sesiones={filtrado.sesiones}
                      acuerdos={filtrado.acuerdos}
                      incidentes={filtrado.incidentes}
                      rol={rol}
                    />
                  ) : null}
                  {vista === "redes" ? (
                    <RedesInclusivas
                      metodologias={filtrado.metodologias}
                      organizaciones={filtrado.organizaciones}
                    />
                  ) : null}
                  {vista === "pilotos" ? (
                    <BancoInnovacion proyectos={filtrado.proyectos} rol={rol} />
                  ) : null}
                  {vista === "tablero" ? (
                    <GeografiaTablero state={filtrado} rol={rol} />
                  ) : null}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  BookMarked,
  BookOpen,
  Droplets,
  FolderKanban,
  FolderOpen,
  Map,
  MapPinned,
  MessageSquare,
  MessagesSquare,
  PieChart,
  ShieldAlert,
  ShieldCheck,
} from "lucide";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { cn } from "@/lib/utils";
import { GlifoJaHeader } from "../GlifoJaHeader";
import {
  AMBITO_CUENCA,
  GESTION_RECURSOS_HIDRICOS,
} from "../lib/catalogos";
import { useJaState } from "../lib/hooks";
import { BancoSaberes } from "./BancoSaberes";
import { BitacoraPublica } from "./BitacoraPublica";
import { CanalCiudadano } from "./CanalCiudadano";
import { ProyectosDemostrativos } from "./ProyectosDemostrativos";
import { TableroTransparencia } from "./TableroTransparencia";
import { VisorTerritorial } from "./VisorTerritorial";

const SECCIONES = [
  { id: "visor", label: "Visor", from: MapPinned, to: Map },
  { id: "canal", label: "Canal", from: ShieldAlert, to: ShieldCheck },
  { id: "bitacora", label: "Acuerdos", from: MessageSquare, to: MessagesSquare },
  { id: "saberes", label: "Saberes", from: BookOpen, to: BookMarked },
  { id: "pilotos", label: "Pilotos", from: FolderKanban, to: FolderOpen },
  { id: "tablero", label: "Cuentas", from: PieChart, to: Droplets },
] as const;

type SeccionId = (typeof SECCIONES)[number]["id"];

export function PortalPublicoJa() {
  const { data: state, isLoading } = useJaState();
  const [seccion, setSeccion] = useState<SeccionId>("visor");

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-100 pb-20 dark:bg-zinc-800 md:pb-0">
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
        <div className="relative mx-auto flex max-w-6xl items-center gap-4 px-4 py-6 md:gap-5 md:px-6 md:py-7">
          <GlifoJaHeader imageClassName="h-36 w-36 object-contain md:h-44 md:w-44" />
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#C59B27]">
              {GESTION_RECURSOS_HIDRICOS}
            </p>
            <h1 className="mt-1.5 max-w-xl text-3xl font-black leading-[1.1] tracking-tight md:text-4xl">
              Espacio ciudadano Ja&apos;
            </h1>
            <p className="mt-2 max-w-md text-sm font-medium text-sky-100/90">
              {AMBITO_CUENCA} · Camotán, Jocotán, Olopa, San Juan Ermita y Chiquimula
            </p>
          </div>
        </div>
        <div className="h-1 bg-[#C59B27]" />
      </header>

      <nav
        className="sticky top-0 z-20 border-b border-[#00285c] bg-[#003882]"
        aria-label="Secciones del portal público"
      >
        <div className="mx-auto flex max-w-6xl gap-0 overflow-x-auto px-2 md:px-4">
          {SECCIONES.map((item) => {
            const activa = seccion === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSeccion(item.id)}
                className={cn(
                  "relative flex cursor-pointer items-center gap-2 px-3 py-3.5 text-sm font-bold whitespace-nowrap",
                  activa ? "text-white" : "text-sky-200/70 hover:text-white",
                )}
                aria-current={activa ? "page" : undefined}
              >
                <MorphHoverIcon
                  from={item.from}
                  to={item.to}
                  size={16}
                  color="currentColor"
                  spring="snappy"
                />
                {item.label}
                {activa ? (
                  <motion.span
                    layoutId="ja-pub-nav"
                    className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#C59B27]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      <div
        className={cn(
          "w-full flex-1",
          seccion === "visor"
            ? "px-0 py-4 md:py-5"
            : "mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8",
        )}
      >
        {isLoading || !state ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-40 animate-pulse rounded-[28px] bg-white dark:bg-zinc-900" />
            <div className="h-40 animate-pulse rounded-[28px] bg-white dark:bg-zinc-900" />
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={seccion}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              {seccion === "visor" ? (
                <VisorTerritorial proyectos={state.proyectos} sesiones={state.sesiones} />
              ) : null}
              {seccion === "canal" ? <CanalCiudadano /> : null}
              {seccion === "bitacora" ? <BitacoraPublica acuerdos={state.acuerdos} /> : null}
              {seccion === "saberes" ? <BancoSaberes /> : null}
              {seccion === "pilotos" ? (
                <ProyectosDemostrativos proyectos={state.proyectos} />
              ) : null}
              {seccion === "tablero" ? (
                <TableroTransparencia acuerdos={state.acuerdos} incidentes={state.incidentes} />
              ) : null}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#00285c] bg-[#003882] pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navegación inferior"
      >
        <div className="grid grid-cols-6">
          {SECCIONES.map((item) => {
            const activa = seccion === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSeccion(item.id)}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-0.5 py-2.5 text-[9px] font-black uppercase tracking-wide",
                  activa ? "text-[#C59B27]" : "text-sky-200/70",
                )}
                aria-current={activa ? "page" : undefined}
              >
                <MorphHoverIcon
                  from={item.from}
                  to={item.to}
                  size={18}
                  color="currentColor"
                  spring="snappy"
                />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

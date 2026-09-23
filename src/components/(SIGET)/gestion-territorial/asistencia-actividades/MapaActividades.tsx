"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { CircleMarker as LeafletCircleMarker } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowUpRight, Expand, ExternalLink, Shrink } from "lucide";
import { MapPin } from "lucide-react";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { ActividadRecord } from "./lib/zod";
import { formatFechaActividad, formatUbicacionActividad } from "./lib/zod";
import { rutaDetalleActividadAsistencia } from "./lib/helpers";

const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const SAT_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SAT_ATTR =
  "Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics";
const SAT_ROADS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}";
const SAT_LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const GT_CENTER: [number, number] = [15.5, -90.25];
const TRIFINIO_BOUNDS: [[number, number], [number, number]] = [
  [13.55, -90.15],
  [15.45, -88.25],
];

function radioMarcador(zoom: number, seleccionada: boolean): number {
  if (zoom <= 8) return seleccionada ? 6 : 3;
  if (zoom <= 10) return seleccionada ? 8 : 4;
  if (zoom <= 12) return seleccionada ? 12 : 8;
  return seleccionada ? 16 : 11;
}

function PanelesHibrido() {
  const map = useMap();
  if (!map.getPane("hibrido")) {
    const pane = map.createPane("hibrido");
    pane.style.zIndex = "350";
    pane.style.pointerEvents = "none";
  }
  const overlay = map.getPane("overlayPane");
  const markers = map.getPane("markerPane");
  if (overlay) overlay.style.zIndex = "650";
  if (markers) markers.style.zIndex = "660";
  return null;
}

function NivelZoom({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMap();
  useEffect(() => {
    const sync = () => onZoom(map.getZoom());
    sync();
    map.on("zoom", sync);
    map.on("zoomend", sync);
    return () => {
      map.off("zoom", sync);
      map.off("zoomend", sync);
    };
  }, [map, onZoom]);
  return null;
}

function TamanoMapa() {
  const map = useMap();
  useEffect(() => {
    const node = map.getContainer();
    const invalidate = () => map.invalidateSize();
    const t = window.setTimeout(invalidate, 80);
    const observer = new ResizeObserver(invalidate);
    observer.observe(node);
    return () => {
      window.clearTimeout(t);
      observer.disconnect();
    };
  }, [map]);
  return null;
}

function VistaInicial({ puntos }: { puntos: [number, number][] }) {
  const map = useMap();
  const hecho = useRef(false);
  useEffect(() => {
    if (hecho.current) return;
    hecho.current = true;
    if (puntos.length === 0) {
      map.setView(GT_CENTER, 7);
    } else if (puntos.length === 1) {
      map.setView(puntos[0], 13);
    } else {
      map.fitBounds(puntos, { padding: [36, 36], maxZoom: 13 });
    }
  }, [map, puntos]);
  return null;
}

function VistaGeneralControl({
  activo,
  onDesactivar,
}: {
  activo: boolean;
  onDesactivar: () => void;
}) {
  const map = useMap();
  const vuelo = useRef(false);

  useEffect(() => {
    if (!activo) return;
    vuelo.current = true;
    map.flyToBounds(TRIFINIO_BOUNDS, {
      padding: [32, 32],
      maxZoom: 9,
      duration: 0.65,
    });
    const fin = () => {
      window.setTimeout(() => {
        vuelo.current = false;
      }, 120);
    };
    map.once("moveend", fin);
    return () => {
      map.off("moveend", fin);
    };
  }, [activo, map]);

  useEffect(() => {
    const salir = () => {
      if (vuelo.current || !activo) return;
      onDesactivar();
    };
    map.on("dragend", salir);
    map.on("zoomend", salir);
    return () => {
      map.off("dragend", salir);
      map.off("zoomend", salir);
    };
  }, [map, activo, onDesactivar]);

  return null;
}

function PopupActividad({ act }: { act: ActividadRecord }) {
  const ubicacion = formatUbicacionActividad(act);
  const href = rutaDetalleActividadAsistencia(act);
  const total = act.total_registros ?? 0;
  const [hovered, setHovered] = useState(false);

  return (
    <div className="min-w-56 max-w-72 font-sans text-zinc-800">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#2E9BD0]">
        {formatFechaActividad(act.fecha_realizacion)}
      </p>
      <p className="mt-0.5 text-sm font-black leading-snug text-[#1a4d7a]">
        {act.nombre}
      </p>
      {act.descripcion?.trim() ? (
        <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-zinc-600">
          {act.descripcion}
        </p>
      ) : null}
      {ubicacion ? (
        <p className="mt-2 flex items-start gap-1 text-xs text-zinc-600">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#2E9BD0]" />
          <span>{ubicacion}</span>
        </p>
      ) : null}
      <p className="mt-2.5 text-xs font-bold text-zinc-700">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Participantes
        </span>
        <span className="ml-2 tabular-nums text-[#1a4d7a]">{total}</span>
      </p>
      <Link
        href={href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="mt-3 inline-flex h-8 w-full cursor-pointer flex-row items-center justify-center gap-1.5 rounded-lg border-0 bg-sky-100 px-3 text-center text-[10px] font-bold uppercase tracking-wide text-azul-trifinio transition-colors hover:bg-sky-200"
      >
        <span>Entrar</span>
        <MorphHoverIcon
          from={ExternalLink}
          to={ArrowUpRight}
          hovered={hovered}
          size={14}
          color="#1a95d3"
          spring="snappy"
          className="shrink-0"
        />
      </Link>
    </div>
  );
}

function MarcadorActividad({
  act,
  seleccionada,
  foco,
  zoom,
}: {
  act: ActividadRecord & { latitud: number; longitud: number };
  seleccionada: boolean;
  foco: number;
  zoom: number;
}) {
  const map = useMap();
  const layerRef = useRef<LeafletCircleMarker | null>(null);

  useEffect(() => {
    if (!seleccionada) return;
    const marker = layerRef.current;
    if (!marker) return;

    map.flyTo([act.latitud, act.longitud], 15, { duration: 0.5 });
    const abrir = () => {
      marker.openPopup();
    };
    map.once("moveend", abrir);
    const t = window.setTimeout(abrir, 560);
    return () => {
      map.off("moveend", abrir);
      window.clearTimeout(t);
    };
  }, [seleccionada, foco, act.latitud, act.longitud, map]);

  return (
    <CircleMarker
      pane="markerPane"
      center={[act.latitud, act.longitud]}
      radius={radioMarcador(zoom, seleccionada)}
      pathOptions={{
        color: "#ffffff",
        fillColor: seleccionada ? "#2c5f9b" : "#1a95d3",
        fillOpacity: 1,
        weight: seleccionada ? 3 : 2,
        opacity: 1,
      }}
      eventHandlers={{
        add: (e) => {
          layerRef.current = e.target;
        },
      }}
    >
      <Popup autoPan={false} closeOnClick={false}>
        <PopupActividad act={act} />
      </Popup>
    </CircleMarker>
  );
}

export function MapaActividades({
  actividades,
  actividadId,
  foco = 0,
  className,
}: {
  actividades: ActividadRecord[];
  actividadId?: string | null;
  foco?: number;
  className?: string;
}) {
  const conGps = useMemo(
    () =>
      actividades.filter(
        (a): a is ActividadRecord & { latitud: number; longitud: number } =>
          a.latitud != null && a.longitud != null,
      ),
    [actividades],
  );

  const puntos = useMemo(
    () => conGps.map((a) => [a.latitud, a.longitud] as [number, number]),
    [conGps],
  );

  const [vistaGeneral, setVistaGeneral] = useState(false);
  const [satelite, setSatelite] = useState(true);
  const [zoom, setZoom] = useState(7);
  const [cssFull, setCssFull] = useState(false);
  const [nativoFull, setNativoFull] = useState(false);
  const mapaRef = useRef<HTMLDivElement>(null);
  const pantallaCompleta = cssFull || nativoFull;

  useEffect(() => {
    if (actividadId) setVistaGeneral(false);
  }, [actividadId, foco]);

  useEffect(() => {
    const sync = () => {
      const on = Boolean(document.fullscreenElement);
      setNativoFull(on);
      if (on) setCssFull(false);
    };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  useEffect(() => {
    if (!cssFull) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCssFull(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cssFull]);

  const togglePantallaCompleta = async () => {
    const node = mapaRef.current;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (cssFull) {
        setCssFull(false);
        return;
      }
      if (node?.requestFullscreen) {
        await node.requestFullscreen();
        return;
      }
    } catch {
      /* fallback CSS */
    }
    setCssFull(true);
  };

  return (
    <div
      id="mapa-actividades"
      ref={mapaRef}
      className={cn(
        "flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900/40",
        cssFull &&
          "fixed inset-0 z-[180] h-dvh w-dvw rounded-none border-0 bg-card",
        className,
      )}
    >
      <div className="h-1 w-full shrink-0 bg-celeste-trifinio" />
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2">
        <p className="min-w-0 truncate text-[10px] font-black uppercase tracking-widest text-celeste-trifinio">
          Mapa de actividades
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-celeste-trifinio/40 bg-sky-50/60 py-1 pl-2.5 pr-1 dark:bg-sky-950/20">
            <span className="text-[9px] font-bold uppercase tracking-wider text-celeste-trifinio">
              Satélite
            </span>
            <Switch
              checked={satelite}
              onCheckedChange={setSatelite}
              aria-label="Vista híbrida satelital"
              className="shadow-none data-[state=checked]:bg-celeste-trifinio data-[state=unchecked]:bg-zinc-300 dark:data-[state=unchecked]:bg-zinc-600"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-celeste-trifinio/40 bg-sky-50/60 py-1 pl-2.5 pr-1 dark:bg-sky-950/20">
            <span className="text-[9px] font-bold uppercase tracking-wider text-celeste-trifinio">
              Vista general
            </span>
            <Switch
              checked={vistaGeneral}
              onCheckedChange={setVistaGeneral}
              aria-label="Vista general de la región Trifinio"
              className="shadow-none data-[state=checked]:bg-celeste-trifinio data-[state=unchecked]:bg-zinc-300 dark:data-[state=unchecked]:bg-zinc-600"
            />
          </label>
          <SigetActionButton
            label={pantallaCompleta ? "Cerrar" : "Ampliar"}
            ariaLabel={
              pantallaCompleta
                ? "Salir de pantalla completa"
                : "Mapa a pantalla completa"
            }
            accentColor={sigetAccent.abrir}
            morphFrom={pantallaCompleta ? Shrink : Expand}
            morphTo={pantallaCompleta ? Expand : Shrink}
            onClick={() => void togglePantallaCompleta()}
            iconOnly
            className="size-8 w-8 shrink-0"
          />
        </div>
      </div>
      <div
        className={cn(
          "min-h-0 w-full flex-1",
          !pantallaCompleta && "h-[min(20rem,55dvh)] lg:h-auto",
        )}
      >
        <MapContainer
          center={GT_CENTER}
          zoom={7}
          scrollWheelZoom
          className="h-full w-full"
        >
          {satelite ? (
            <>
              <PanelesHibrido />
              <TileLayer key="sat" attribution={SAT_ATTR} url={SAT_URL} />
              <TileLayer key="sat-roads" url={SAT_ROADS_URL} pane="hibrido" />
              <TileLayer key="sat-labels" url={SAT_LABELS_URL} pane="hibrido" />
            </>
          ) : (
            <TileLayer key="osm" attribution={OSM_ATTR} url={OSM_URL} />
          )}
          <TamanoMapa />
          <NivelZoom onZoom={setZoom} />
          {vistaGeneral ? null : <VistaInicial puntos={puntos} />}
          <VistaGeneralControl
            activo={vistaGeneral}
            onDesactivar={() => setVistaGeneral(false)}
          />
          {conGps.map((act) => (
            <MarcadorActividad
              key={act.id}
              act={act}
              seleccionada={act.id === actividadId}
              foco={foco}
              zoom={zoom}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

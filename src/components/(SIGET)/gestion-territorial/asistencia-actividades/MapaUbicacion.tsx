"use client";

import { useEffect, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Expand, Shrink } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

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
  [14.18, -89.78],
  [14.78, -88.98],
];

function radioMarcador(zoom: number): number {
  if (zoom <= 8) return 3;
  if (zoom <= 10) return 4;
  if (zoom <= 12) return 5;
  if (zoom <= 15) return 6;
  return 7;
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

function Recentrar({
  lat,
  lng,
  zoom,
}: {
  lat: number;
  lng: number;
  zoom: number;
}) {
  const map = useMap();
  const prev = useRef("");
  useEffect(() => {
    const key = `${lat},${lng}`;
    if (prev.current === key) return;
    prev.current = key;
    map.setView([lat, lng], zoom);
  }, [lat, lng, zoom, map]);
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
      padding: [24, 24],
      maxZoom: 10,
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
    return () => {
      map.off("dragend", salir);
    };
  }, [map, activo, onDesactivar]);

  return null;
}

export function MapaUbicacion({
  lat,
  lng,
  titulo,
  detalle,
  className,
}: {
  lat: number | null;
  lng: number | null;
  titulo?: string | null;
  detalle?: string | null;
  className?: string;
}) {
  const tienePin = lat != null && lng != null;
  const center: [number, number] = tienePin ? [lat, lng] : GT_CENTER;
  const zoomPin = tienePin ? 16 : 7;
  const [vistaGeneral, setVistaGeneral] = useState(false);
  const [satelite, setSatelite] = useState(true);
  const [zoom, setZoom] = useState(zoomPin);
  const [cssFull, setCssFull] = useState(false);
  const [nativoFull, setNativoFull] = useState(false);
  const mapaRef = useRef<HTMLDivElement>(null);
  const pantallaCompleta = cssFull || nativoFull;

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
      ref={mapaRef}
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900/40",
        cssFull &&
          "fixed inset-0 z-[180] h-dvh w-dvw rounded-none border-0 bg-card",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-end gap-2 px-3 py-2">
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
      <div className="min-h-64 w-full flex-1">
        <MapContainer
          center={center}
          zoom={zoomPin}
          scrollWheelZoom
          className="h-full w-full min-h-64"
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
          <Recentrar lat={center[0]} lng={center[1]} zoom={zoomPin} />
          <VistaGeneralControl
            activo={vistaGeneral}
            onDesactivar={() => setVistaGeneral(false)}
          />
          {tienePin ? (
            <CircleMarker
              pane="markerPane"
              center={center}
              radius={radioMarcador(zoom)}
              pathOptions={{
                color: "#ffffff",
                fillColor: "#1a95d3",
                fillOpacity: 1,
                weight: 2,
                opacity: 1,
              }}
            >
              <Popup
                className="mapa-popup-lado"
                offset={[78, 18]}
                autoPan
                autoPanPadding={[24, 24]}
              >
                <div className="min-w-44 max-w-64 font-sans text-zinc-800">
                  {titulo?.trim() ? (
                    <p className="text-sm font-black leading-snug text-[#1a4d7a]">
                      {titulo}
                    </p>
                  ) : (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#2E9BD0]">
                      Punto GPS
                    </p>
                  )}
                  {detalle?.trim() ? (
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
                      {detalle}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs tabular-nums text-zinc-600">
                    {lat.toFixed(6)}, {lng.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ) : null}
        </MapContainer>
      </div>
    </div>
  );
}

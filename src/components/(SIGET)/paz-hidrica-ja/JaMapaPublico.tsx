"use client";

import { useEffect, useMemo } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useTheme } from "next-themes";
import { MICROCUENCAS, type Microcuenca, type Municipio } from "./lib/catalogos";
import {
  CENTRO_CUENCA,
  MICROCUENCA_COORDS,
  MUNICIPIO_COORDS,
  NACIMIENTOS_PROTEGIDOS,
  POLIGONO_CUENCA,
  ZOOM_CUENCA,
  ZOOM_DETALLE,
  ZONAS_RECARGA,
  desplazarPunto,
} from "./lib/geo";
import type { ProyectoRecord, SesionRecord } from "./lib/zod";
import "leaflet/dist/leaflet.css";
import "./ja-leaflet.css";

function iconoCuadro(color: string) {
  return L.divIcon({
    className: "ja-map-icon",
    html: `<span style="display:block;width:13px;height:13px;background:${color};border:2px solid #fff;box-sizing:border-box"></span>`,
    iconSize: [13, 13],
    iconAnchor: [6, 6],
  });
}

function iconoTriangulo(color: string) {
  return L.divIcon({
    className: "ja-map-icon",
    html: `<span style="display:block;width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:13px solid ${color}"></span>`,
    iconSize: [14, 13],
    iconAnchor: [7, 13],
  });
}

function AjustarVistaPublica({
  muni,
  micro,
  layoutTick,
}: {
  muni: Municipio | "todos";
  micro: Microcuenca | "todas";
  layoutTick: number;
}) {
  const map = useMap();

  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(t);
  }, [map, layoutTick]);

  useEffect(() => {
    if (micro !== "todas") {
      map.flyTo(MICROCUENCA_COORDS[micro].centro, ZOOM_DETALLE, { duration: 0.55 });
      return;
    }
    if (muni !== "todos") {
      map.flyTo(MUNICIPIO_COORDS[muni], ZOOM_DETALLE, { duration: 0.55 });
      return;
    }
    map.flyTo(CENTRO_CUENCA, ZOOM_CUENCA, { duration: 0.55 });
  }, [map, muni, micro]);

  return null;
}

export function JaMapaPublico({
  micro,
  muni,
  proyectos,
  sesiones,
  capaRecarga,
  capaNacimientos,
  capaProyectos,
  capaDialogo,
  layoutTick,
  onSelectMicro,
  onSelectProyecto,
}: {
  micro: Microcuenca | "todas";
  muni: Municipio | "todos";
  proyectos: ProyectoRecord[];
  sesiones: SesionRecord[];
  capaRecarga: boolean;
  capaNacimientos: boolean;
  capaProyectos: boolean;
  capaDialogo: boolean;
  layoutTick: number;
  onSelectMicro: (microcuenca: Microcuenca) => void;
  onSelectProyecto: (proyecto: ProyectoRecord) => void;
}) {
  const { resolvedTheme } = useTheme();
  const oscuro = resolvedTheme === "dark";
  const iconoPiloto = useMemo(() => iconoCuadro("#C59B27"), []);
  const iconoDialogo = useMemo(() => iconoTriangulo("#003882"), []);

  const puntosProyecto = useMemo(() => {
    const cuentas = { ...Object.fromEntries(MICROCUENCAS.map((n) => [n, 0])) } as Record<
      Microcuenca,
      number
    >;
    return proyectos.map((row) => {
      const i = cuentas[row.microcuenca] ?? 0;
      cuentas[row.microcuenca] = i + 1;
      return {
        row,
        posicion: desplazarPunto(MICROCUENCA_COORDS[row.microcuenca].centro, i, 1),
      };
    });
  }, [proyectos]);

  const puntosDialogo = useMemo(() => {
    const cuentas = { ...Object.fromEntries(MICROCUENCAS.map((n) => [n, 0])) } as Record<
      Microcuenca,
      number
    >;
    return sesiones.map((row) => {
      const i = cuentas[row.microcuenca] ?? 0;
      cuentas[row.microcuenca] = i + 1;
      return {
        row,
        posicion: desplazarPunto(MICROCUENCA_COORDS[row.microcuenca].centro, i, 2),
      };
    });
  }, [sesiones]);

  return (
    <div className="ja-leaflet-map ja-leaflet-map-publico">
      <MapContainer
        key="visor-publico-cuenca-rio-grande"
        center={CENTRO_CUENCA}
        zoom={ZOOM_CUENCA}
        scrollWheelZoom
        attributionControl
        className="h-full w-full"
      >
        <TileLayer
          key={oscuro ? "dark" : "topo"}
          attribution={
            oscuro
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO'
              : "Tiles &copy; Esri &mdash; fuente: Esri, USGS, NOAA"
          }
          url={
            oscuro
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
          }
        />

        <Polygon
          positions={POLIGONO_CUENCA}
          pathOptions={{
            color: "#003882",
            weight: 2,
            fillColor: "#003882",
            fillOpacity: oscuro ? 0.12 : 0.08,
            dashArray: "6 5",
          }}
        >
          <Tooltip>Cuenca del Río Grande</Tooltip>
        </Polygon>

        {capaRecarga
          ? ZONAS_RECARGA.map((zona) => (
              <Circle
                key={zona.id}
                center={zona.centro}
                radius={zona.radio}
                pathOptions={{
                  color: "#1B5E20",
                  weight: 1.5,
                  dashArray: "4 6",
                  fillColor: "#1B5E20",
                  fillOpacity: 0.12,
                }}
              >
                <Tooltip>{zona.nombre}</Tooltip>
              </Circle>
            ))
          : null}

        {MICROCUENCAS.map((nombre) => {
          const geo = MICROCUENCA_COORDS[nombre];
          const seleccionada = micro === nombre;
          return (
            <Circle
              key={nombre}
              center={geo.centro}
              radius={geo.radio}
              eventHandlers={{
                click: () => onSelectMicro(nombre),
              }}
              pathOptions={{
                color: seleccionada ? "#003882" : "#388E3C",
                weight: seleccionada ? 3 : 2,
                fillColor: "#1B5E20",
                fillOpacity: seleccionada ? 0.28 : 0.14,
              }}
            >
              <Tooltip>{nombre}</Tooltip>
            </Circle>
          );
        })}

        {capaNacimientos
          ? NACIMIENTOS_PROTEGIDOS.map((nac) => (
              <CircleMarker
                key={nac.id}
                center={nac.posicion}
                radius={6}
                pathOptions={{
                  color: "#ffffff",
                  weight: 2,
                  fillColor: "#1B5E20",
                  fillOpacity: 1,
                }}
              >
                <Tooltip>{nac.nombre}</Tooltip>
              </CircleMarker>
            ))
          : null}

        {capaProyectos
          ? puntosProyecto.map(({ row, posicion }) => (
              <Marker
                key={row.id}
                position={posicion}
                icon={iconoPiloto}
                eventHandlers={{
                  click: () => onSelectProyecto(row),
                }}
              >
                <Tooltip>
                  {row.nombre} · {row.comunidad}
                </Tooltip>
              </Marker>
            ))
          : null}

        {capaDialogo
          ? puntosDialogo.map(({ row, posicion }) => (
              <Marker key={row.id} position={posicion} icon={iconoDialogo}>
                <Tooltip>
                  {row.titulo} · {row.microcuenca}
                </Tooltip>
              </Marker>
            ))
          : null}

        <AjustarVistaPublica muni={muni} micro={micro} layoutTick={layoutTick} />
      </MapContainer>
    </div>
  );
}

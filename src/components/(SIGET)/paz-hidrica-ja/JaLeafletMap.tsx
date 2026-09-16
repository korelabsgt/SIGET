"use client";

import { useEffect, useMemo } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useTheme } from "next-themes";
import { CRITICIDAD_META, MICROCUENCAS, type Microcuenca, type Municipio } from "./lib/catalogos";
import {
  CENTRO_CUENCA,
  COLOR_ALERTA,
  MICROCUENCA_COORDS,
  MUNICIPIO_COORDS,
  POLIGONO_CUENCA,
  ZOOM_CUENCA,
  ZOOM_DETALLE,
  desplazarPunto,
} from "./lib/geo";
import type { IncidenteRecord, ProyectoRecord, SesionRecord } from "./lib/zod";
import "leaflet/dist/leaflet.css";
import "./ja-leaflet.css";

function iconoCuadro(color: string) {
  return L.divIcon({
    className: "ja-map-icon",
    html: `<span style="display:block;width:13px;height:13px;background:${color};border:2px solid #fff;box-sizing:border-box"></span>`,
    iconSize: [13, 13],
    iconAnchor: [6, 6],
    popupAnchor: [0, -8],
  });
}

function iconoTriangulo(color: string) {
  return L.divIcon({
    className: "ja-map-icon",
    html: `<span style="display:block;width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:13px solid ${color}"></span>`,
    iconSize: [14, 13],
    iconAnchor: [7, 13],
    popupAnchor: [0, -12],
  });
}

function AjustarVista({
  muni,
  micro,
}: {
  muni: Municipio | "todos";
  micro: Microcuenca | null;
}) {
  const map = useMap();

  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(t);
  }, [map]);

  useEffect(() => {
    if (micro) {
      map.flyTo(MICROCUENCA_COORDS[micro].centro, ZOOM_DETALLE, { duration: 0.55 });
      return;
    }
    if (muni !== "todos") {
      map.flyTo(MUNICIPIO_COORDS[muni], ZOOM_DETALLE, { duration: 0.65 });
      return;
    }
    map.flyTo(CENTRO_CUENCA, ZOOM_CUENCA, { duration: 0.65 });
  }, [map, muni, micro]);

  return null;
}

export function JaLeafletMap({
  microSeleccionada,
  muni,
  incidentes,
  proyectos,
  sesiones,
  capaAlertas,
  capaProyectos,
  capaDialogo,
  onSelectMicro,
}: {
  microSeleccionada: Microcuenca | null;
  muni: Municipio | "todos";
  incidentes: IncidenteRecord[];
  proyectos: ProyectoRecord[];
  sesiones: SesionRecord[];
  capaAlertas: boolean;
  capaProyectos: boolean;
  capaDialogo: boolean;
  onSelectMicro: (microcuenca: Microcuenca) => void;
}) {
  const { resolvedTheme } = useTheme();
  const oscuro = resolvedTheme === "dark";
  const iconoPiloto = useMemo(() => iconoCuadro("#C59B27"), []);
  const iconoDialogo = useMemo(() => iconoTriangulo("#003882"), []);

  const puntosAlerta = useMemo(() => {
    const cuentas = { ...Object.fromEntries(MICROCUENCAS.map((n) => [n, 0])) } as Record<
      Microcuenca,
      number
    >;
    return incidentes.map((row) => {
      const i = cuentas[row.microcuenca] ?? 0;
      cuentas[row.microcuenca] = i + 1;
      return {
        row,
        posicion: desplazarPunto(MICROCUENCA_COORDS[row.microcuenca].centro, i, 0),
      };
    });
  }, [incidentes]);

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
    <div className="ja-leaflet-map">
      <MapContainer
        key="visor-cuenca-rio-grande"
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

        {MICROCUENCAS.map((nombre) => {
          const geo = MICROCUENCA_COORDS[nombre];
          const seleccionada = microSeleccionada === nombre;
          return (
            <Circle
              key={nombre}
              center={geo.centro}
              radius={geo.radio}
              eventHandlers={{
                click: () => onSelectMicro(nombre),
              }}
              pathOptions={{
                color: seleccionada ? "#1B5E20" : "#388E3C",
                weight: seleccionada ? 3 : 2.5,
                fillColor: "#1B5E20",
                fillOpacity: seleccionada ? 0.32 : 0.2,
              }}
            >
              <Tooltip>{nombre}</Tooltip>
            </Circle>
          );
        })}

        {capaAlertas
          ? puntosAlerta.map(({ row, posicion }) => (
              <CircleMarker
                key={row.id}
                center={posicion}
                radius={8}
                pathOptions={{
                  color: "#ffffff",
                  weight: 2,
                  fillColor: COLOR_ALERTA[row.criticidad],
                  fillOpacity: 1,
                }}
              >
                <Popup>
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    {row.confidencial ? row.id_anonimo : row.folio}
                  </p>
                  <p className="font-black">{CRITICIDAD_META[row.criticidad].label}</p>
                  <p className="mt-1 text-xs">
                    {row.microcuenca} · {row.municipio}
                  </p>
                  <p className="mt-1 text-xs">{row.tipologia}</p>
                </Popup>
              </CircleMarker>
            ))
          : null}

        {capaProyectos
          ? puntosProyecto.map(({ row, posicion }) => (
              <Marker
                key={row.id}
                position={posicion}
                icon={iconoPiloto}
              >
                <Popup>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#C59B27]">
                    {row.agencia}
                  </p>
                  <p className="font-black">{row.nombre}</p>
                  <p className="mt-1 text-xs">
                    {row.comunidad} · {row.microcuenca}
                  </p>
                  <p className="mt-1 text-xs">Avance físico {row.avance_fisico}%</p>
                </Popup>
              </Marker>
            ))
          : null}

        {capaDialogo
          ? puntosDialogo.map(({ row, posicion }) => (
              <Marker
                key={row.id}
                position={posicion}
                icon={iconoDialogo}
              >
                <Popup>
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    Zona de diálogo
                  </p>
                  <p className="font-black">{row.titulo}</p>
                  <p className="mt-1 text-xs">
                    {row.microcuenca} · {row.municipio}
                  </p>
                </Popup>
              </Marker>
            ))
          : null}

        <AjustarVista muni={muni} micro={microSeleccionada} />
      </MapContainer>
    </div>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Tooltip,
  useMap,
} from "react-leaflet";
import { useTheme } from "next-themes";
import { MICROCUENCAS, CRITICIDAD_META, type Microcuenca, type Municipio } from "./lib/catalogos";
import {
  CENTRO_CUENCA,
  COLOR_ALERTA,
  MICROCUENCA_COORDS,
  MUNICIPIO_COORDS,
  NACIMIENTOS_PROTEGIDOS,
  ZOOM_CUENCA,
  ZOOM_DETALLE,
  ZONAS_RECARGA,
  desplazarPunto,
} from "./lib/geo";
import { JaMapBasemapLayers } from "./JaMapBasemapLayers";
import { JaMapConIconos, JaMapCuencaPoligonos, JaMapMicroCirculos } from "./JaMapAmbito";
import { JA_MAP_VISTA_DEFAULT, type JaMapVista } from "./lib/map-tiles";
import type { IncidenteRecord, ProyectoRecord, SesionRecord } from "./lib/zod";
import "leaflet/dist/leaflet.css";
import "./ja-leaflet.css";

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
  incidentes,
  capaRecarga,
  capaNacimientos,
  capaProyectos,
  capaDialogo,
  capaAlertas,
  vista = JA_MAP_VISTA_DEFAULT,
  layoutTick,
  onSelectMicro,
  onSelectProyecto,
}: {
  micro: Microcuenca | "todas";
  muni: Municipio | "todos";
  proyectos: ProyectoRecord[];
  sesiones: SesionRecord[];
  incidentes: IncidenteRecord[];
  capaRecarga: boolean;
  capaNacimientos: boolean;
  capaProyectos: boolean;
  capaDialogo: boolean;
  capaAlertas: boolean;
  vista?: JaMapVista;
  layoutTick: number;
  onSelectMicro: (microcuenca: Microcuenca) => void;
  onSelectProyecto: (proyecto: ProyectoRecord) => void;
}) {
  const { resolvedTheme } = useTheme();
  const oscuro = resolvedTheme === "dark";

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
    <div className="ja-leaflet-map ja-leaflet-map-publico">
      <MapContainer
        key="visor-publico-cuenca-rio-grande"
        center={CENTRO_CUENCA}
        zoom={ZOOM_CUENCA}
        scrollWheelZoom
        attributionControl
        className="h-full w-full"
      >
        <JaMapBasemapLayers oscuro={oscuro} vista={vista} />
        <JaMapCuencaPoligonos vista={vista} oscuro={oscuro} />

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

        <JaMapMicroCirculos
          vista={vista}
          seleccionada={micro === "todas" ? null : micro}
          onSelectMicro={onSelectMicro}
        />

        <JaMapConIconos>
          {(iconos) => (
            <>
        {capaAlertas
          ? puntosAlerta.map(({ row, posicion }) => (
              <Marker
                key={row.id}
                position={posicion}
                icon={iconos.incidente(COLOR_ALERTA[row.criticidad])}
                zIndexOffset={410}
              >
                <Tooltip>
                  Incidente · {CRITICIDAD_META[row.criticidad].label} · {row.microcuenca}
                </Tooltip>
              </Marker>
            ))
          : null}

        {capaNacimientos
          ? NACIMIENTOS_PROTEGIDOS.map((nac) => (
              <Marker
                key={nac.id}
                position={nac.posicion}
                icon={iconos.manantial}
                zIndexOffset={400}
              >
                <Tooltip>{nac.nombre}</Tooltip>
              </Marker>
            ))
          : null}

        {capaProyectos
          ? puntosProyecto.map(({ row, posicion }) => (
              <Marker
                key={row.id}
                position={posicion}
                icon={iconos.piloto}
                zIndexOffset={420}
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
              <Marker
                key={row.id}
                position={posicion}
                icon={iconos.dialogo}
                zIndexOffset={430}
              >
                <Tooltip>
                  {row.titulo} · {row.microcuenca}
                </Tooltip>
              </Marker>
            ))
          : null}
            </>
          )}
        </JaMapConIconos>

        <AjustarVistaPublica muni={muni} micro={micro} layoutTick={layoutTick} />
      </MapContainer>
    </div>
  );
}

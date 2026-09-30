"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import { useTheme } from "next-themes";
import { CRITICIDAD_META, MICROCUENCAS, type Microcuenca, type Municipio } from "./lib/catalogos";
import {
  CENTRO_CUENCA,
  COLOR_ALERTA,
  MICROCUENCA_COORDS,
  MUNICIPIO_COORDS,
  ZOOM_CUENCA,
  ZOOM_DETALLE,
  desplazarPunto,
} from "./lib/geo";
import { JaMapBasemapLayers } from "./JaMapBasemapLayers";
import { JaMapConIconos, JaMapCuencaPoligonos, JaMapMicroCirculos } from "./JaMapAmbito";
import { JA_MAP_VISTA_DEFAULT, type JaMapVista } from "./lib/map-tiles";
import type { IncidenteRecord, ProyectoRecord, SesionRecord } from "./lib/zod";
import "leaflet/dist/leaflet.css";
import "./ja-leaflet.css";

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
  vista = JA_MAP_VISTA_DEFAULT,
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
  vista?: JaMapVista;
  onSelectMicro: (microcuenca: Microcuenca) => void;
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
    <div className="ja-leaflet-map">
      <MapContainer
        key="visor-cuenca-rio-grande"
        center={CENTRO_CUENCA}
        zoom={ZOOM_CUENCA}
        scrollWheelZoom
        attributionControl
        className="h-full w-full"
      >
        <JaMapBasemapLayers oscuro={oscuro} vista={vista} />
        <JaMapCuencaPoligonos vista={vista} oscuro={oscuro} />
        <JaMapMicroCirculos
          vista={vista}
          seleccionada={microSeleccionada}
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
                zIndexOffset={400}
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
                icon={iconos.dialogo}
                zIndexOffset={430}
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
            </>
          )}
        </JaMapConIconos>

        <AjustarVista muni={muni} micro={microSeleccionada} />
      </MapContainer>
    </div>
  );
}

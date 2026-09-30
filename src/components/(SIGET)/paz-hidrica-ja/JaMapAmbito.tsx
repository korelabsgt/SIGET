"use client";

import { useEffect, useMemo, useState, Fragment, type ReactNode } from "react";
import { Circle, Polygon, Tooltip, useMap } from "react-leaflet";
import { MICROCUENCAS, type Microcuenca } from "./lib/catalogos";
import { MICROCUENCA_COORDS, POLIGONO_CUENCA_SUAVE } from "./lib/geo";
import {
  jaMapCuencaHaloPath,
  jaMapCuencaPath,
  jaMapMicroHaloPath,
  jaMapMicroPath,
  type JaMapVista,
} from "./lib/map-tiles";
import {
  jaIconoCirculo,
  jaIconoCuadro,
  jaIconoRombo,
  jaIconoTriangulo,
  jaMapIconPx,
} from "./lib/map-marcadores";

export function useJaMapZoom() {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());

  useEffect(() => {
    const sync = () => setZoom(map.getZoom());
    sync();
    map.on("zoomend", sync);
    return () => {
      map.off("zoomend", sync);
    };
  }, [map]);

  return zoom;
}

export function useJaMapIconos() {
  const zoom = useJaMapZoom();
  const px = jaMapIconPx(zoom);
  return useMemo(
    () => ({
      px,
      piloto: jaIconoCuadro("#C59B27", px),
      dialogo: jaIconoTriangulo("#003882", px),
      manantial: jaIconoCirculo("#15803D", px),
      incidente: (color: string) => jaIconoRombo(color, px),
    }),
    [px],
  );
}

export function JaMapConIconos({
  children,
}: {
  children: (iconos: ReturnType<typeof useJaMapIconos>) => ReactNode;
}) {
  const iconos = useJaMapIconos();
  return <>{children(iconos)}</>;
}

export function JaMapCuencaPoligonos({
  vista,
  oscuro,
}: {
  vista: JaMapVista;
  oscuro: boolean;
}) {
  const zoom = useJaMapZoom();

  return (
    <>
      <Polygon
        positions={POLIGONO_CUENCA_SUAVE}
        pathOptions={jaMapCuencaHaloPath(zoom)}
      />
      <Polygon
        positions={POLIGONO_CUENCA_SUAVE}
        pathOptions={jaMapCuencaPath(vista, oscuro, zoom)}
      >
        <Tooltip>Cuenca del Río Grande</Tooltip>
      </Polygon>
    </>
  );
}

export function JaMapMicroCirculos({
  vista,
  seleccionada,
  onSelectMicro,
}: {
  vista: JaMapVista;
  seleccionada: Microcuenca | null;
  onSelectMicro: (microcuenca: Microcuenca) => void;
}) {
  const zoom = useJaMapZoom();

  return (
    <>
      {MICROCUENCAS.map((nombre) => {
        const geo = MICROCUENCA_COORDS[nombre];
        const activa = seleccionada === nombre;
        return (
          <Fragment key={nombre}>
            <Circle
              center={geo.centro}
              radius={geo.radio}
              pathOptions={jaMapMicroHaloPath(zoom)}
            />
            <Circle
              center={geo.centro}
              radius={geo.radio}
              eventHandlers={{
                click: () => onSelectMicro(nombre),
              }}
              pathOptions={jaMapMicroPath(vista, activa, zoom)}
            >
              <Tooltip>{nombre}</Tooltip>
            </Circle>
          </Fragment>
        );
      })}
    </>
  );
}

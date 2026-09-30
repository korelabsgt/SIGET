"use client";

import { useEffect, useMemo } from "react";
import { TileLayer, useMap } from "react-leaflet";
import { jaMapTileLayers, type JaMapVista } from "./lib/map-tiles";

function JaMapPaneHibrido() {
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

function JaMapZoomLimit({ maxZoom }: { maxZoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setMaxZoom(maxZoom);
    if (map.getZoom() > maxZoom) {
      map.setZoom(maxZoom);
    }
  }, [map, maxZoom]);

  return null;
}

export function JaMapBasemapLayers({
  oscuro,
  vista,
}: {
  oscuro: boolean;
  vista: JaMapVista;
}) {
  const spec = useMemo(
    () => jaMapTileLayers({ oscuro, vista }),
    [oscuro, vista],
  );

  return (
    <>
      <JaMapZoomLimit maxZoom={spec.maxZoom} />
      {spec.hybridPane ? <JaMapPaneHibrido /> : null}
      {spec.layers.map((layer) =>
        layer.pane ? (
          <TileLayer
            key={layer.key}
            url={layer.url}
            pane={layer.pane}
            maxZoom={layer.maxZoom}
            maxNativeZoom={layer.maxNativeZoom}
          />
        ) : (
          <TileLayer
            key={layer.key}
            url={layer.url}
            attribution={layer.attribution}
            maxZoom={layer.maxZoom}
            maxNativeZoom={layer.maxNativeZoom}
          />
        ),
      )}
    </>
  );
}

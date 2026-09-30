const cartoBasemapsKey = process.env.NEXT_PUBLIC_CARTO_BASEMAPS_API_KEY?.trim();

export const JA_MAP_TILE_LIGHT =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";

export const JA_MAP_TILE_LIGHT_ATTRIBUTION =
  "Tiles &copy; Esri &mdash; fuente: Esri, USGS, NOAA";

const JA_MAP_TILE_DARK_ESRI =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";

const JA_MAP_TILE_DARK_ESRI_ATTRIBUTION =
  "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, (c) OpenStreetMap contributors";

const JA_MAP_TILE_DARK_CARTO =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

const JA_MAP_TILE_DARK_CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO';

export function jaMapDarkBasemap(): { url: string; attribution: string } {
  if (cartoBasemapsKey) {
    const sep = JA_MAP_TILE_DARK_CARTO.includes("?") ? "&" : "?";
    return {
      url: `${JA_MAP_TILE_DARK_CARTO}${sep}key=${encodeURIComponent(cartoBasemapsKey)}`,
      attribution: JA_MAP_TILE_DARK_CARTO_ATTRIBUTION,
    };
  }
  return {
    url: JA_MAP_TILE_DARK_ESRI,
    attribution: JA_MAP_TILE_DARK_ESRI_ATTRIBUTION,
  };
}

export function jaMapLightBasemap(): { url: string; attribution: string } {
  return {
    url: JA_MAP_TILE_LIGHT,
    attribution: JA_MAP_TILE_LIGHT_ATTRIBUTION,
  };
}

export const JA_MAP_TILE_SATELLITE =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

export const JA_MAP_TILE_SATELLITE_ATTRIBUTION =
  "Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics";

export const JA_MAP_TILE_SATELLITE_ROADS =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}";

export const JA_MAP_TILE_SATELLITE_LABELS =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

export const JA_MAP_TILE_HYDRO =
  "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";

export const JA_MAP_TILE_HYDRO_ATTRIBUTION =
  'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)';

export type JaMapVista = "hidrografia" | "mapa" | "satelite";

export const JA_MAP_VISTA_DEFAULT: JaMapVista = "hidrografia";

export type JaMapTileLayerSpec = {
  key: string;
  url: string;
  attribution: string;
  pane?: string;
  maxZoom: number;
  maxNativeZoom: number;
};

export function jaMapVistaMaxZoom(vista: JaMapVista): number {
  if (vista === "hidrografia") return 17;
  return 18;
}

export function jaMapTileLayers(opts: {
  oscuro: boolean;
  vista: JaMapVista;
}): { layers: JaMapTileLayerSpec[]; hybridPane: boolean; maxZoom: number } {
  const { oscuro, vista } = opts;
  const maxZoom = jaMapVistaMaxZoom(vista);

  if (vista === "satelite") {
    return {
      hybridPane: true,
      maxZoom,
      layers: [
        {
          key: "sat",
          url: JA_MAP_TILE_SATELLITE,
          attribution: JA_MAP_TILE_SATELLITE_ATTRIBUTION,
          maxZoom,
          maxNativeZoom: 18,
        },
        {
          key: "sat-roads",
          url: JA_MAP_TILE_SATELLITE_ROADS,
          attribution: "",
          pane: "hibrido",
          maxZoom,
          maxNativeZoom: 18,
        },
        {
          key: "sat-labels",
          url: JA_MAP_TILE_SATELLITE_LABELS,
          attribution: "",
          pane: "hibrido",
          maxZoom,
          maxNativeZoom: 18,
        },
      ],
    };
  }

  if (vista === "hidrografia") {
    return {
      hybridPane: false,
      maxZoom,
      layers: [
        {
          key: "hydro-topo",
          url: JA_MAP_TILE_HYDRO,
          attribution: JA_MAP_TILE_HYDRO_ATTRIBUTION,
          maxZoom: 17,
          maxNativeZoom: 17,
        },
      ],
    };
  }

  const base = oscuro ? jaMapDarkBasemap() : jaMapLightBasemap();
  return {
    hybridPane: false,
    maxZoom,
    layers: [
      {
        key: oscuro ? "dark" : "topo",
        url: base.url,
        attribution: base.attribution,
        maxZoom,
        maxNativeZoom: 16,
      },
    ],
  };
}

export function jaMapStrokeScale(zoom: number): number {
  if (zoom <= 8) return 0.35;
  if (zoom <= 9) return 0.45;
  if (zoom <= 10) return 0.55;
  if (zoom <= 11) return 0.7;
  if (zoom <= 13) return 0.9;
  return 1;
}

export function jaMapCuencaPath(vista: JaMapVista, oscuro: boolean, zoom: number) {
  const escala = jaMapStrokeScale(zoom);
  return {
    color: oscuro ? "#6f9fd4" : "#003882",
    weight: Math.max(2.6, 3.8 * escala),
    fillOpacity: 0,
    lineJoin: "round" as const,
    lineCap: "round" as const,
  };
}

export function jaMapCuencaHaloPath(zoom: number) {
  const escala = jaMapStrokeScale(zoom);
  return {
    color: "#C59B27",
    weight: Math.max(5.5, 7.5 * escala),
    fillOpacity: 0,
    opacity: 1,
    interactive: false,
    lineJoin: "round" as const,
    lineCap: "round" as const,
  };
}

export function jaMapMicroPath(vista: JaMapVista, seleccionada: boolean, zoom: number) {
  const escala = jaMapStrokeScale(zoom);
  if (vista === "hidrografia") {
    return {
      color: seleccionada ? "#C59B27" : "#15803D",
      weight: Math.max(2.4, (seleccionada ? 3.6 : 2.8) * escala),
      fillOpacity: 0,
    };
  }
  return {
    color: seleccionada ? "#1B5E20" : "#388E3C",
    weight: Math.max(2.2, (seleccionada ? 3.2 : 2.6) * escala),
    fillOpacity: 0,
  };
}

export function jaMapMicroHaloPath(zoom: number) {
  const escala = jaMapStrokeScale(zoom);
  return {
    color: "#0a1628",
    weight: Math.max(4.5, 6 * escala),
    fillOpacity: 0,
    opacity: 0.9,
    interactive: false,
  };
}

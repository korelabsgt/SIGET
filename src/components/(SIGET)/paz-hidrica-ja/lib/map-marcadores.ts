import L from "leaflet";

const TRAZO = "#0a1628";

export function jaMapIconPx(zoom: number): number {
  if (zoom <= 9) return 11;
  if (zoom <= 10) return 13;
  if (zoom <= 11) return 15;
  if (zoom <= 12) return 18;
  if (zoom <= 13) return 20;
  return 22;
}

function trazoSvg(px: number): number {
  if (px <= 13) return 1.8;
  if (px <= 16) return 2;
  return 2.3;
}

export function jaIconoCuadro(color: string, px = 22) {
  const stroke = trazoSvg(px);
  return L.divIcon({
    className: "ja-map-icon",
    html: `<svg width="${px}" height="${px}" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="2" fill="${color}" stroke="${TRAZO}" stroke-width="${stroke}"/></svg>`,
    iconSize: [px, px],
    iconAnchor: [px / 2, px / 2],
    popupAnchor: [0, -px / 2],
  });
}

export function jaIconoTriangulo(color: string, px = 22) {
  const stroke = trazoSvg(px);
  const w = Math.round(px * 1.08);
  const h = px;
  return L.divIcon({
    className: "ja-map-icon",
    html: `<svg width="${w}" height="${h}" viewBox="0 0 26 24" aria-hidden="true"><polygon points="13,2.5 24.5,21.5 1.5,21.5" fill="${color}" stroke="${TRAZO}" stroke-width="${stroke}" stroke-linejoin="round"/></svg>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h - 2],
    popupAnchor: [0, -(h - 4)],
  });
}

export function jaIconoCirculo(color: string, px = 22) {
  const stroke = trazoSvg(px);
  return L.divIcon({
    className: "ja-map-icon",
    html: `<svg width="${px}" height="${px}" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="8" fill="${color}" stroke="${TRAZO}" stroke-width="${stroke}"/></svg>`,
    iconSize: [px, px],
    iconAnchor: [px / 2, px / 2],
    popupAnchor: [0, -px / 2],
  });
}

export function jaIconoRombo(color: string, px = 22) {
  const stroke = trazoSvg(px);
  return L.divIcon({
    className: "ja-map-icon",
    html: `<svg width="${px}" height="${px}" viewBox="0 0 22 22" aria-hidden="true"><polygon points="11,1.8 20.2,11 11,20.2 1.8,11" fill="${color}" stroke="${TRAZO}" stroke-width="${stroke}" stroke-linejoin="round"/></svg>`,
    iconSize: [px, px],
    iconAnchor: [px / 2, px / 2],
    popupAnchor: [0, -px / 2],
  });
}

"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

const GT_CENTER: [number, number] = [15.5, -90.25];

function Recentrar({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    const t = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(t);
  }, [center, zoom, map]);
  return null;
}

export function MapaUbicacion({
  lat,
  lng,
  className,
}: {
  lat: number | null;
  lng: number | null;
  className?: string;
}) {
  const tienePin = lat != null && lng != null;
  const center: [number, number] = tienePin ? [lat, lng] : GT_CENTER;
  const zoom = tienePin ? 16 : 7;

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-border dark:border-zinc-700",
        className ?? "h-56",
      )}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recentrar center={center} zoom={zoom} />
        {tienePin ? (
          <CircleMarker
            center={center}
            radius={10}
            pathOptions={{
              color: "#1a4d7a",
              fillColor: "#1a95d3",
              fillOpacity: 0.9,
              weight: 2,
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}

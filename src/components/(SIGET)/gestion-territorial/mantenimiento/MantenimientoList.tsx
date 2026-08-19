"use client";

import { useState } from "react";
import { type FallaRow } from "./lib/actions";
import { DiagnosticoModal } from "./DiagnosticoModal";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Calendar, Wrench, AlertCircle, FileText, User, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MantenimientoList({
  fallas,
  mecanicos,
  isAuthorized,
  filtro,
}: {
  fallas: FallaRow[];
  mecanicos: any[];
  isAuthorized: boolean;
  filtro: "ACTIVAS" | "CRITICAS" | "SOLVENTADAS";
}) {
  const filteredFallas = fallas.filter((falla) => {
    if (filtro === "ACTIVAS") {
      return falla.estado === "PENDIENTE" || falla.estado === "EN_REPARACION";
    }
    if (filtro === "CRITICAS") {
      return falla.severidad === "ALTA" && falla.estado !== "SOLVENTADA";
    }
    if (filtro === "SOLVENTADAS") {
      return falla.estado === "SOLVENTADA";
    }
    return true;
  });

  const getSeveridadBadge = (severidad: string) => {
    switch (severidad) {
      case "ALTA":
        return <Badge className="bg-red-600 hover:bg-red-700">Severidad: Alta (Crítica)</Badge>;
      case "MEDIA":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Severidad: Media</Badge>;
      case "BAJA":
        return <Badge className="bg-slate-500 hover:bg-slate-600">Severidad: Baja</Badge>;
      default:
        return null;
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return <Badge variant="outline" className="text-slate-600 border-slate-600">Pendiente de Revisión</Badge>;
      case "EN_REPARACION":
        return <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50">En Reparación</Badge>;
      case "SOLVENTADA":
        return <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">Solventada</Badge>;
      default:
        return null;
    }
  };

  if (filteredFallas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border shadow-sm">
        <Wrench className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-bold text-foreground">No hay registros</h3>
        <p className="text-muted-foreground text-sm mt-1">No se encontraron averías en esta categoría.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filteredFallas.map((falla) => (
        <Card key={falla.id} className="overflow-hidden bg-card border-border hover:shadow-md transition-all">
          <CardHeader className="pb-3 bg-card/50 border-b border-border flex flex-row items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {getSeveridadBadge(falla.severidad)}
                {getEstadoBadge(falla.estado)}
              </div>
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <CarIcon className="w-5 h-5 text-muted-foreground" />
                {falla.vehiculo?.placa || "Placa desconocida"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                {falla.vehiculo?.marca} {falla.vehiculo?.modelo}
              </p>
            </div>
            {isAuthorized && (
              <DiagnosticoModal falla={falla} mecanicos={mecanicos} isAuthorized={isAuthorized} />
            )}
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Descripción Reportada
                </span>
                <p className="text-sm text-foreground">{falla.descripcion}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Reportado Por
                </span>
                <div className="flex items-center gap-1.5 text-sm text-foreground">
                  <User className="w-3.5 h-3.5" />
                  <span className="truncate">{falla.reportador?.nombre || "Desconocido"}</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Fecha Reporte
                </span>
                <div className="flex items-center gap-1.5 text-sm text-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(falla.created_at), "d MMM, yyyy", { locale: es })}
                </div>
              </div>
            </div>

            {falla.estado !== "PENDIENTE" && (
              <div className="mt-4 pt-4 border-t border-border bg-accent/30 -mx-6 px-6 pb-2">
                <div className="mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Atendido Por
                  </span>
                  <div className="flex items-center gap-1.5 text-sm text-foreground font-medium">
                    <Wrench className="w-3.5 h-3.5 text-orange-500" />
                    {falla.taller_externo ? (
                      <span>Taller Externo: {falla.taller_externo}</span>
                    ) : (
                      <span>{falla.mecanico?.nombre || "Mecánico Interno"}</span>
                    )}
                  </div>
                </div>

                {falla.estado === "SOLVENTADA" && (
                  <>
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                        Diagnóstico Final
                      </span>
                      <p className="text-sm text-foreground italic">"{falla.diagnostico}"</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                        Trabajos / Repuestos
                      </span>
                      <p className="text-sm text-foreground">{falla.reparacion_detalle}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Simple car icon wrapper since we didn't import Car from lucide in this file directly
function CarIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

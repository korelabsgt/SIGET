"use client";

import { useState } from "react";
import { type FallaRow } from "./lib/actions";
import { MantenimientoList } from "./MantenimientoList";
import { FallaFormModal } from "./FallaFormModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Car, Clock, ChevronLeft } from "lucide-react";
import { differenceInDays } from "date-fns";
import { SubmodulosNav } from "../SubmodulosNav";
import { useRouter } from "next/navigation";

export function MantenimientoPanel({
  fallas,
  vehiculos,
  mecanicos,
  isAuthorized,
}: {
  fallas: FallaRow[];
  vehiculos: any[];
  mecanicos: any[];
  isAuthorized: boolean;
}) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<"ACTIVAS" | "CRITICAS" | "SOLVENTADAS">("ACTIVAS");

  const fallasActivas = fallas.filter((f) => f.estado !== "SOLVENTADA").length;
  
  const unidadesFueraDeServicio = new Set(
    fallas
      .filter((f) => f.estado !== "SOLVENTADA" && (f.severidad === "ALTA" || f.estado === "EN_REPARACION"))
      .map((f) => f.vehiculo_id)
  ).size;

  const fallasSolventadas = fallas.filter((f) => f.estado === "SOLVENTADA" && f.solventado_at);
  const totalDays = fallasSolventadas.reduce((acc, f) => {
    return acc + differenceInDays(new Date(f.solventado_at!), new Date(f.created_at));
  }, 0);
  const promedioDias = fallasSolventadas.length > 0 
    ? Math.round((totalDays / fallasSolventadas.length) * 10) / 10 
    : 0;

  return (
    <div className="mx-auto w-full px-0 pt-6 pb-20 sm:px-6 md:pt-10 lg:px-8 xl:w-[90%] relative">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)] opacity-30 z-[-1]" />
      
      {/* HEADER */}
      <div className="mb-6 flex items-start gap-3 px-3 sm:px-0">
        <button
          type="button"
          onClick={() => router.push("/siget")}
          className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-card border border-border hover:bg-accent transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-celeste-trifinio">
            Gestión Territorial
          </p>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground leading-tight uppercase">
            Mantenimiento y Averías
          </h1>
        </div>
      </div>

      <SubmodulosNav />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-3 sm:px-0">
        <p className="text-sm text-muted-foreground">
          Administración del mantenimiento vehicular y reportes de fallas.
        </p>
        <FallaFormModal vehiculos={vehiculos} />
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6 px-3 sm:px-0">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fallas Activas</CardTitle>
            <Activity className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{fallasActivas}</div>
            <p className="text-xs text-muted-foreground mt-1">Pendientes o en reparación</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fuera de Servicio</CardTitle>
            <Car className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{unidadesFueraDeServicio}</div>
            <p className="text-xs text-muted-foreground mt-1">Inmovilizadas por severidad</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Promedio Reparación</CardTitle>
            <Clock className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{promedioDias} <span className="text-base font-normal text-muted-foreground">días</span></div>
            <p className="text-xs text-muted-foreground mt-1">Tiempo medio de solución</p>
          </CardContent>
        </Card>
      </div>

      <div className="px-3 sm:px-0">
        <Tabs defaultValue="ACTIVAS" onValueChange={(v) => setFiltro(v as any)} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="ACTIVAS">Pendientes & Reparación</TabsTrigger>
          <TabsTrigger value="CRITICAS" className="text-red-600 data-[state=active]:text-red-700">Críticas (Alta)</TabsTrigger>
          <TabsTrigger value="SOLVENTADAS">Solventadas (Historial)</TabsTrigger>
        </TabsList>
        <TabsContent value="ACTIVAS" className="mt-0">
          <MantenimientoList 
            fallas={fallas} 
            mecanicos={mecanicos} 
            isAuthorized={isAuthorized} 
            filtro="ACTIVAS" 
          />
        </TabsContent>
        <TabsContent value="CRITICAS" className="mt-0">
          <MantenimientoList 
            fallas={fallas} 
            mecanicos={mecanicos} 
            isAuthorized={isAuthorized} 
            filtro="CRITICAS" 
          />
        </TabsContent>
        <TabsContent value="SOLVENTADAS" className="mt-0">
          <MantenimientoList 
            fallas={fallas} 
            mecanicos={mecanicos} 
            isAuthorized={isAuthorized} 
            filtro="SOLVENTADAS" 
          />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

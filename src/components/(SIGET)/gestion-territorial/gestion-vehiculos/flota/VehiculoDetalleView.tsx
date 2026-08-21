"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  ChevronLeft,
  EllipsisVertical,
  MoreVertical,
  PenSquare,
  Pencil,
  Plus,
  Trash,
  Trash2,
} from "lucide";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { GvMorphIcon } from "../lib/morph-icon";
import { type VehiculoRow } from "./lib/zod";
import {
  fotosVehiculo,
  getAlertStatusClasses,
  getMantenimientoAlertStatus,
  getVencimientoDocumentoStatus,
} from "./lib/helpers";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LORD_CELESTE = "#1a95d3";

function estadoBadgeClass(estado: VehiculoRow["estado"]) {
  if (estado === "LIBRE") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
  }
  if (estado === "RESERVADO") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400";
  }
  return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400";
}

function estadoLabel(estado: VehiculoRow["estado"]) {
  return estado.replace(/_/g, " ");
}

function VehiculoFotoHero({
  vehiculo,
  onEdit,
}: {
  vehiculo: VehiculoRow;
  onEdit: (vehiculo: VehiculoRow) => void;
}) {
  const tituloVehiculo = `${vehiculo.marca} ${vehiculo.modelo}`;
  const fotos = fotosVehiculo(vehiculo);
  const [fotoRota, setFotoRota] = useState(false);
  const [indice, setIndice] = useState(0);
  const fotoActiva = fotos[indice] ?? fotos[0] ?? null;
  const mostrarFoto = Boolean(fotoActiva) && !fotoRota;
  const emptyId = `gv-foto-empty-${vehiculo.id ?? "nuevo"}`;

  useEffect(() => {
    setFotoRota(false);
    setIndice(0);
  }, [vehiculo.id, fotos.join("|")]);

  useEffect(() => {
    if (indice >= fotos.length) setIndice(0);
  }, [fotos.length, indice]);

  return (
    <div className="flex h-full min-h-[14rem] flex-1 flex-col gap-1.5 overflow-hidden rounded-2xl bg-zinc-200 p-1 dark:bg-zinc-900 sm:flex-row">
      <div className="relative min-h-[14rem] min-w-0 flex-1 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
        {mostrarFoto ? (
          <img
            src={fotoActiva ?? ""}
            alt={tituloVehiculo}
            onError={() => setFotoRota(true)}
            className="size-full object-cover object-center"
          />
        ) : (
          <div
            id={emptyId}
            className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground"
          >
            <AnimatedIcon
              iconKey="cdxxgczv"
              size={56}
              target={`#${emptyId}`}
              primaryColor={LORD_CELESTE}
            />
            <p className="text-sm font-medium">Sin fotografía</p>
            <button
              type="button"
              onClick={() => onEdit(vehiculo)}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border-0 bg-celeste-trifinio px-3 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
            >
              Agregar foto
            </button>
          </div>
        )}
      </div>

      {fotos.length > 0 ? (
        <div className="flex shrink-0 flex-row gap-1.5 overflow-x-auto sm:h-full sm:w-[4.25rem] sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto">
          {fotos.map((url, index) => {
            const activa = index === indice && !fotoRota;
            return (
              <button
                key={`${url}-${index}`}
                type="button"
                onClick={() => {
                  setFotoRota(false);
                  setIndice(index);
                }}
                className={cn(
                  "relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-lg border-0 p-0 transition-opacity sm:h-[4.25rem] sm:w-full",
                  activa ? "opacity-100 ring-2 ring-zinc-50" : "opacity-50 hover:opacity-80",
                )}
                aria-label={`Ver fotografía ${index + 1}`}
                aria-pressed={activa}
              >
                <img src={url} alt="" className="size-full object-cover" />
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onEdit(vehiculo)}
            className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-zinc-100 text-celeste-trifinio hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 sm:h-[4.25rem] sm:w-full"
            aria-label="Agregar fotografías"
          >
            <GvMorphIcon icon={Plus} size={18} morphOnHover={false} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function KpiTile({
  id,
  iconKey,
  label,
  value,
  hint,
}: {
  id: string;
  iconKey: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      id={id}
      className="min-w-0 rounded-xl bg-zinc-100 px-2 py-1.5 dark:bg-zinc-900"
    >
      <div className="flex items-center gap-1.5">
        <AnimatedIcon
          iconKey={iconKey}
          size={22}
          target={`#${id}`}
          primaryColor={LORD_CELESTE}
        />
        <p className="truncate text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-0.5 truncate text-sm font-black tabular-nums leading-tight text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="truncate text-[10px] leading-tight text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function EstadoDoc({
  id,
  iconKey,
  titulo,
  valor,
  badge,
  badgeClass,
  extra,
}: {
  id: string;
  iconKey: string;
  titulo: string;
  valor: string;
  badge: string;
  badgeClass: string;
  extra?: string;
}) {
  return (
    <div
      id={id}
      className="flex shrink-0 items-center gap-2 rounded-xl bg-zinc-100 px-2 py-1.5 dark:bg-zinc-900"
    >
      <AnimatedIcon
        iconKey={iconKey}
        size={28}
        target={`#${id}`}
        primaryColor={LORD_CELESTE}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {titulo}
        </p>
        <p className="truncate text-sm font-black tabular-nums leading-tight text-foreground">
          {valor}
        </p>
        {extra ? (
          <p className="truncate text-[10px] leading-tight text-muted-foreground">{extra}</p>
        ) : null}
      </div>
      <span
        className={cn(
          "inline-flex h-[22px] w-[5.75rem] shrink-0 items-center justify-center rounded-full px-0 text-center text-[9px] font-bold uppercase leading-none tracking-wider",
          badgeClass,
        )}
      >
        {badge}
      </span>
    </div>
  );
}

export function VehiculoDetalleView({
  vehiculo,
  onBack,
  onEdit,
  onDelete,
}: {
  vehiculo: VehiculoRow;
  onBack: () => void;
  onEdit: (vehiculo: VehiculoRow) => void;
  onDelete: (vehiculo: VehiculoRow) => void;
}) {
  const mantenimiento = getMantenimientoAlertStatus(vehiculo.kilometraje_actual);
  const kmDesdeUltimo = vehiculo.kilometraje_actual % 5000;
  const progresoServicio = Math.min(100, Math.round((kmDesdeUltimo / 5000) * 100));
  const circulacion = getVencimientoDocumentoStatus(vehiculo.vencimiento_circulacion);
  const seguro = getVencimientoDocumentoStatus(vehiculo.vencimiento_seguro);
  const uid = vehiculo.id ?? vehiculo.placa.replace(/\s+/g, "-");
  const headerId = `gv-detalle-header-${uid}`;

  const fechaCirculacion = vehiculo.vencimiento_circulacion
    ? format(new Date(vehiculo.vencimiento_circulacion), "dd MMM yyyy", { locale: es })
    : "Sin registrar";
  const fechaSeguro = vehiculo.vencimiento_seguro
    ? format(new Date(vehiculo.vencimiento_seguro), "dd MMM yyyy", { locale: es })
    : "Sin registrar";

  const servicioEtiqueta =
    mantenimiento.kmFaltantes <= 0
      ? "Vencido"
      : mantenimiento.kmFaltantes <= 500
        ? "Próximo"
        : "Al día";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
      <div id={headerId} className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-transparent px-0 text-[10px] font-bold uppercase tracking-widest text-zinc-700 transition-opacity hover:opacity-80 dark:text-zinc-200"
        >
          <GvMorphIcon icon={ArrowLeft} hoverIcon={ChevronLeft} size={16} className="text-current" />
          Volver
        </button>
        <AnimatedIcon
          iconKey="cdxxgczv"
          size={28}
          target={`#${headerId}`}
          primaryColor={LORD_CELESTE}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-black uppercase leading-none tracking-tight text-foreground">
            {vehiculo.placa}
          </p>
          <p className="mt-0.5 truncate text-xs font-medium capitalize leading-tight text-muted-foreground">
            {vehiculo.marca} {vehiculo.modelo}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
            estadoBadgeClass(vehiculo.estado),
          )}
        >
          {estadoLabel(vehiculo.estado)}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-celeste-trifinio transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
              aria-label={`Más acciones de ${vehiculo.placa}`}
            >
              <GvMorphIcon
                icon={EllipsisVertical}
                hoverIcon={MoreVertical}
                size={18}
                className="text-current"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="z-[200] min-w-[10rem] rounded-xl border border-border bg-white p-1 text-foreground opacity-100 shadow-lg dark:bg-zinc-900"
          >
            <DropdownMenuItem
              className="cursor-pointer gap-2 bg-white text-foreground focus:bg-sky-50 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800"
              onSelect={() => onEdit(vehiculo)}
            >
              <GvMorphIcon icon={PenSquare} hoverIcon={Pencil} size={14} className="text-current" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-2 bg-white text-red-600 focus:bg-red-50 focus:text-red-600 dark:bg-zinc-900 dark:text-red-400 dark:focus:bg-red-950/60"
              onSelect={() => onDelete(vehiculo)}
            >
              <GvMorphIcon icon={Trash2} hoverIcon={Trash} size={14} className="text-current" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <VehiculoFotoHero vehiculo={vehiculo} onEdit={onEdit} />

        <div className="flex min-h-0 flex-col gap-2 overflow-y-auto rounded-2xl bg-zinc-50 p-2 dark:bg-zinc-800">
          <div className="grid shrink-0 grid-cols-3 gap-1.5">
            <KpiTile
              id={`gv-kpi-km-${uid}`}
              iconKey="cdxxgczv"
              label="Kilometraje"
              value={`${vehiculo.kilometraje_actual.toLocaleString("es-GT")} km`}
              hint={`Servicio ${mantenimiento.siguienteServicio.toLocaleString("es-GT")} km`}
            />
            <KpiTile
              id={`gv-kpi-anio-${uid}`}
              iconKey="abwrkdvl"
              label="Año"
              value={vehiculo.anio ? String(vehiculo.anio) : "N/A"}
            />
            <KpiTile
              id={`gv-kpi-color-${uid}`}
              iconKey="plusmrxr"
              label="Color"
              value={vehiculo.color}
            />
          </div>

          <div className="flex shrink-0 flex-col gap-1.5">
            <EstadoDoc
              id={`gv-doc-circ-${uid}`}
              iconKey="wvhscmei"
              titulo="Circulación"
              valor={fechaCirculacion}
              badge={circulacion.etiqueta}
              badgeClass={getAlertStatusClasses(circulacion.estado)}
            />
            <EstadoDoc
              id={`gv-doc-seg-${uid}`}
              iconKey="ilgzgiqi"
              titulo="Seguro"
              valor={fechaSeguro}
              badge={seguro.etiqueta}
              badgeClass={getAlertStatusClasses(seguro.estado)}
            />
            <EstadoDoc
              id={`gv-doc-srv-${uid}`}
              iconKey="zchvbdce"
              titulo="Próximo servicio"
              valor={`${mantenimiento.siguienteServicio.toLocaleString("es-GT")} km`}
              badge={servicioEtiqueta}
              badgeClass={getAlertStatusClasses(mantenimiento.estado)}
              extra={
                mantenimiento.kmFaltantes <= 0
                  ? "Servicio vencido"
                  : `${mantenimiento.kmFaltantes.toLocaleString("es-GT")} km restantes · ${progresoServicio}% del ciclo`
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

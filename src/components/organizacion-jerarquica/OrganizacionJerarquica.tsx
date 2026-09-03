"use client";

import { isSuperOrAdminRole } from "@/components/(base)/dashboard/modules";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { modalActionMessage } from "@/components/ui/modal-toast";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import {
  SigetActionButton,
  sigetAccent,
} from "@/components/ui/siget-action-button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Briefcase,
  Building2,
  CirclePlus,
  Cog,
  GitBranch,
  MapPin,
  MapPinned,
  Network,
  Plus,
  RefreshCw,
  RotateCw,
  Rows3,
  Settings2,
  Table2,
  UserCog,
  UserRound,
  Users,
} from "lucide";
import { MorphIcon } from "morphicons/react";
import type { IconNode } from "lucide";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { OrganigramaModal } from "./OrganigramaVertical";
import { OrganizacionSkeleton } from "./OrganizacionSkeleton";
import { OrganizacionTree, type AdminHandlers } from "./OrganizacionTree";
import { AsignarPersonaPuesto } from "./forms/AsignarPersona";
import { CrearEstructura } from "./forms/Crear";
import { ReubicarPuestoModal } from "./forms/ReubicarPuesto";
import { VerEditarEstructura } from "./forms/VerEditar";
import {
  useAsignarPersonaAPuesto,
  useEstructuraOrganizacional,
  usePuestos,
} from "./lib/hooks";
import { confirmarDesasignarPersona } from "./lib/swal";
import { departamentoTieneJefe, puestosEnDepartamento } from "./lib/zod";

const VISTA_EASE = [0.4, 0, 0.2, 1] as const;

const ORG_ICON_CYCLE: readonly [IconNode, IconNode][] = [
  [Network, GitBranch],
  [MapPin, MapPinned],
  [Building2, GitBranch],
  [UserRound, UserCog],
  [Briefcase, Building2],
  [UserRound, Users],
  [Settings2, Cog],
  [Table2, Rows3],
];

function MorphCycleIcon({
  pairs,
  size = 24,
  color = "#1a95d3",
  stepMs = 4500,
}: {
  pairs: readonly [IconNode, IconNode][];
  size?: number;
  color?: string;
  stepMs?: number;
}) {
  const [pairIndex, setPairIndex] = useState(0);
  const [showAlt, setShowAlt] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setShowAlt((prev) => {
        if (prev) {
          setPairIndex((i) => (i + 1) % pairs.length);
          return false;
        }
        return true;
      });
    }, stepMs);
    return () => window.clearInterval(id);
  }, [pairs.length, stepMs]);

  const [from, to] = pairs[pairIndex] ?? pairs[0];

  return (
    <MorphIcon
      icon={showAlt ? to : from}
      size={size}
      color={color}
      strokeWidth={1.75}
      spring="snappy"
    />
  );
}

function VistaSwitch({
  vista,
  onChange,
}: {
  vista: "tabla" | "organigrama";
  onChange: (vista: "tabla" | "organigrama") => void;
}) {
  const esOrganigrama = vista === "organigrama";
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex items-center justify-center gap-2.5"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <span
        className={cn(
          "text-xs font-black uppercase tracking-wider transition-colors",
          !esOrganigrama ? "text-celeste-trifinio" : "text-muted-foreground",
        )}
      >
        Tabla
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={esOrganigrama}
        aria-label={esOrganigrama ? "Cambiar a tabla" : "Cambiar a organigrama"}
        onClick={() => onChange(esOrganigrama ? "tabla" : "organigrama")}
        className="relative h-9 w-[4.25rem] shrink-0 cursor-pointer rounded-full border-2 border-border bg-white p-0.5 dark:bg-card"
      >
        <motion.span
          className="absolute top-0.5 flex size-7 items-center justify-center rounded-full bg-celeste-trifinio/15"
          initial={false}
          animate={{ left: esOrganigrama ? "1.85rem" : "0.15rem" }}
          transition={{ duration: 0.22, ease: VISTA_EASE }}
        >
          <MorphHoverIcon
            from={esOrganigrama ? Network : Table2}
            to={esOrganigrama ? GitBranch : Rows3}
            hovered={hovered}
            size={15}
            color="#1a95d3"
            spring="snappy"
          />
        </motion.span>
      </button>
      <span
        className={cn(
          "text-xs font-black uppercase tracking-wider transition-colors",
          esOrganigrama ? "text-celeste-trifinio" : "text-muted-foreground",
        )}
      >
        Organigrama
      </span>
    </div>
  );
}

export function OrganizacionJerarquica() {
  const router = useRouter();
  const { effectiveRole } = useUserContext();
  const { data, isLoading, isError, refetch } = useEstructuraOrganizacional();
  const { data: puestos = [] } = usePuestos();
  const desasignarPersonaMutation = useAsignarPersonaAPuesto();
  const puedeEliminar = isSuperOrAdminRole(effectiveRole);

  const estructura = data ?? null;
  const [organigramaOpen, setOrganigramaOpen] = useState(false);

  const [crear, setCrear] = useState<{
    open: boolean;
    tipo: "departamento" | "puesto";
    parentId: string | null;
    departamentoId?: string;
  }>({ open: false, tipo: "departamento", parentId: null });

  const [editar, setEditar] = useState<{
    open: boolean;
    tipo: "departamento" | "puesto";
    id: string | null;
  }>({ open: false, tipo: "departamento", id: null });

  const [asignar, setAsignar] = useState<{
    open: boolean;
    puestoId: string | null;
    puestoNombre: string;
  }>({ open: false, puestoId: null, puestoNombre: "" });

  const [reubicar, setReubicar] = useState<{
    open: boolean;
    puestoId: string | null;
    puestoNombre: string;
    departamentoActualId: string | null;
  }>({
    open: false,
    puestoId: null,
    puestoNombre: "",
    departamentoActualId: null,
  });

  const abrirCrearDepartamento = (parentId: string | null = null) =>
    setCrear({ open: true, tipo: "departamento", parentId });

  const desasignarPersona = useCallback(
    async (puestoId: string, titularNombre: string) => {
      const result = await confirmarDesasignarPersona({
        title: "¿Desasignar persona?",
        text: `Se quitará a ${titularNombre} de este puesto.`,
      });
      if (!result.isConfirmed) return;

      const res = await desasignarPersonaMutation.mutateAsync({
        puesto_id: puestoId,
        profile_id: null,
      });

      if (res.success) {
        toast.success("Persona desasignada del puesto.");
        return;
      }

      toast.error(
        modalActionMessage(
          res.error ?? undefined,
          "No se pudo desasignar la persona.",
        ),
      );
    },
    [desasignarPersonaMutation],
  );

  const admin: AdminHandlers = useMemo(
    () => ({
      onAddDepartamento: (parentId) => abrirCrearDepartamento(parentId),
      onAddPuesto: (departamentoId) => {
        const enDep = puestosEnDepartamento(puestos, departamentoId);
        const tieneJefe = departamentoTieneJefe(puestos, departamentoId);
        if (enDep.length > 0 && !tieneJefe) {
          toast.warn(
            "Debe existir un jefe en esta dependencia antes de agregar más puestos.",
          );
          return;
        }
        setCrear({
          open: true,
          tipo: "puesto",
          parentId: null,
          departamentoId,
        });
      },
      onAsignarPersona: (puestoId, puestoNombre) => {
        setAsignar({ open: true, puestoId, puestoNombre });
      },
      onDesasignarPersona: (puestoId, _puestoNombre, titularNombre) => {
        void desasignarPersona(puestoId, titularNombre);
      },
      onReubicarPuesto: (puestoId, puestoNombre) => {
        const puesto = puestos.find((p) => p.id === puestoId);
        setReubicar({
          open: true,
          puestoId,
          puestoNombre,
          departamentoActualId: puesto?.departamento_id ?? null,
        });
      },
      onEdit: (tipo, id) => setEditar({ open: true, tipo, id }),
    }),
    [puestos, desasignarPersona],
  );

  const estaVacio = Boolean(
    estructura && (!estructura.hijos || estructura.hijos.length === 0),
  );

  useEffect(() => {
    if (!isSuperOrAdminRole(effectiveRole)) {
      router.replace("/siget");
    }
  }, [effectiveRole, router]);

  if (!isSuperOrAdminRole(effectiveRole)) {
    return null;
  }

  return (
    <div className="relative flex w-full flex-col px-0 pt-2 pb-3 md:px-4">
      <div className="relative z-10 mx-auto flex w-full flex-col gap-3">
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-3 px-3 lg:flex-nowrap lg:justify-between md:px-0">
          <div className="min-w-0 w-full flex-1 lg:w-auto">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-celeste-trifinio/30 bg-zinc-100 dark:bg-zinc-800">
                <MorphCycleIcon pairs={ORG_ICON_CYCLE} size={24} />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-celeste-trifinio">
                  Plan Trifinio
                </p>
                <h1 className="text-base font-black leading-tight tracking-tight text-foreground md:text-xl">
                  Organización Administrativa
                </h1>
              </div>
            </div>
          </div>

          {!isLoading && !isError && estructura && !estaVacio && (
            <div className="flex w-full justify-center lg:w-auto lg:shrink-0 lg:justify-end">
              <VistaSwitch
                vista={organigramaOpen ? "organigrama" : "tabla"}
                onChange={(next) => {
                  if (next === "organigrama") setOrganigramaOpen(true);
                  else setOrganigramaOpen(false);
                }}
              />
            </div>
          )}
        </div>

        {isLoading && <OrganizacionSkeleton />}

        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-none border border-border bg-card py-20 text-center max-md:border-x-0 md:rounded-xl dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm font-bold text-destructive">
              No se pudo verificar el acceso a la estructura.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <SigetActionButton
                label="Reintentar"
                accentColor={sigetAccent.editar}
                morphFrom={RefreshCw}
                morphTo={RotateCw}
                onClick={() => void refetch()}
                ariaLabel="Reintentar carga"
                className="w-auto shrink-0"
              />
              <SigetActionButton
                label="Crear"
                accentColor={sigetAccent.crear}
                morphFrom={Plus}
                morphTo={CirclePlus}
                onClick={() => abrirCrearDepartamento(null)}
                ariaLabel="Crear departamento"
                className="w-auto shrink-0"
              />
            </div>
          </div>
        )}

        {!isLoading && !isError && estructura && (
          <OrganizacionTree estructura={estructura} admin={admin} />
        )}

        {estructura ? (
          <OrganigramaModal
            open={organigramaOpen}
            onClose={() => setOrganigramaOpen(false)}
            estructura={estructura}
            admin={admin}
          />
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-50 dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] dark:opacity-40" />

      <CrearEstructura
        open={crear.open}
        onOpenChange={(open) => setCrear((prev) => ({ ...prev, open }))}
        tipo={crear.tipo}
        presetParentId={crear.parentId}
        presetDepartamentoId={crear.departamentoId}
      />

      <VerEditarEstructura
        open={editar.open}
        onOpenChange={(open) => setEditar((prev) => ({ ...prev, open }))}
        tipo={editar.tipo}
        id={editar.id}
        puedeEliminar={puedeEliminar}
      />

      <AsignarPersonaPuesto
        open={asignar.open}
        onOpenChange={(open) => setAsignar((prev) => ({ ...prev, open }))}
        puestoId={asignar.puestoId}
        puestoNombre={asignar.puestoNombre}
      />

      <ReubicarPuestoModal
        open={reubicar.open}
        onOpenChange={(open) => setReubicar((prev) => ({ ...prev, open }))}
        puestoId={reubicar.puestoId}
        puestoNombre={reubicar.puestoNombre}
        departamentoActualId={reubicar.departamentoActualId}
      />
    </div>
  );
}

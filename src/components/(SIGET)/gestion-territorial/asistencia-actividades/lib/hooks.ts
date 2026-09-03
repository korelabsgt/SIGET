"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createActividad,
  deleteActividad,
  deleteRegistro,
  getActividad,
  getActividades,
  getParticipantePorDpi,
  getRegistrosActividad,
  buscarDpisRegistrados,
  registrarAsistencia,
  updateActividad,
  updateRegistro,
  getUsuariosParaMinuta,
  getElaboroMinuta,
  getMinuta as getMinutaAction,
  guardarMinuta as guardarMinutaAction,
} from "./actions";
import type {
  ActividadFormValues,
  RegistroPublicoValues,
  RegistroEditValues,
  ActividadRecord,
  MinutaGuardarValues,
} from "./zod";
import type { MinutaEstado, MinutaRecord } from "./minuta";

const ACTIVIDADES_KEY = ["asist-actividades"];
const MINUTA_KEY = ["asist-minuta"];

export function useActividades() {
  return useQuery({
    queryKey: ACTIVIDADES_KEY,
    queryFn: getActividades,
  });
}

export function useActividad(id: string, enabled = true) {
  return useQuery({
    queryKey: [...ACTIVIDADES_KEY, id],
    queryFn: () => getActividad(id),
    enabled: enabled && !!id,
  });
}

export function useRegistrosActividad(actividadId: string, enabled = true) {
  return useQuery({
    queryKey: ["asist-registros", actividadId],
    queryFn: () => getRegistrosActividad(actividadId),
    enabled: enabled && !!actividadId,
  });
}

function useInvalidateActividades() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ACTIVIDADES_KEY });
  };
}

export function useCrearActividad() {
  const invalidate = useInvalidateActividades();
  return useMutation({
    mutationFn: (values: ActividadFormValues) => createActividad(values),
    onSuccess: invalidate,
  });
}

export function useEditarActividad() {
  const invalidate = useInvalidateActividades();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ActividadFormValues }) =>
      updateActividad(id, values),
    onSuccess: (_data, vars) => {
      invalidate();
      qc.invalidateQueries({ queryKey: [...ACTIVIDADES_KEY, vars.id] });
    },
  });
}

export function useEliminarActividad() {
  const invalidate = useInvalidateActividades();
  return useMutation({
    mutationFn: (id: string) => deleteActividad(id),
    onSuccess: invalidate,
  });
}

export function useBuscarParticipante() {
  return useMutation({
    mutationFn: (dpi: string) => getParticipantePorDpi(dpi),
  });
}

export function useDpisSugerencias(query: string) {
  const digits = query.replace(/\D/g, "");
  return useQuery({
    queryKey: ["asist-dpis-sugerencias", digits],
    queryFn: () => buscarDpisRegistrados(digits),
    enabled: digits.length >= 3,
    staleTime: 60_000,
  });
}

export function useRegistrarAsistencia() {
  return useMutation({
    mutationFn: (values: RegistroPublicoValues) => registrarAsistencia(values),
  });
}

export function useEliminarRegistro(actividadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRegistro(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["asist-registros", actividadId] });
      qc.invalidateQueries({ queryKey: ACTIVIDADES_KEY });
    },
  });
}

export function useEditarRegistro(actividadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: RegistroEditValues) => updateRegistro(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["asist-registros", actividadId] });
      qc.invalidateQueries({ queryKey: ACTIVIDADES_KEY });
    },
  });
}

export function useUsuariosMinuta(enabled = true) {
  return useQuery({
    queryKey: ["minuta-usuarios"],
    queryFn: getUsuariosParaMinuta,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useElaboroMinuta(enabled = true) {
  return useQuery({
    queryKey: ["minuta-elaboro"],
    queryFn: getElaboroMinuta,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

function minutaAValores(
  minuta: MinutaRecord,
  estado?: MinutaEstado,
): MinutaGuardarValues {
  return {
    actividadId: minuta.actividadId,
    institucion: minuta.institucion,
    elaboro: minuta.elaboro,
    estado: estado ?? minuta.estado,
    introduccion: minuta.introduccion,
    actividadesRealizadas: minuta.actividadesRealizadas,
    acuerdos: minuta.acuerdos,
    compromisosGenerales: minuta.compromisosGenerales,
    anexosNota: minuta.anexosNota,
    anexos: minuta.anexos,
  };
}

export function useMinutaBorrador(actividad: ActividadRecord | undefined) {
  const qc = useQueryClient();
  const actividadId = actividad?.id ?? "";

  const { data: remota } = useQuery({
    queryKey: [...MINUTA_KEY, actividadId],
    queryFn: () => getMinutaAction(actividadId),
    enabled: !!actividadId,
    staleTime: 30_000,
  });

  const guardar = useMutation({
    mutationFn: ({
      minuta,
      estado,
    }: {
      minuta: MinutaRecord;
      estado?: MinutaEstado;
    }) => guardarMinutaAction(minutaAValores(minuta, estado)),
  });

  const [minuta, setMinutaState] = useState<MinutaRecord | null>(null);
  const [listo, setListo] = useState(false);
  const minutaRef = useRef<MinutaRecord | null>(null);
  const sucioRef = useRef(false);
  const hidratadaRef = useRef("");
  const guardarRef = useRef(guardar.mutate);
  guardarRef.current = guardar.mutate;

  useEffect(() => {
    if (!actividadId) {
      hidratadaRef.current = "";
      minutaRef.current = null;
      sucioRef.current = false;
      setMinutaState(null);
      setListo(false);
    }
  }, [actividadId]);

  // Hidrata una sola vez por actividad para que un refetch no pise ediciones.
  useEffect(() => {
    if (!remota || !actividadId) return;
    if (hidratadaRef.current === actividadId) return;
    hidratadaRef.current = actividadId;
    minutaRef.current = remota;
    sucioRef.current = false;
    setMinutaState(remota);
    setListo(true);
  }, [remota, actividadId]);

  // Mantiene sincronizados los datos que vienen de la actividad.
  useEffect(() => {
    if (!actividad?.id || !listo) return;
    setMinutaState((prev) => {
      if (!prev) return prev;
      if (
        prev.actividadId === actividad.id &&
        prev.fecha === actividad.fecha_realizacion &&
        prev.actividadNombre === actividad.nombre
      ) {
        return prev;
      }
      const next = {
        ...prev,
        actividadId: actividad.id,
        fecha: actividad.fecha_realizacion,
        actividadNombre: actividad.nombre,
      };
      minutaRef.current = next;
      return next;
    });
  }, [actividad?.id, actividad?.fecha_realizacion, actividad?.nombre, listo]);

  const persistir = useCallback(
    (estado?: MinutaEstado) => {
      const actual = minutaRef.current;
      if (!actual?.actividadId) return;
      if (!sucioRef.current && !estado) return;
      sucioRef.current = false;
      guardarRef.current(
        { minuta: actual, estado },
        {
          onSuccess: () => {
            qc.invalidateQueries({
              queryKey: [...MINUTA_KEY, actual.actividadId],
            });
          },
        },
      );
    },
    [qc],
  );

  useEffect(() => {
    if (!listo || !minuta || !sucioRef.current) return;
    const id = window.setTimeout(() => persistir(), 1200);
    return () => clearTimeout(id);
  }, [minuta, listo, persistir]);

  useEffect(() => {
    return () => {
      if (sucioRef.current) persistir();
    };
  }, [persistir]);

  const setMinuta = useCallback((updater: SetStateAction<MinutaRecord>) => {
    setMinutaState((prev) => {
      if (!prev) return prev;
      const next = typeof updater === "function" ? updater(prev) : updater;
      minutaRef.current = next;
      sucioRef.current = true;
      return next;
    });
  }, []);

  const guardarMinuta = useCallback(
    (estado?: MinutaEstado) => persistir(estado ?? "borrador"),
    [persistir],
  );

  return {
    minuta,
    setMinuta: setMinuta as Dispatch<SetStateAction<MinutaRecord>>,
    listo,
    guardarMinuta,
    guardando: guardar.isPending,
  };
}

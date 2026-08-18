"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Pencil, Search, Trash2, FileSpreadsheet } from "lucide-react";
import { toast } from "react-toastify";
import type { RegistroAsistenciaRecord } from "./lib/zod";
import { formatoTelefonoVisible, telefonoWhatsAppUrl } from "./lib/zod";
import { useEliminarRegistro } from "./lib/hooks";
import { confirmQuitarActividad } from "./lib/swal";
import { downloadAsistenciaExcel } from "./lib/asistencia-excel";
import { EditarRegistro } from "./forms/EditarRegistro";

function formatFecha(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function celdaOpcional(value: string | null) {
  return value?.trim() ? value : "—";
}

function CeldaTelefono({ telefono }: { telefono: string | null }) {
  const url = telefonoWhatsAppUrl(telefono);
  if (!url) return <>—</>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="whitespace-nowrap font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
    >
      {formatoTelefonoVisible(telefono)}
    </a>
  );
}

export function TablaRegistros({
  registros,
  actividadId,
  nombreActividad,
  isLoading,
}: {
  registros: RegistroAsistenciaRecord[];
  actividadId: string;
  nombreActividad: string;
  isLoading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [editarRegistro, setEditarRegistro] =
    useState<RegistroAsistenciaRecord | null>(null);
  const eliminar = useEliminarRegistro(actividadId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return registros;
    return registros.filter(
      (r) =>
        r.dpi.includes(q) ||
        r.nombre.toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q) ||
        (r.telefono ?? "").includes(q.replace(/\D/g, "")) ||
        (r.institucion ?? "").toLowerCase().includes(q) ||
        (r.puesto ?? "").toLowerCase().includes(q),
    );
  }, [registros, search]);

  const handleDelete = async (id: string, nombre: string) => {
    const ok = await confirmQuitarActividad(
      `¿Eliminar el registro de ${nombre}?`,
    );
    if (!ok) return;
    setDeletingId(id);
    const res = await eliminar.mutateAsync(id);
    setDeletingId(null);
    if (res.success) {
      toast.success("Registro eliminado.");
    } else {
      toast.error("No se pudo eliminar el registro.");
    }
  };

  const handleExport = () => {
    if (registros.length === 0) {
      toast.warn("No hay registros para exportar.");
      return;
    }
    downloadAsistenciaExcel(registros, nombreActividad);
    toast.success("Excel descargado.");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border-2 border-celeste-trifinio bg-transparent pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio/30"
          />
        </div>
        {registros.length > 0 ? (
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-emerald-200 px-4 text-[10px] font-bold uppercase tracking-widest text-emerald-900 transition-colors hover:bg-emerald-300 active:scale-95 dark:bg-emerald-800/70 dark:text-emerald-50 dark:hover:bg-emerald-700/80"
          >
            <FileSpreadsheet className="size-4" />
            <span className="hidden sm:inline">Descargar Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {registros.length === 0
            ? "Aún no hay registros de asistencia."
            : "No se encontraron registros."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border dark:border-zinc-700">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:border-zinc-700 dark:bg-zinc-800">
                <th className="px-4 py-3">Fecha y hora</th>
                <th className="px-4 py-3">DPI</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Institución</th>
                <th className="px-4 py-3">Puesto</th>
                <th className="px-4 py-3">Género</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout" initial={false}>
                {filtered.map((r) => (
                  <motion.tr
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="border-b border-border last:border-0 dark:border-zinc-800"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {formatFecha(r.created_at)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums">
                      {r.dpi}
                    </td>
                    <td className="px-4 py-3 font-semibold">{r.nombre}</td>
                    <td className="px-4 py-3">{celdaOpcional(r.email)}</td>
                    <td className="px-4 py-3">
                      <CeldaTelefono telefono={r.telefono} />
                    </td>
                    <td className="px-4 py-3">{celdaOpcional(r.institucion)}</td>
                    <td className="px-4 py-3">{celdaOpcional(r.puesto)}</td>
                    <td className="px-4 py-3 capitalize">{r.genero}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditarRegistro(r)}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-sky-100 text-azul-trifinio hover:bg-sky-200 dark:bg-sky-950 dark:text-azul-trifinio dark:hover:bg-sky-900"
                          aria-label={`Editar registro de ${r.nombre}`}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id, r.nombre)}
                          disabled={deletingId === r.id}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                          aria-label={`Eliminar registro de ${r.nombre}`}
                        >
                          {deletingId === r.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      <EditarRegistro
        open={editarRegistro !== null}
        registro={editarRegistro}
        actividadId={actividadId}
        onClose={() => setEditarRegistro(null)}
      />
    </div>
  );
}

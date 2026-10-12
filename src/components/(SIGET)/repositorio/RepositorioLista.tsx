"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Ban,
  Check,
  Ellipsis,
  EllipsisVertical,
  Eye,
  FilePlus,
  Newspaper,
  Pencil,
  Send,
  SquarePen,
  Trash2,
} from "lucide";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { modalActionMessage } from "@/components/ui/general-modal";
import { cn } from "@/lib/utils";
import { formatFechaFilaTablaGt } from "@/lib/fechas-gt";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import {
  useAprobarDocumento,
  useBandejaRevision,
  useEliminarDocumento,
  useEnviarRevision,
  useMisDocumentos,
} from "./lib/hooks";
import {
  CHANNEL_LABELS,
  STATUS_LABELS,
  isLibraryAdminRole,
  rutaDetalleDocumento,
  rutaEditarDocumento,
  rutaNuevaNoticia,
  rutaNuevoDocumento,
} from "./lib/helpers";
import { confirmAprobarDocumento, confirmQuitarDocumento } from "./lib/swal";
import type { DocumentRecord } from "./lib/zod";
import { RechazarDocumento } from "./forms/Rechazar";

type TabRepositorio = "propios" | "revision";

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 15;

function StatusBadge({ status }: { status: DocumentRecord["publishing_status"] }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold",
        status === "aprobado" &&
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
        status === "en_revision" &&
          "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
        status === "borrador" &&
          "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
        status === "rechazado" &&
          "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function DocumentoAccionesMenu({
  doc,
  esAdmin,
  onReject,
  rowHovered,
}: {
  doc: DocumentRecord;
  esAdmin: boolean;
  onReject: (slug: string) => void;
  rowHovered: boolean;
}) {
  const router = useRouter();
  const enviar = useEnviarRevision();
  const aprobar = useAprobarDocumento();
  const eliminar = useEliminarDocumento();
  const publicHref = rutaDetalleDocumento(doc.channel, doc.slug);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-0 bg-sky-100 text-azul-trifinio transition-colors hover:bg-sky-200 dark:bg-sky-950 dark:hover:bg-sky-900"
          aria-label={`Opciones de ${doc.title}`}
        >
          <MorphHoverIcon
            from={EllipsisVertical}
            to={Ellipsis}
            hovered={rowHovered}
            size={18}
            color="#1a95d3"
            spring="snappy"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="left"
        align="center"
        sideOffset={8}
        className="z-[200] flex min-w-[9rem] flex-col gap-2 rounded-2xl border border-border bg-white p-2 opacity-100 shadow-lg dark:bg-zinc-900"
      >
        {doc.publishing_status !== "aprobado" ? (
          <SigetActionButton
            label="Editar"
            accentColor={sigetAccent.editar}
            morphFrom={Pencil}
            morphTo={SquarePen}
            onClick={() => {
              setMenuOpen(false);
              router.push(rutaEditarDocumento(doc.slug, doc.channel));
            }}
            className="w-full"
          />
        ) : publicHref ? (
          <SigetActionButton
            label="Ver"
            accentColor={sigetAccent.abrir}
            morphFrom={Eye}
            morphTo={Eye}
            morphOnHover={false}
            onClick={() => {
              setMenuOpen(false);
              router.push(publicHref);
            }}
            className="w-full"
          />
        ) : null}
        {doc.publishing_status === "borrador" || doc.publishing_status === "rechazado" ? (
          <SigetActionButton
            label="Revisión"
            accentColor={sigetAccent.crear}
            morphFrom={Send}
            morphTo={Send}
            morphOnHover={false}
            disabled={enviar.isPending}
            ariaLabel="Enviar a revisión"
            onClick={async () => {
              setMenuOpen(false);
              const res = await enviar.mutateAsync(doc.slug);
              if (!res.success) {
                toast.error(modalActionMessage(res.error ?? undefined, "No se pudo enviar."));
                return;
              }
              toast.success("Enviado a revisión.");
            }}
            className="w-full"
          />
        ) : null}
        {esAdmin && doc.publishing_status === "en_revision" ? (
          <>
            <SigetActionButton
              label="Aprobar"
              accentColor={sigetAccent.guardar}
              morphFrom={Check}
              morphTo={Check}
              morphOnHover={false}
              disabled={aprobar.isPending}
              onClick={async () => {
                setMenuOpen(false);
                const ok = await confirmAprobarDocumento(doc.title);
                if (!ok) return;
                const res = await aprobar.mutateAsync(doc.slug);
                if (!res.success) {
                  toast.error(modalActionMessage(res.error ?? undefined, "No se pudo aprobar."));
                  return;
                }
                toast.success("Publicación aprobada.");
              }}
              className="w-full"
            />
            <SigetActionButton
              label="Rechazar"
              accentColor={sigetAccent.quitar}
              morphFrom={Ban}
              morphTo={Ban}
              morphOnHover={false}
              onClick={() => {
                setMenuOpen(false);
                onReject(doc.slug);
              }}
              className="w-full"
            />
          </>
        ) : null}
        {doc.publishing_status !== "aprobado" || esAdmin ? (
          <SigetActionButton
            label="Quitar"
            accentColor={sigetAccent.quitar}
            morphFrom={Trash2}
            morphTo={Trash2}
            morphOnHover={false}
            disabled={eliminar.isPending}
            onClick={async () => {
              setMenuOpen(false);
              const ok = await confirmQuitarDocumento(doc.title);
              if (!ok) return;
              const res = await eliminar.mutateAsync(doc.slug);
              if (!res.success) {
                toast.error(modalActionMessage(res.error ?? undefined, "No se pudo eliminar."));
                return;
              }
              toast.success("Documento eliminado.");
            }}
            className="w-full"
          />
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TituloDocumentoCell({ doc }: { doc: DocumentRecord }) {
  const fecha = formatFechaFilaTablaGt(doc.publication_date);
  return (
    <div className="min-w-0 w-full">
      <p className="text-sm font-bold leading-snug text-foreground">{doc.title}</p>
      <p
        className="mt-1 text-xs font-semibold tabular-nums text-foreground/70"
        title={fecha}
      >
        {fecha}
      </p>
      {doc.summary.trim() ? (
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 whitespace-pre-wrap dark:text-zinc-400">
          {doc.summary}
        </p>
      ) : null}
      {doc.publishing_status === "rechazado" && doc.rejection_reason ? (
        <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium leading-relaxed text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {doc.rejection_reason}
        </p>
      ) : null}
    </div>
  );
}

function AutorDocumentoCell({ doc }: { doc: DocumentRecord }) {
  const creador = doc.created_by_nombre?.trim();
  const mostrarCreador = Boolean(creador && creador !== doc.author.trim());

  return (
    <div className="min-w-[7.5rem] max-w-[11rem] leading-snug">
      <p className="line-clamp-2 break-words text-sm font-semibold text-foreground">
        {doc.author}
      </p>
      {mostrarCreador ? (
        <p className="mt-1 line-clamp-2 break-words text-xs text-muted-foreground">
          Creó {creador}
        </p>
      ) : null}
    </div>
  );
}

export type RepositorioListaModo = "noticias" | "documentos";

function filtrarPorModo(docs: DocumentRecord[], modo: RepositorioListaModo): DocumentRecord[] {
  if (modo === "noticias") {
    return docs.filter((doc) => doc.channel === "noticia");
  }
  return docs.filter((doc) => doc.channel !== "noticia");
}

export function RepositorioLista({ modo }: { modo: RepositorioListaModo }) {
  const router = useRouter();
  const { effectiveRole } = useUserContext();
  const esAdmin = isLibraryAdminRole(effectiveRole);
  const [tab, setTab] = useState<TabRepositorio>("propios");
  const [rejectSlug, setRejectSlug] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const { data: propios = [], isLoading: loadingPropios } = useMisDocumentos();
  const { data: revision = [], isLoading: loadingRevision } = useBandejaRevision(esAdmin);

  const propiosFiltrados = useMemo(
    () => filtrarPorModo(propios, modo),
    [propios, modo],
  );
  const revisionFiltrada = useMemo(
    () => filtrarPorModo(revision, modo),
    [revision, modo],
  );

  const lista = tab === "revision" ? revisionFiltrada : propiosFiltrados;
  const loading = tab === "revision" ? loadingRevision : loadingPropios;

  const paginacionKey = `${tab}|${modo}|${pageSize}`;
  const [paginacionKeyPrevia, setPaginacionKeyPrevia] = useState(paginacionKey);
  if (paginacionKey !== paginacionKeyPrevia) {
    setPaginacionKeyPrevia(paginacionKey);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(lista.length / pageSize));
  const pageSafe = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return lista.slice(start, start + pageSize);
  }, [lista, pageSafe, pageSize]);

  const esNoticias = modo === "noticias";
  const rutaNueva = esNoticias ? rutaNuevaNoticia() : rutaNuevoDocumento();
  const labelNueva = esNoticias ? "Nueva Noticia" : "Documento";

  const tabs = useMemo(() => {
    const base: { id: TabRepositorio; label: string; count: number }[] = [
      {
        id: "propios",
        label: esNoticias ? "Mis noticias" : "Mis documentos",
        count: propiosFiltrados.length,
      },
    ];
    if (esAdmin) {
      base.push({
        id: "revision",
        label: "Bandeja",
        count: revisionFiltrada.length,
      });
    }
    return base;
  }, [esAdmin, esNoticias, propiosFiltrados.length, revisionFiltrada.length]);

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "relative inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg px-3 text-[10px] font-bold uppercase tracking-wider",
                  active ? "text-celeste-trifinio" : "text-muted-foreground",
                )}
              >
                {item.label}
                <span className="tabular-nums">{item.count}</span>
                {active ? (
                  <motion.span
                    layoutId="repositorio-tab-indicator"
                    className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-celeste-trifinio"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <SigetActionButton
            label={labelNueva}
            accentColor={sigetAccent.crear}
            morphFrom={esNoticias ? Newspaper : FilePlus}
            morphTo={esNoticias ? Newspaper : FilePlus}
            morphOnHover={false}
            onClick={() => router.push(rutaNueva)}
            className="w-auto shrink-0"
          />
        </div>
      </div>

      <div className="mx-4 mb-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900/40">
        <div className="h-1 w-full shrink-0 bg-celeste-trifinio" />
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
          </div>
        ) : lista.length === 0 ? (
          <p className="flex flex-1 items-center justify-center px-6 py-16 text-center text-sm text-muted-foreground">
            {tab === "revision"
              ? esNoticias
                ? "No hay noticias en revisión."
                : "No hay documentos en revisión."
              : esNoticias
                ? "Aún no has creado noticias."
                : "Aún no has cargado documentos."}
          </p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border bg-sky-50/80 text-[11px] font-bold text-celeste-trifinio dark:border-zinc-700 dark:bg-sky-950/30">
                    <th className="w-full min-w-[16rem] px-4 py-3 pl-4">Título y resumen</th>
                    <th className="w-0 whitespace-nowrap px-2 py-3">Autor</th>
                    <th className="w-0 whitespace-nowrap px-2 py-3 text-center">Tipo</th>
                    <th className="w-0 whitespace-nowrap px-2 py-3 pr-4 text-right">Acc.</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {pageItems.map((doc) => (
                      <motion.tr
                        key={doc.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        onMouseEnter={() => setHoveredRowId(doc.id)}
                        onMouseLeave={() => setHoveredRowId(null)}
                        className="border-b border-border hover:bg-sky-50/40 dark:border-zinc-800 dark:hover:bg-sky-950/20"
                      >
                        <td className="w-full align-top px-4 py-3 pl-4">
                          <TituloDocumentoCell doc={doc} />
                        </td>
                        <td className="px-2 py-3 align-middle">
                          <AutorDocumentoCell doc={doc} />
                        </td>
                        <td className="w-0 whitespace-nowrap px-2 py-3 align-middle text-center">
                          <div className="inline-flex flex-col items-center gap-1.5">
                            <span className="inline-flex rounded-lg bg-sky-50 px-2 py-1 text-[11px] font-semibold text-azul-trifinio dark:bg-sky-950/60 dark:text-[#6f9fd4]">
                              {CHANNEL_LABELS[doc.channel]}
                            </span>
                            <StatusBadge status={doc.publishing_status} />
                          </div>
                        </td>
                        <td
                          className="w-0 whitespace-nowrap px-2 py-3 pr-4 align-middle text-right"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <DocumentoAccionesMenu
                            doc={doc}
                            esAdmin={esAdmin}
                            onReject={setRejectSlug}
                            rowHovered={hoveredRowId === doc.id}
                          />
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-t border-border px-4 py-3 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageSafe <= 1}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-0 text-celeste-trifinio transition-colors hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-sky-950/40"
                aria-label="Página anterior"
              >
                <ChevronLeft className="size-5" />
              </button>
              <span className="min-w-[3.5rem] text-center text-sm font-bold tabular-nums text-celeste-trifinio">
                {pageSafe}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageSafe >= totalPages}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-0 text-celeste-trifinio transition-colors hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-sky-950/40"
                aria-label="Página siguiente"
              >
                <ChevronRight className="size-5" />
              </button>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-9 cursor-pointer rounded-lg border border-celeste-trifinio/40 bg-transparent px-2 text-sm font-bold text-celeste-trifinio outline-none focus:ring-2 focus:ring-celeste-trifinio/25"
                aria-label="Filas por página"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <RechazarDocumento
        open={Boolean(rejectSlug)}
        slug={rejectSlug ?? ""}
        onClose={() => setRejectSlug(null)}
      />
    </div>
  );
}

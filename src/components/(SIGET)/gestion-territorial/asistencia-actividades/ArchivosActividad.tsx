"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  Ellipsis,
  EllipsisVertical,
  ExternalLink,
  FolderPlus,
  Link2,
  Pencil,
  Plus,
  SquarePen,
  Trash,
  Trash2,
  Upload,
} from "lucide";
import {
  ChevronDown,
  ChevronRight,
  File,
  FileText,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  SigetActionButton,
  sigetAccent,
} from "@/components/ui/siget-action-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { modalActionMessage } from "@/components/ui/modal-toast";
import { cn } from "@/lib/utils";
import {
  armarArbolArchivos,
  contarArchivosPestana,
  ACT_ARCHIVOS_MAX_POR_PESTANA,
  esImagenMime,
  pesoArchivoLegible,
  type ArchivoArbol,
  type ArchivoNodo,
  type ArchivoVisibilidad,
} from "./lib/archivos";
import { rutaPublicaArchivos } from "./lib/helpers";
import {
  useAsegurarTokenArchivoNodo,
  useAsegurarTokenArchivosActividad,
  useArchivosActividad,
  useEliminarArchivoNodo,
  useUrlArchivoNodo,
} from "./lib/hooks";
import { confirmQuitarActividad } from "./lib/swal";
import { CrearCarpeta } from "./forms/CrearCarpeta";
import { EditarArchivo } from "./forms/EditarArchivo";
import { SubirArchivo } from "./forms/SubirArchivo";
import {
  QrEnlace,
  QrMini,
  QrPantallaCompleta,
  copiarEnlaceArchivo,
} from "./QrEnlace";

const ARCHIVOS_VACIOS: ArchivoNodo[] = [];

function iconoArchivo(nodo: ArchivoNodo) {
  if (nodo.tipo === "carpeta") return Folder;
  if (nodo.tipo === "enlace") return LinkIcon;
  if (esImagenMime(nodo.mime)) return ImageIcon;
  return FileText;
}

function urlOrigenArchivos(token: string) {
  if (typeof window === "undefined") return rutaPublicaArchivos(token);
  return `${window.location.origin}${rutaPublicaArchivos(token)}`;
}

function AccionesNodo({
  nodo,
  esCarpeta,
  publico,
  ocupado,
  onCrear,
  onSubir,
  onAbrir,
  onEnlace,
  onEditar,
  onQuitar,
  className,
}: {
  nodo: ArchivoNodo;
  esCarpeta: boolean;
  publico: boolean;
  ocupado: boolean;
  onCrear: (parentId: string) => void;
  onSubir: (parentId: string) => void;
  onAbrir: (nodo: ArchivoNodo) => void;
  onEnlace: (nodo: ArchivoNodo) => void;
  onEditar: (nodo: ArchivoNodo) => void;
  onQuitar: (nodo: ArchivoNodo) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {esCarpeta ? (
        <>
          <SigetActionButton
            label="Crear"
            accentColor={sigetAccent.crear}
            morphFrom={FolderPlus}
            morphTo={Plus}
            onClick={() => onCrear(nodo.id)}
            ariaLabel="Crear carpeta dentro"
            className="w-auto shrink-0"
          />
          <SigetActionButton
            label="Subir"
            accentColor={sigetAccent.crear}
            morphFrom={Upload}
            morphTo={Plus}
            onClick={() => onSubir(nodo.id)}
            ariaLabel="Subir archivo a esta carpeta"
            className="w-auto shrink-0"
          />
        </>
      ) : (
        <SigetActionButton
          label="Abrir"
          accentColor={sigetAccent.abrir}
          morphFrom={ExternalLink}
          morphTo={ArrowUpRight}
          onClick={() => onAbrir(nodo)}
          ariaLabel="Abrir archivo"
          className="w-auto shrink-0"
        />
      )}
      {publico ? (
        <SigetActionButton
          label="Enlace"
          accentColor={sigetAccent.enlace}
          morphFrom={Link2}
          morphTo={Check}
          onClick={() => onEnlace(nodo)}
          ariaLabel="Copiar enlace público"
          className="w-auto shrink-0"
        />
      ) : null}
      <SigetActionButton
        label="Editar"
        accentColor={sigetAccent.editar}
        morphFrom={Pencil}
        morphTo={SquarePen}
        onClick={() => onEditar(nodo)}
        ariaLabel="Editar nombre y descripción"
        className="w-auto shrink-0"
      />
      <SigetActionButton
        label="Quitar"
        accentColor={sigetAccent.quitar}
        morphFrom={Trash2}
        morphTo={Trash}
        onClick={() => onQuitar(nodo)}
        disabled={ocupado}
        ariaLabel={esCarpeta ? "Eliminar carpeta" : "Eliminar archivo"}
        className="w-auto shrink-0"
      />
    </div>
  );
}

function NodoFila({
  nodo,
  profundidad,
  expandidos,
  onToggle,
  visibilidad,
  pendingId,
  onCrear,
  onSubir,
  onAbrir,
  onEnlace,
  onQr,
  onQuitar,
  onEditar,
}: {
  nodo: ArchivoArbol;
  profundidad: number;
  expandidos: Set<string>;
  onToggle: (id: string) => void;
  visibilidad: ArchivoVisibilidad;
  pendingId: string | null;
  onCrear: (parentId: string) => void;
  onSubir: (parentId: string) => void;
  onAbrir: (nodo: ArchivoNodo) => void;
  onEnlace: (nodo: ArchivoNodo) => void;
  onQr: (nodo: ArchivoNodo) => void;
  onQuitar: (nodo: ArchivoNodo) => void;
  onEditar: (nodo: ArchivoNodo) => void;
}) {
  const abierto = expandidos.has(nodo.id);
  const esCarpeta = nodo.tipo === "carpeta";
  const Icono = esCarpeta ? (abierto ? FolderOpen : Folder) : iconoArchivo(nodo);
  const publico = visibilidad === "publico";
  const ocupado = pendingId === nodo.id;

  return (
    <motion.li layout className="min-w-0">
      <div
        className="flex items-stretch gap-3 rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900"
        style={{ marginLeft: profundidad * 16 }}
      >
        {publico ? (
          <QrMini
            onClick={() => onQr(nodo)}
            ariaLabel="Ampliar código QR"
          />
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <button
          type="button"
          onClick={() => (esCarpeta ? onToggle(nodo.id) : onAbrir(nodo))}
          className="flex min-w-0 w-full cursor-pointer items-start gap-2 border-0 bg-transparent p-0 text-left"
        >
          {esCarpeta ? (
            abierto ? (
              <ChevronDown className="mt-0.5 size-4 shrink-0 text-celeste-trifinio" />
            ) : (
              <ChevronRight className="mt-0.5 size-4 shrink-0 text-celeste-trifinio" />
            )
          ) : (
            <Icono className="mt-0.5 size-4 shrink-0 text-celeste-trifinio" />
          )}
          {!esCarpeta ? null : (
            <Icono className="mt-0.5 size-4 shrink-0 text-celeste-trifinio" />
          )}
          <span className="min-w-0 flex-1 break-words text-sm font-bold text-foreground">
            {nodo.nombre}
          </span>
        </button>

        {nodo.descripcion ? (
          <p className="line-clamp-3 min-w-0 break-words text-xs text-muted-foreground">
            {nodo.descripcion}
          </p>
        ) : null}

        {nodo.tipo === "archivo" ? (
          <p className="min-w-0 break-all text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {[nodo.nombre_archivo, pesoArchivoLegible(nodo.tamano)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
        {nodo.tipo === "enlace" ? (
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Enlace
          </p>
        ) : null}

        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span className="inline-flex">
                <SigetActionButton
                  label="Opciones"
                  accentColor={sigetAccent.editar}
                  morphFrom={EllipsisVertical}
                  morphTo={Ellipsis}
                  ariaLabel="Ver opciones"
                  className="w-auto shrink-0"
                />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="left"
              align="end"
              className="z-[200] min-w-[8.5rem] border border-border bg-white p-2 opacity-100 dark:bg-zinc-900"
            >
              <AccionesNodo
                nodo={nodo}
                esCarpeta={esCarpeta}
                publico={publico}
                ocupado={ocupado}
                onCrear={onCrear}
                onSubir={onSubir}
                onAbrir={onAbrir}
                onEnlace={onEnlace}
                onEditar={onEditar}
                onQuitar={onQuitar}
                className="flex-col items-stretch [&_button]:w-full"
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </div>
      </div>

      {esCarpeta && abierto ? (
        <ul className="mt-2 space-y-2">
          <AnimatePresence initial={false}>
            {nodo.hijos.length === 0 ? (
              <li
                className="text-xs text-muted-foreground"
                style={{ marginLeft: (profundidad + 1) * 16 }}
              >
                Carpeta vacía
              </li>
            ) : (
              nodo.hijos.map((hijo) => (
                <NodoFila
                  key={hijo.id}
                  nodo={hijo}
                  profundidad={profundidad + 1}
                  expandidos={expandidos}
                  onToggle={onToggle}
                  visibilidad={visibilidad}
                  pendingId={pendingId}
                  onCrear={onCrear}
                  onSubir={onSubir}
                  onAbrir={onAbrir}
                  onEnlace={onEnlace}
                  onQr={onQr}
                  onQuitar={onQuitar}
                  onEditar={onEditar}
                />
              ))
            )}
          </AnimatePresence>
        </ul>
      ) : null}
    </motion.li>
  );
}

export function ArchivosActividad({
  actividadId,
  fechaRealizacion,
  nombreActividad,
  visibilidad,
  tokenActividad,
}: {
  actividadId: string;
  fechaRealizacion: string;
  nombreActividad: string;
  visibilidad: ArchivoVisibilidad;
  tokenActividad: string | null;
}) {
  const { data, isLoading, isError } = useArchivosActividad(actividadId);
  const nodos = data ?? ARCHIVOS_VACIOS;
  const eliminar = useEliminarArchivoNodo(actividadId);
  const tokenNodo = useAsegurarTokenArchivoNodo(actividadId);
  const tokenTodos = useAsegurarTokenArchivosActividad(actividadId);
  const urlArchivo = useUrlArchivoNodo();

  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [carpetaParentId, setCarpetaParentId] = useState<string | null>(null);
  const [carpetaOpen, setCarpetaOpen] = useState(false);
  const [subirParentId, setSubirParentId] = useState<string | null>(null);
  const [subirOpen, setSubirOpen] = useState(false);
  const [qr, setQr] = useState<{ url: string; titulo: string } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editarNodo, setEditarNodo] = useState<ArchivoNodo | null>(null);

  const visibles = useMemo(
    () => nodos.filter((n) => n.visibilidad === visibilidad),
    [nodos, visibilidad],
  );
  const arbol = useMemo(() => armarArbolArchivos(visibles), [visibles]);
  const usados = contarArchivosPestana(visibles);
  const lleno = usados >= ACT_ARCHIVOS_MAX_POR_PESTANA;

  useEffect(() => {
    const ids = visibles
      .filter((n) => n.tipo === "carpeta")
      .map((n) => n.id);
    setExpandidos((prev) => {
      if (
        ids.length === prev.size &&
        ids.every((id) => prev.has(id))
      ) {
        return prev;
      }
      return new Set(ids);
    });
  }, [visibles]);

  const tokenGaleria = tokenActividad;
  const urlGaleria = tokenGaleria ? urlOrigenArchivos(tokenGaleria) : "";

  useEffect(() => {
    if (visibilidad !== "publico" || tokenActividad) return;
    tokenTodos.mutate();
  }, [visibilidad, tokenActividad, tokenTodos.mutate]);

  const abrirCarpeta = (parentId: string | null) => {
    setCarpetaParentId(parentId);
    setCarpetaOpen(true);
  };

  const abrirSubir = (parentId: string | null) => {
    if (lleno) {
      toast.warn(`Máximo ${ACT_ARCHIVOS_MAX_POR_PESTANA} archivos en esta pestaña.`);
      return;
    }
    setSubirParentId(parentId);
    setSubirOpen(true);
  };

  const toggle = (id: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAbrir = async (nodo: ArchivoNodo) => {
    if (nodo.tipo === "carpeta") return;
    const res = await urlArchivo.mutateAsync(nodo.id);
    if (!res.success || !res.url) {
      toast.error(modalActionMessage(res.error ?? undefined, "No se pudo abrir el archivo."));
      return;
    }
    window.open(res.url, "_blank", "noopener,noreferrer");
  };

  const tokenDeNodo = async (nodo: ArchivoNodo) => {
    if (nodo.token_publico) return nodo.token_publico;
    const res = await tokenNodo.mutateAsync(nodo.id);
    if (!res.success || !res.token) {
      toast.error(modalActionMessage(res.error ?? undefined, "No se pudo generar el enlace."));
      return null;
    }
    return res.token;
  };

  const handleEnlace = async (nodo: ArchivoNodo) => {
    const token = await tokenDeNodo(nodo);
    if (!token) return;
    await copiarEnlaceArchivo(urlOrigenArchivos(token));
  };

  const handleQr = async (nodo: ArchivoNodo) => {
    const token = await tokenDeNodo(nodo);
    if (!token) return;
    setQr({
      url: urlOrigenArchivos(token),
      titulo: nodo.nombre,
    });
  };

  const handleQuitar = async (nodo: ArchivoNodo) => {
    const ok = await confirmQuitarActividad(
      nodo.tipo === "carpeta"
        ? `¿Eliminar la carpeta “${nodo.nombre}” y todo su contenido?`
        : `¿Eliminar el archivo “${nodo.nombre}”?`,
    );
    if (!ok) return;
    setPendingId(nodo.id);
    const res = await eliminar.mutateAsync(nodo.id);
    setPendingId(null);
    if (res.success) {
      toast.success(nodo.tipo === "carpeta" ? "Carpeta eliminada." : "Archivo eliminado.");
    } else {
      toast.error(modalActionMessage(res.error ?? undefined, "No se pudo eliminar."));
    }
  };

  const publico = visibilidad === "publico";
  const tituloVacio = publico
    ? "Aún no hay archivos públicos"
    : "Aún no hay archivos privados";

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-stretch">
      {publico ? (
        <div className="flex min-h-[320px] w-full min-w-0 flex-col rounded-3xl border border-slate-200/70 bg-white p-6 dark:border-zinc-800 dark:bg-card lg:basis-[34%] lg:shrink-0">
          {urlGaleria ? (
            <QrEnlace
              url={urlGaleria}
              titulo={`Archivos de ${nombreActividad}`}
            />
          ) : tokenTodos.isError || tokenTodos.data?.success === false ? (
            <p className="m-auto max-w-xs text-center text-sm text-muted-foreground">
              No se pudo crear el enlace público. Ejecuta el SQL de archivos en
              Supabase e intenta de nuevo.
            </p>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
            </div>
          )}
        </div>
      ) : null}

      <div
        className={cn(
          "flex min-w-0 flex-col rounded-3xl border border-slate-200/70 bg-white p-5 dark:border-zinc-800 dark:bg-card",
          publico ? "lg:min-w-0 lg:basis-[66%]" : "w-full",
        )}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {publico ? "Archivos públicos" : "Archivos privados"}
            </p>
            <p className="text-sm font-bold text-foreground">
              {usados}/{ACT_ARCHIVOS_MAX_POR_PESTANA} archivos
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SigetActionButton
              label="Crear"
              accentColor={sigetAccent.crear}
              morphFrom={FolderPlus}
              morphTo={Plus}
              onClick={() => abrirCarpeta(null)}
              ariaLabel="Crear carpeta"
              className="w-auto shrink-0"
            />
            <SigetActionButton
              label="Subir"
              accentColor={sigetAccent.crear}
              morphFrom={Upload}
              morphTo={Plus}
              onClick={() => abrirSubir(null)}
              disabled={lleno}
              ariaLabel="Subir archivo o agregar enlace"
              className="w-auto shrink-0"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
          </div>
        ) : isError ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 py-16 text-center dark:border-zinc-700">
            <p className="text-sm font-bold text-foreground">
              No se pudieron cargar los archivos
            </p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Ejecuta el SQL db/act_archivos.sql en Supabase y recarga la
              página.
            </p>
          </div>
        ) : arbol.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 py-16 text-center dark:border-zinc-700">
            <File className="mb-3 size-8 text-celeste-trifinio/70" />
            <p className="text-sm font-bold text-foreground">{tituloVacio}</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Crea una carpeta, sube un archivo de hasta 10 MB, o pega un
              enlace de Drive si pesa más.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {arbol.map((nodo) => (
                <NodoFila
                  key={nodo.id}
                  nodo={nodo}
                  profundidad={0}
                  expandidos={expandidos}
                  onToggle={toggle}
                  visibilidad={visibilidad}
                  pendingId={pendingId}
                  onCrear={abrirCarpeta}
                  onSubir={abrirSubir}
                  onAbrir={handleAbrir}
                  onEnlace={handleEnlace}
                  onQr={handleQr}
                  onQuitar={handleQuitar}
                  onEditar={setEditarNodo}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <CrearCarpeta
        open={carpetaOpen}
        onClose={() => setCarpetaOpen(false)}
        actividadId={actividadId}
        visibilidad={visibilidad}
        parentId={carpetaParentId}
      />
      <SubirArchivo
        open={subirOpen}
        onClose={() => setSubirOpen(false)}
        actividadId={actividadId}
        fechaRealizacion={fechaRealizacion}
        visibilidad={visibilidad}
        parentId={subirParentId}
      />
      <EditarArchivo
        open={editarNodo !== null}
        onClose={() => setEditarNodo(null)}
        actividadId={actividadId}
        nodo={editarNodo}
      />
      <QrPantallaCompleta
        open={qr !== null}
        onClose={() => setQr(null)}
        url={qr?.url ?? ""}
        titulo={qr?.titulo ?? ""}
      />
    </div>
  );
}

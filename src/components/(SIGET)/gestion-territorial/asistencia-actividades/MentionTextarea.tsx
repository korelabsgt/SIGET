"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { useEditor, EditorContent, ReactRenderer, type Editor } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Mention from "@tiptap/extension-mention";
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import { AnimatePresence, motion } from "framer-motion";
import { List, ListOrdered } from "lucide";
import { cn } from "@/lib/utils";
import { modalFieldClass } from "@/components/ui/general-modal";
import { RippleButton } from "@/components/ui/ripple-button";
import {
  SigetActionButton,
  sigetAccent,
  sigetBtnSurface,
} from "@/components/ui/siget-action-button";
import type { MinutaUsuarioOpcion } from "./lib/actions";
import {
  MINUTA_MENCION_ETIQUETA,
  type MinutaMencionTipo,
} from "./lib/minuta";

/**
 * Fija los atributos del nodo de mención para que `extraerMenciones` pueda
 * leer siempre `data-id` (con prefijo de tipo) y `data-label` del HTML.
 */
const MencionMinuta = Mention.extend({
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) =>
          attributes.id ? { "data-id": String(attributes.id) } : {},
      },
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-label"),
        renderHTML: (attributes) =>
          attributes.label ? { "data-label": String(attributes.label) } : {},
      },
      tipo: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-tipo"),
        renderHTML: (attributes) =>
          attributes.tipo ? { "data-tipo": String(attributes.tipo) } : {},
      },
    };
  },
});


function MinutaFormatoAtajoButton({
  label,
  letra,
  letraClassName,
  accentColor,
  ariaLabel,
  onClick,
  active,
  className,
  variant = "default",
}: {
  label: string;
  letra: string;
  letraClassName: string;
  accentColor: string;
  ariaLabel: string;
  onClick: () => void;
  active: boolean;
  className?: string;
  variant?: "default" | "flotante";
}) {
  const esFlotante = variant === "flotante";
  const colorTexto = esFlotante
    ? active
      ? "#2c5f9b"
      : "#ffffff"
    : accentColor;

  return (
    <RippleButton
      type="button"
      rippleColor={esFlotante ? "rgba(255,255,255,0.35)" : "#E5E7EB"}
      onClick={onClick}
      aria-label={ariaLabel}
      role="switch"
      aria-checked={active}
      className={cn(
        esFlotante
          ? cn(
              "h-9 min-w-0 border-2 px-2.5 py-0 text-xs font-bold shadow-none",
              active
                ? "border-white bg-white hover:bg-white/95"
                : "border-white/35 bg-white/15 hover:bg-white/25",
            )
          : sigetBtnSurface,
        "w-auto shrink-0",
        className,
      )}
    >
      <span className="inline-flex w-full max-w-full items-center justify-center gap-1 leading-none">
        <span
          className="truncate text-xs font-bold leading-none"
          style={{ color: colorTexto }}
        >
          {label}
        </span>
        <span
          className={cn(
            "inline-flex size-5 shrink-0 items-center justify-center text-sm leading-none",
            letraClassName,
          )}
          style={{ color: colorTexto }}
          aria-hidden
        >
          {letra}
        </span>
      </span>
    </RippleButton>
  );
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

type MentionListProps = SuggestionProps<MinutaUsuarioOpcion> & {
  query: string;
};

type MentionListHandle = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

function seleccionarMencion(
  command: MentionListProps["command"],
  opcion: MinutaUsuarioOpcion,
) {
  command({
    id: opcion.mencionId,
    label: opcion.nombre,
    tipo: opcion.tipo,
  });
}

const MENCION_TIPO_CLASE: Record<MinutaMencionTipo, string> = {
  usuario: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200",
  departamento:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
  puesto: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
};

const MentionList = forwardRef(function MentionList(
  { items, command, query }: MentionListProps,
  ref: Ref<MentionListHandle>,
) {
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    setHighlight(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowDown") {
        setHighlight((h) => (h + 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "ArrowUp") {
        setHighlight(
          (h) => (h - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1),
        );
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        const item = items[highlight];
        if (item) seleccionarMencion(command, item);
        return true;
      }
      return false;
    },
  }));

  if (query.length < 3) return null;

  return (
    <div className="max-h-60 w-80 overflow-y-auto rounded-lg border border-zinc-200/80 bg-white opacity-100 dark:border-zinc-700 dark:bg-zinc-900">
      {items.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">
          Sin coincidencias
        </p>
      ) : (
        items.map((opcion, index) => (
          <button
            key={opcion.mencionId}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => seleccionarMencion(command, opcion)}
            className={cn(
              "flex w-full cursor-pointer flex-col gap-0.5 px-3 py-2 text-left transition-colors",
              index === highlight
                ? "bg-sky-50 dark:bg-sky-950/50"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-800",
            )}
          >
            <span className="flex items-center gap-2">
              <span className="min-w-0 truncate text-sm font-semibold text-[#2c5f9b] dark:text-[#6f9fd4]">
                @{opcion.nombre}
              </span>
              <span
                className={cn(
                  "ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  MENCION_TIPO_CLASE[opcion.tipo],
                )}
              >
                {MINUTA_MENCION_ETIQUETA[opcion.tipo]}
              </span>
            </span>
            {opcion.detalle || opcion.dependencia ? (
              <span className="truncate text-xs text-muted-foreground">
                {[opcion.detalle, opcion.dependencia]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            ) : null}
          </button>
        ))
      )}
    </div>
  );
});

function posicionarPopup(
  el: HTMLElement,
  clientRect: (() => DOMRect | null) | null | undefined,
) {
  const rect = clientRect?.();
  if (!rect) return;
  el.style.position = "fixed";
  el.style.left = `${rect.left}px`;
  el.style.top = `${rect.bottom + 6}px`;
  el.style.zIndex = "210";
}

function crearSugerencias(
  usuariosRef: React.MutableRefObject<MinutaUsuarioOpcion[]>,
): Omit<SuggestionOptions<MinutaUsuarioOpcion>, "editor"> {
  return {
    char: "@",
    allowSpaces: true,
    items: ({ query }) => {
      if (query.length < 3) return [];
      const term = normalizeSearchText(query);
      return usuariosRef.current
        .filter((opcion) =>
          normalizeSearchText(
            [opcion.nombre, opcion.detalle, opcion.dependencia].join(" "),
          ).includes(term),
        )
        .slice(0, 12);
    },
    render: () => {
      let component: ReactRenderer<MentionListHandle, MentionListProps> | null =
        null;
      let popup: HTMLElement | null = null;

      return {
        onStart: (props) => {
          component = new ReactRenderer(MentionList, {
            editor: props.editor,
            props,
          });
          popup = component.element as HTMLElement;
          document.body.appendChild(popup);
          posicionarPopup(popup, props.clientRect);
        },
        onUpdate: (props) => {
          component?.updateProps(props);
          if (popup) posicionarPopup(popup, props.clientRect);
        },
        onKeyDown: (props) => {
          if (props.event.key === "Escape") {
            popup?.remove();
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },
        onExit: () => {
          popup?.remove();
          component?.destroy();
          popup = null;
          component = null;
        },
      };
    },
  };
}

const AtajosFormatoMinuta = Extension.create({
  name: "atajosFormatoMinuta",
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      "Mod-n": () => this.editor.commands.toggleBold(),
      "Mod-k": () => this.editor.commands.toggleItalic(),
    };
  },
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        props: {
          handleKeyDown(_view, event) {
            if (event.altKey || event.shiftKey) return false;
            const mod = event.ctrlKey || event.metaKey;
            if (!mod) return false;
            const key = event.key.toLowerCase();
            if (key === "n") {
              event.preventDefault();
              return editor.commands.toggleBold();
            }
            if (key === "k") {
              event.preventDefault();
              return editor.commands.toggleItalic();
            }
            return false;
          },
        },
      }),
    ];
  },
});

export function MinutaFormatToolbar({
  editor,
  marcador,
  toolbarExtra,
  className,
  vertical = false,
  variant = "default",
  unaLinea = false,
}: {
  editor: Editor | null;
  marcador?: string;
  toolbarExtra?: React.ReactNode;
  className?: string;
  vertical?: boolean;
  variant?: "default" | "flotante";
  unaLinea?: boolean;
}) {
  const [, setTick] = useState(0);
  const esFlotante = variant === "flotante";
  const botonFlotanteClass = esFlotante
    ? cn(
        "shrink-0 border-white/35 bg-white/15 text-white shadow-none hover:bg-white/25",
        vertical ? "w-full" : "w-auto",
      )
    : cn("shrink-0", vertical ? "w-full" : "w-auto");

  useEffect(() => {
    if (!editor) return;
    const refresh = () => setTick((n) => n + 1);
    editor.on("selectionUpdate", refresh);
    editor.on("transaction", refresh);
    return () => {
      editor.off("selectionUpdate", refresh);
      editor.off("transaction", refresh);
    };
  }, [editor]);

  return (
    <div
      className={cn(
        "flex gap-1.5",
        unaLinea
          ? "w-auto flex-nowrap items-center justify-center"
          : vertical
            ? "flex-col items-stretch"
            : "w-full flex-wrap items-center justify-center",
        className,
      )}
      onPointerDown={(e) => e.preventDefault()}
    >
      {marcador ? (
        <span className="mr-0.5 shrink-0 text-xs font-black tabular-nums text-[#2c5f9b] dark:text-[#6f9fd4]">
          {marcador}
        </span>
      ) : null}
      <div
        className={cn(
          unaLinea ? "flex flex-nowrap items-center gap-1.5" : "flex flex-wrap items-center gap-1.5",
          esFlotante ? "justify-center" : undefined,
          marcador ? "ml-auto" : toolbarExtra ? "ml-auto" : undefined,
        )}
      >
        <MinutaFormatoAtajoButton
          label="Negrita"
          letra="N"
          letraClassName="font-black"
          accentColor={
            editor?.isActive("bold") ? sigetAccent.activa : sigetAccent.editar
          }
          active={editor?.isActive("bold") ?? false}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          ariaLabel="Negrita (Control+N)"
          className={vertical ? "w-full" : undefined}
          variant={variant}
        />
        <MinutaFormatoAtajoButton
          label="Cursiva"
          letra="K"
          letraClassName="italic"
          accentColor={
            editor?.isActive("italic") ? sigetAccent.activa : sigetAccent.editar
          }
          active={editor?.isActive("italic") ?? false}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          ariaLabel="Cursiva (Control+K)"
          className={vertical ? "w-full" : undefined}
          variant={variant}
        />
        <SigetActionButton
          label="Viñetas"
          accentColor={
            esFlotante
              ? editor?.isActive("bulletList")
                ? "#2c5f9b"
                : "#ffffff"
              : editor?.isActive("bulletList")
                ? sigetAccent.activa
                : sigetAccent.editar
          }
          morphFrom={List}
          morphTo={List}
          morphOnHover={false}
          role="switch"
          ariaChecked={editor?.isActive("bulletList") ?? false}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          ariaLabel="Lista con viñetas"
          className={cn(
            botonFlotanteClass,
            esFlotante &&
              (editor?.isActive("bulletList")
                ? "border-white bg-white hover:bg-white/95"
                : undefined),
          )}
        />
        <SigetActionButton
          label="Números"
          accentColor={
            esFlotante
              ? editor?.isActive("orderedList")
                ? "#2c5f9b"
                : "#ffffff"
              : editor?.isActive("orderedList")
                ? sigetAccent.activa
                : sigetAccent.editar
          }
          morphFrom={ListOrdered}
          morphTo={ListOrdered}
          morphOnHover={false}
          role="switch"
          ariaChecked={editor?.isActive("orderedList") ?? false}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          ariaLabel="Lista numerada"
          className={cn(
            botonFlotanteClass,
            esFlotante &&
              (editor?.isActive("orderedList")
                ? "border-white bg-white hover:bg-white/95"
                : undefined),
          )}
        />
        {toolbarExtra ? (
          <div className="flex shrink-0">{toolbarExtra}</div>
        ) : null}
      </div>
    </div>
  );
}

function MinutaFormatoInlineBar({
  editor,
  className,
}: {
  editor: Editor;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
      className={cn(
        "overflow-hidden border-b border-zinc-200/80 bg-zinc-100/80 dark:border-zinc-700 dark:bg-zinc-800/70",
        className,
      )}
      onPointerDown={(e) => e.preventDefault()}
    >
      <div className="flex justify-center px-1 py-1.5">
        <MinutaFormatToolbar editor={editor} unaLinea />
      </div>
    </motion.div>
  );
}

export function MentionTextarea({
  id,
  value,
  onChange,
  usuarios,
  className,
  minRows = 3,
  placeholder,
  siempreNegrita = false,
  menciones = true,
  marcador,
  toolbarExtra,
  onEditorReady,
  filaAnchoCompleto = false,
  redimensionable = true,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  usuarios: MinutaUsuarioOpcion[];
  className?: string;
  minRows?: number;
  placeholder?: string;
  siempreNegrita?: boolean;
  menciones?: boolean;
  marcador?: string;
  toolbarExtra?: React.ReactNode;
  onEditorReady?: (editor: Editor) => void;
  filaAnchoCompleto?: boolean;
  redimensionable?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [enfocado, setEnfocado] = useState(false);
  const usuariosRef = useRef(usuarios);
  usuariosRef.current = usuarios;
  const lastHtml = useRef(value);
  const [, setTick] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
      }),
      AtajosFormatoMinuta,
      Underline,
      Placeholder.configure({
        placeholder: placeholder ?? "",
      }),
      ...(menciones
        ? [
            MencionMinuta.configure({
              HTMLAttributes: {
                class: "minuta-mention",
              },
              suggestion: crearSugerencias(usuariosRef),
            }),
          ]
        : []),
    ],
    content: value,
    editorProps: {
      attributes: {
        id: id ?? "",
        class: cn(
          "minuta-editor min-w-0 py-2 text-sm text-foreground outline-none",
          marcador ? "px-0" : filaAnchoCompleto ? "px-3 sm:px-5" : "px-3",
          className,
        ),
      },
    },
    onUpdate: ({ editor: instance }) => {
      const html = instance.isEmpty ? "" : instance.getHTML();
      lastHtml.current = html;
      onChange(html);
    },
    onSelectionUpdate: () => setTick((n) => n + 1),
    onTransaction: () => setTick((n) => n + 1),
  });

  useEffect(() => {
    if (!editor) return;
    onEditorReady?.(editor);
    const onFocus = () => setEnfocado(true);
    const onBlur = () => {
      window.setTimeout(() => {
        const activo = document.activeElement;
        if (rootRef.current?.contains(activo)) return;
        setEnfocado(false);
      }, 0);
    };
    editor.on("focus", onFocus);
    editor.on("blur", onBlur);
    return () => {
      editor.off("focus", onFocus);
      editor.off("blur", onBlur);
    };
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.shiftKey) return;
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;
      const key = event.key.toLowerCase();
      if (key === "n") {
        event.preventDefault();
        event.stopPropagation();
        editor.commands.toggleBold();
      } else if (key === "k") {
        event.preventDefault();
        event.stopPropagation();
        editor.commands.toggleItalic();
      }
    };
    dom.addEventListener("keydown", onKeyDown, true);
    return () => dom.removeEventListener("keydown", onKeyDown, true);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    if (value === lastHtml.current) return;
    lastHtml.current = value;
    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  const minHeight = `${Math.max(minRows, 1) * 1.5 + 0.5}rem`;
  const mostrarFormatoInline = redimensionable && enfocado && editor;

  return (
    <div
      ref={rootRef}
      className={cn(
        redimensionable ? "overflow-visible" : "overflow-hidden",
        filaAnchoCompleto
          ? "rounded-none border-0 bg-transparent shadow-none"
          : cn("rounded-lg", modalFieldClass),
      )}
    >
      {marcador ? (
        <div className={filaAnchoCompleto ? "bg-white dark:bg-zinc-900" : undefined}>
          <AnimatePresence initial={false}>
            {mostrarFormatoInline ? (
              <MinutaFormatoInlineBar
                key="formato-inline"
                editor={editor}
                className={filaAnchoCompleto ? "px-3 sm:px-5" : "px-3"}
              />
            ) : null}
          </AnimatePresence>
          <div
            className={cn(
              "flex items-start gap-2",
              filaAnchoCompleto ? "px-3 pb-2 sm:px-5" : "px-3 py-2",
            )}
          >
            <span className="mt-2 shrink-0 text-xs font-black tabular-nums text-[#2c5f9b] dark:text-[#6f9fd4]">
              {marcador}
            </span>
            <EditorContent
              editor={editor}
              className={cn(
                "minuta-editor-shell min-w-0 flex-1",
                redimensionable && "minuta-editor-resize",
                siempreNegrita && "minuta-editor-negrita",
              )}
              style={{ ["--minuta-editor-min-h" as string]: minHeight }}
            />
            {toolbarExtra ? (
              <div className="mt-0.5 flex shrink-0">{toolbarExtra}</div>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <AnimatePresence initial={false}>
            {mostrarFormatoInline ? (
              <MinutaFormatoInlineBar
                key="formato-inline"
                editor={editor}
                className={cn(
                  filaAnchoCompleto ? "px-3 sm:px-5" : "px-3",
                )}
              />
            ) : null}
          </AnimatePresence>
          <EditorContent
            editor={editor}
            className={cn(
              "minuta-editor-shell",
              redimensionable && "minuta-editor-resize",
              siempreNegrita && "minuta-editor-negrita",
              filaAnchoCompleto && "bg-white dark:bg-zinc-900",
            )}
            style={{ ["--minuta-editor-min-h" as string]: minHeight }}
          />
        </>
      )}
    </div>
  );
}

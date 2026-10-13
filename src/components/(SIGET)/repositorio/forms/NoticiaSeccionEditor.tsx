"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide";
import {
  SigetActionButton,
  sigetAccent,
  sigetBtnSurface,
} from "@/components/ui/siget-action-button";
import { modalFieldClass } from "@/components/ui/general-modal";
import { cn } from "@/lib/utils";

const colorTexto = sigetAccent.editar;
const colorLista = sigetAccent.guardar;
const toolbarCuadrado = cn(sigetBtnSurface, "size-9 w-9 min-w-9 shrink-0 p-0");

const URL_EN_TEXTO = /(?:https?:\/\/|www\.)[^\s<>"']+/gi;

function hrefDesdeTexto(raw: string): string | null {
  const limpio = raw.replace(/[.,;:!?)\]]+$/g, "");
  if (!/\.[a-z]{2,}(?:[/:?#]|$)/i.test(limpio)) return null;
  if (/^https?:\/\//i.test(limpio)) return limpio;
  if (/^www\./i.test(limpio)) return `https://${limpio}`;
  return null;
}

function enlazarHtml(html: string): string {
  return html.replace(
    /(<a\b[^>]*>[\s\S]*?<\/a>)|((?:https?:\/\/|www\.)[^\s<]+)/gi,
    (full, ancla: string | undefined, url: string | undefined) => {
      if (ancla) return ancla;
      if (!url) return full;
      const visible = url.replace(/[.,;:!?)\]]+$/g, "");
      const href = hrefDesdeTexto(visible);
      if (!href) return full;
      const resto = url.slice(visible.length);
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" title="Clic para abrir">${visible}</a>${resto}`;
    },
  );
}

function HistorialButton({
  icon,
  ariaLabel,
  disabled,
  onClick,
}: {
  icon: typeof Undo2;
  ariaLabel: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <SigetActionButton
      type="button"
      label=""
      iconOnly
      accentColor={colorTexto}
      morphFrom={icon}
      morphTo={icon}
      morphOnHover={false}
      ariaLabel={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={toolbarCuadrado}
    />
  );
}

function FormatoButton({
  label,
  active,
  color,
  icon,
  onClick,
  ariaLabel,
}: {
  label: string;
  active: boolean;
  color: string;
  icon: typeof Bold;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <SigetActionButton
      type="button"
      label={label}
      accentColor={color}
      morphFrom={icon}
      morphTo={icon}
      morphOnHover={false}
      role="switch"
      ariaChecked={active}
      ariaLabel={ariaLabel}
      onClick={onClick}
      className={cn(
        "h-9 w-auto shrink-0",
        active && "border-current bg-sky-50 dark:bg-sky-950/40",
      )}
    />
  );
}

export function NoticiaSeccionEditor({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = "Texto de la sección",
  minHeight = "5rem",
}: {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  minHeight?: string;
}) {
  const lastHtml = useRef(value);
  const enlazando = useRef(false);
  const [, setHistorialTick] = useState(0);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
        link: false,
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
          title: "Clic para abrir",
          class: "noticia-enlace",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "",
    editable: !disabled,
    editorProps: {
      attributes: {
        id: id ?? "",
        class: "minuta-editor min-w-0 px-3 py-2 text-sm text-foreground outline-none",
      },
    },
    onTransaction: () => {
      setHistorialTick((tick) => tick + 1);
    },
    onUpdate: ({ editor: instance }) => {
      if (enlazando.current) return;
      const html = instance.isEmpty ? "" : instance.getHTML();
      const ligado = html ? enlazarHtml(html) : "";
      if (ligado !== html) {
        enlazando.current = true;
        const pos = instance.state.selection.from;
        instance
          .chain()
          .setMeta("addToHistory", false)
          .setContent(ligado, { emitUpdate: false })
          .setTextSelection(Math.min(pos, instance.state.doc.content.size))
          .run();
        enlazando.current = false;
      }
      const finalHtml = instance.isEmpty ? "" : instance.getHTML();
      lastHtml.current = finalHtml;
      onChange(finalHtml);
    },
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    if (value === lastHtml.current) return;
    lastHtml.current = value;
    editor
      .chain()
      .setMeta("addToHistory", false)
      .setContent(value || "", { emitUpdate: false })
      .run();
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      if (event.key === "z" && !event.shiftKey) {
        if (!editor.can().undo()) return;
        event.preventDefault();
        editor.chain().focus().undo().run();
        return;
      }
      if (event.key === "y" || (event.key === "z" && event.shiftKey)) {
        if (!editor.can().redo()) return;
        event.preventDefault();
        editor.chain().focus().redo().run();
      }
    };
    dom.addEventListener("keydown", onKeyDown);
    return () => dom.removeEventListener("keydown", onKeyDown);
  }, [editor]);

  const puedeDeshacer = editor?.can().undo() ?? false;
  const puedeRehacer = editor?.can().redo() ?? false;

  return (
    <div className={cn("overflow-hidden rounded-lg", modalFieldClass, disabled && "opacity-60")}>
      <div
        className="flex flex-wrap items-center gap-1 border-b border-zinc-200/80 bg-zinc-100/80 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800/70"
        onPointerDown={(event) => event.preventDefault()}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-start gap-1">
          <FormatoButton
            label="Negrita"
            color={colorTexto}
            icon={Bold}
            active={editor?.isActive("bold") ?? false}
            ariaLabel="Negrita"
            onClick={() => editor?.chain().focus().toggleBold().run()}
          />
          <FormatoButton
            label="Cursiva"
            color={colorTexto}
            icon={Italic}
            active={editor?.isActive("italic") ?? false}
            ariaLabel="Cursiva"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          />
          <FormatoButton
            label="Subrayado"
            color={colorTexto}
            icon={UnderlineIcon}
            active={editor?.isActive("underline") ?? false}
            ariaLabel="Subrayado"
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          />
          <FormatoButton
            label="Viñetas"
            color={colorLista}
            icon={List}
            active={editor?.isActive("bulletList") ?? false}
            ariaLabel="Lista con viñetas"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          />
          <FormatoButton
            label="Números"
            color={colorLista}
            icon={ListOrdered}
            active={editor?.isActive("orderedList") ?? false}
            ariaLabel="Lista numerada"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-0">
          <HistorialButton
            icon={Undo2}
            ariaLabel="Deshacer"
            disabled={!puedeDeshacer || disabled}
            onClick={() => editor?.chain().focus().undo().run()}
          />
          <HistorialButton
            icon={Redo2}
            ariaLabel="Rehacer"
            disabled={!puedeRehacer || disabled}
            onClick={() => editor?.chain().focus().redo().run()}
          />
        </div>
      </div>
      <EditorContent
        editor={editor}
        className="minuta-editor-shell"
        style={{ ["--minuta-editor-min-h" as string]: minHeight }}
      />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDownToLine, Download } from "lucide";
import {
  Download as DownloadIcon,
  FileText,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { cn } from "@/lib/utils";

type ExportOption = {
  id: string;
  label: string;
  description: string;
  icon: typeof FileText;
  iconClass: string;
  onSelect: () => void | Promise<void>;
};

type OrganigramaToolbarHint = {
  label: string;
  color: string;
} | null;

export type { OrganigramaToolbarHint };

const SEGMENT_BTN =
  "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-none border-0 bg-transparent shadow-none transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio/40 dark:hover:bg-zinc-800/80";

const SEGMENT_BTN_COMPACT =
  "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-none border-0 bg-transparent shadow-none transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio/40 dark:hover:bg-zinc-800/80";

export function OrganigramaExportMenu({
  options,
  disabled = false,
  iconOnly = false,
  segmented = false,
  compact = false,
  onHintChange,
}: {
  options: ExportOption[];
  disabled?: boolean;
  iconOnly?: boolean;
  segmented?: boolean;
  compact?: boolean;
  onHintChange?: (hint: OrganigramaToolbarHint) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const syncMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 8, left: rect.left });
  };

  const toggleOpen = () => {
    if (disabled || busyId !== null) return;
    setOpen((prev) => {
      const next = !prev;
      if (next) syncMenuPosition();
      return next;
    });
  };

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    const onReposition = () => syncMenuPosition();

    const timer = window.setTimeout(() => {
      window.addEventListener("pointerdown", onPointerDown);
    }, 0);

    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  const handleSelect = async (opt: ExportOption) => {
    if (busyId) return;
    setBusyId(opt.id);
    try {
      await opt.onSelect();
    } finally {
      setBusyId(null);
      setOpen(false);
    }
  };

  const menu =
    open && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: menuPos.top, left: menuPos.left }}
            className="fixed z-[300] w-56 overflow-hidden rounded-2xl border border-border/60 bg-zinc-100 shadow-xl dark:bg-zinc-800"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border/50 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Formato
              </p>
            </div>
            <ul className="py-1">
              {options.map((opt) => {
                const Icon = opt.icon;
                const loading = busyId === opt.id;
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={busyId !== null}
                      onClick={() => void handleSelect(opt)}
                      className="flex w-full cursor-pointer items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-celeste-trifinio/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg bg-card",
                          opt.iconClass,
                        )}
                      >
                        {loading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Icon className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-foreground">
                          {opt.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                          {opt.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative",
        segmented && (compact ? "flex h-8 items-stretch" : "flex h-9 items-stretch"),
      )}
      data-org-toolbar=""
      onPointerDown={(e) => e.stopPropagation()}
    >
      {iconOnly && segmented ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleOpen}
          disabled={disabled || busyId !== null}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Descargar organigrama"
          aria-busy={busyId !== null ? true : undefined}
          onPointerEnter={() =>
            onHintChange?.({ label: "Descargar", color: sigetAccent.excel })
          }
          onPointerLeave={() => onHintChange?.(null)}
          className={cn(
            compact ? SEGMENT_BTN_COMPACT : SEGMENT_BTN,
            (disabled || busyId !== null) && "pointer-events-none opacity-60",
          )}
        >
          {busyId ? (
            <Loader2
              className="size-4 animate-spin"
              style={{ color: sigetAccent.excel }}
            />
          ) : (
            <DownloadIcon
              className="size-4"
              style={{ color: sigetAccent.excel }}
              strokeWidth={1.75}
            />
          )}
        </button>
      ) : iconOnly ? (
        <SigetActionButton
          label="Descargar"
          iconOnly
          accentColor={sigetAccent.excel}
          morphFrom={Download}
          morphTo={ArrowDownToLine}
          onClick={toggleOpen}
          disabled={disabled || busyId !== null}
          ariaLabel="Descargar organigrama"
          ariaBusy={busyId !== null}
          className="shrink-0"
        />
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleOpen}
          disabled={disabled || busyId !== null}
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "flex cursor-pointer items-center gap-1.5 rounded-xl border border-celeste-trifinio/40 bg-card px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-celeste-trifinio transition-colors hover:bg-celeste-trifinio/10 md:px-3 md:text-xs",
            (disabled || busyId !== null) && "cursor-not-allowed opacity-60",
          )}
        >
          {busyId ? (
            <Loader2 className="size-4 shrink-0 animate-spin" />
          ) : (
            <DownloadIcon className="size-4 shrink-0" />
          )}
          <span>{busyId ? "Generando..." : "Descargar"}</span>
        </button>
      )}

      {menu}
    </div>
  );
}

export const organigramaExportIcons = {
  pdf: FileText,
  image: ImageIcon,
};

"use client";

import { Children, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export {
  modalActionMessage,
  MODAL_ACTION_ERRORS,
  toast,
} from "@/components/ui/modal-toast";

const MODAL_GRADIENT_SIZE = 380;

export function ModalLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={cn(
        "text-sm font-semibold leading-none text-foreground/70",
        className,
      )}
    />
  );
}

export function ModalInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "flex h-10 w-full rounded-lg border-2 border-celeste-trifinio bg-transparent px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio/30 transition-all outline-none",
        className,
      )}
    />
  );
}

export function ModalTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "flex min-h-20 w-full rounded-lg border-2 border-celeste-trifinio bg-transparent px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio/30 transition-all outline-none resize-none",
        className,
      )}
    />
  );
}

export function ModalSubmit({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      {...props}
      className={cn(
        "flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-emerald-200 px-6 text-[10px] font-bold uppercase tracking-widest text-emerald-900 transition-colors hover:bg-emerald-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-800/70 dark:text-emerald-50 dark:hover:bg-emerald-700/80",
        className,
      )}
    />
  );
}

export function ModalFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const multiAction = Children.count(children) > 1;

  return (
    <div
      className={cn(
        "mt-5 -mx-4 md:-mx-6 -mb-4 md:-mb-6 flex w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] gap-3 rounded-b-[calc(1.5rem-3px)] bg-zinc-100 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:bg-zinc-800 md:px-6 md:pb-6",
        multiAction
          ? "[&>*]:flex [&>*]:min-w-0 [&>*]:flex-1 [&>*]:justify-center"
          : "justify-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ModalConfirmDelete({
  message,
  onConfirm,
  onCancel,
  pending = false,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
}) {
  return (
    <div className="space-y-3 rounded-xl border-2 border-amber-300 bg-amber-100 p-4 dark:border-amber-800 dark:bg-amber-950">
      <p className="text-sm font-semibold text-foreground">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border-0 bg-zinc-200 px-6 text-[10px] font-bold uppercase tracking-widest text-zinc-700 transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-red-100 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-600 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Sí, eliminar"}
        </button>
      </div>
    </div>
  );
}

function ModalFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const mouseX = useMotionValue(-MODAL_GRADIENT_SIZE);
  const mouseY = useMotionValue(-MODAL_GRADIENT_SIZE);

  const reset = useCallback(() => {
    mouseX.set(-MODAL_GRADIENT_SIZE);
    mouseY.set(-MODAL_GRADIENT_SIZE);
  }, [mouseX, mouseY]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY],
  );

  const glowBackground = useMotionTemplate`
    radial-gradient(${MODAL_GRADIENT_SIZE}px circle at ${mouseX}px ${mouseY}px,
    #1a95d3,
    #5ec8f0,
    transparent 72%)
  `;

  return (
    <div
      className={cn(
        "group relative h-full md:rounded-3xl md:p-[3px] md:shadow-sm",
        className,
      )}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden rounded-3xl md:block"
        style={{ background: glowBackground }}
      />
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-zinc-100 max-md:rounded-none dark:bg-zinc-800 md:rounded-[calc(1.5rem-3px)]">
        {children}
      </div>
    </div>
  );
}

export function ModalShell({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[200] flex bg-zinc-100 dark:bg-zinc-900 max-md:flex-col md:items-center md:justify-center md:bg-zinc-700/20 md:p-4 md:backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "relative flex min-h-0 w-full flex-col max-md:h-dvh max-md:max-w-none",
              maxWidth,
            )}
          >
            <ModalFrame>
              <div className="flex shrink-0 items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] md:p-6 md:pt-6">
                <div className="min-w-0 pr-3">
                  <h3 className="truncate text-lg font-bold tracking-tight text-foreground md:text-xl">
                    {title}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="-mr-1 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-celeste-trifinio transition-colors hover:bg-celeste-trifinio/10"
                  aria-label="Cerrar"
                >
                  <X size={22} strokeWidth={2.25} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-100 p-4 dark:bg-zinc-900 md:p-6">
                {children}
              </div>
            </ModalFrame>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

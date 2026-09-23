"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Ban, Check, Save, Trash, Trash2, X } from "lucide";
import { X as XIcon } from "lucide-react";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import {
  formatFechaManualGt,
  parseFechaManualGt,
} from "@/lib/fechas-gt";
import { cn } from "@/lib/utils";

const MODAL_SHELL_EASE = [0.22, 1, 0.36, 1] as const;

const MODAL_SHELL_TRANSITION = {
  duration: 0.24,
  ease: MODAL_SHELL_EASE,
} as const;

function lockBodyScroll() {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  const prevOverflow = document.body.style.overflow;
  const prevPaddingRight = document.body.style.paddingRight;

  document.body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }

  return () => {
    document.body.style.overflow = prevOverflow;
    document.body.style.paddingRight = prevPaddingRight;
  };
}

export {
  modalActionMessage,
  MODAL_ACTION_ERRORS,
  toast,
} from "@/components/ui/modal-toast";

export const modalFieldClass =
  "border border-zinc-200/80 dark:border-zinc-700 focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-400/25 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-500/30";

export const modalAccentClass = "font-bold text-[#2c5f9b] dark:text-[#6f9fd4]";

const modalInputBaseClass =
  "flex h-10 w-full rounded-lg bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:outline-none";

const modalTextareaBaseClass =
  "flex min-h-20 w-full resize-none rounded-lg bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:outline-none";

export function ModalForm({
  className,
  children,
  ...props
}: React.FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form {...props} className={cn("space-y-4", className)}>
      {children}
    </form>
  );
}

export function ModalField({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("space-y-2.5", className)}>{children}</div>;
}

export function ModalLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={cn("text-sm leading-none", modalAccentClass, className)}
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
      className={cn(modalInputBaseClass, modalFieldClass, className)}
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
      className={cn(modalTextareaBaseClass, modalFieldClass, className)}
    />
  );
}

export function ModalFechaInput({
  value,
  onChange,
  id,
  required,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
  className?: string;
}) {
  const [dia, setDia] = useState("");
  const [mes, setMes] = useState("");
  const [anio, setAnio] = useState("");
  const diaRef = useRef<HTMLInputElement>(null);
  const mesRef = useRef<HTMLInputElement>(null);
  const anioRef = useRef<HTMLInputElement>(null);
  const enFoco = useRef(false);

  useEffect(() => {
    if (enFoco.current) return;
    const formatted = formatFechaManualGt(value);
    if (!formatted) {
      if (!value) {
        setDia("");
        setMes("");
        setAnio("");
      }
      return;
    }
    const [d, m, y] = formatted.split("/");
    setDia(d ?? "");
    setMes(m ?? "");
    setAnio(y ?? "");
  }, [value]);

  const emitir = (d: string, m: string, y: string) => {
    if (!d && !m && !y) {
      onChange("");
      return;
    }
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      const parsed = parseFechaManualGt(`${d}/${m}/${y}`);
      if (parsed) onChange(parsed);
    }
  };

  const soloDigitos = (raw: string, max: number) =>
    raw.replace(/\D/g, "").slice(0, max);

  const aplicarPegado = (texto: string) => {
    const digits = texto.replace(/\D/g, "").slice(0, 8);
    if (!digits) return;
    const d = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    const y = digits.slice(4, 8);
    setDia(d);
    setMes(m);
    setAnio(y);
    emitir(d, m, y);
    if (y.length === 4) anioRef.current?.focus();
    else if (m.length === 2) anioRef.current?.focus();
    else if (d.length === 2) mesRef.current?.focus();
  };

  return (
    <div
      className={cn(
        modalInputBaseClass,
        modalFieldClass,
        "items-center gap-1 px-3",
        className,
      )}
    >
      <input
        id={id}
        ref={diaRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="DD"
        maxLength={2}
        required={required}
        aria-label="Día"
        value={dia}
        onFocus={() => {
          enFoco.current = true;
        }}
        onBlur={() => {
          enFoco.current = false;
        }}
        onPaste={(e) => {
          e.preventDefault();
          aplicarPegado(e.clipboardData.getData("text"));
        }}
        onChange={(e) => {
          const next = soloDigitos(e.target.value, 2);
          setDia(next);
          emitir(next, mes, anio);
          if (next.length === 2) mesRef.current?.focus();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" && (diaRef.current?.selectionStart ?? 0) >= dia.length) {
            e.preventDefault();
            mesRef.current?.focus();
          }
        }}
        className="w-8 bg-transparent text-center text-sm outline-none placeholder:text-muted-foreground"
      />
      <span className="text-muted-foreground">/</span>
      <input
        ref={mesRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="MM"
        maxLength={2}
        aria-label="Mes"
        value={mes}
        onFocus={() => {
          enFoco.current = true;
        }}
        onBlur={() => {
          enFoco.current = false;
        }}
        onPaste={(e) => {
          e.preventDefault();
          aplicarPegado(e.clipboardData.getData("text"));
        }}
        onChange={(e) => {
          const next = soloDigitos(e.target.value, 2);
          setMes(next);
          emitir(dia, next, anio);
          if (next.length === 2) anioRef.current?.focus();
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && mes === "") {
            e.preventDefault();
            diaRef.current?.focus();
          }
          if (e.key === "ArrowLeft" && (mesRef.current?.selectionStart ?? 0) === 0) {
            e.preventDefault();
            diaRef.current?.focus();
          }
          if (e.key === "ArrowRight" && (mesRef.current?.selectionStart ?? 0) >= mes.length) {
            e.preventDefault();
            anioRef.current?.focus();
          }
        }}
        className="w-8 bg-transparent text-center text-sm outline-none placeholder:text-muted-foreground"
      />
      <span className="text-muted-foreground">/</span>
      <input
        ref={anioRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="AAAA"
        maxLength={4}
        aria-label="Año"
        value={anio}
        onFocus={() => {
          enFoco.current = true;
        }}
        onBlur={() => {
          enFoco.current = false;
        }}
        onPaste={(e) => {
          e.preventDefault();
          aplicarPegado(e.clipboardData.getData("text"));
        }}
        onChange={(e) => {
          const next = soloDigitos(e.target.value, 4);
          setAnio(next);
          emitir(dia, mes, next);
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && anio === "") {
            e.preventDefault();
            mesRef.current?.focus();
          }
          if (e.key === "ArrowLeft" && (anioRef.current?.selectionStart ?? 0) === 0) {
            e.preventDefault();
            mesRef.current?.focus();
          }
        }}
        className="w-12 bg-transparent text-center text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

export function ModalCancelButton({
  onClick,
  disabled,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <SigetActionButton
      label="Cancelar"
      accentColor={sigetAccent.cancelar}
      morphFrom={X}
      morphTo={Ban}
      onClick={onClick}
      disabled={disabled}
      className={cn("w-auto shrink-0", className)}
    />
  );
}

export function ModalSubmit({
  disabled,
  className,
  label = "Guardar",
}: {
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <SigetActionButton
      label={label}
      accentColor={sigetAccent.guardar}
      morphFrom={Save}
      morphTo={Check}
      disabled={disabled}
      type="submit"
      className={cn("w-auto shrink-0", className)}
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
  return (
    <div
      className={cn(
        "mt-auto flex shrink-0 flex-wrap items-center justify-center gap-3 border-t border-zinc-200/80 bg-zinc-100 px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-700 dark:bg-zinc-800",
        "max-md:w-full max-md:rounded-b-none",
        "md:mt-3 md:-mx-6 md:-mb-6 md:w-[calc(100%+3rem)] md:rounded-b-3xl md:pb-4",
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
        <ModalCancelButton onClick={onCancel} disabled={pending} />
        <SigetActionButton
          label="Eliminar"
          accentColor={sigetAccent.quitar}
          morphFrom={Trash2}
          morphTo={Trash}
          onClick={onConfirm}
          disabled={pending}
          ariaLabel="Confirmar eliminación"
          className="w-auto shrink-0"
        />
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
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-zinc-100 shadow-lg max-md:rounded-none max-md:border-0 dark:border-zinc-700 dark:bg-zinc-800",
        className,
      )}
    >
      {children}
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
  fullscreen = false,
  fullHeight = false,
  contentClassName,
  headerActions,
  headerActionsAlign = "end",
  headerClassName,
  hideCloseButton = false,
  hideHeaderOnMobile = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  fullscreen?: boolean;
  fullHeight?: boolean;
  contentClassName?: string;
  headerActions?: ReactNode;
  headerActionsAlign?: "start" | "end";
  headerClassName?: string;
  hideCloseButton?: boolean;
  hideHeaderOnMobile?: boolean;
}) {
  const [contentScrollable, setContentScrollable] = useState(false);

  useEffect(() => {
    if (!open) {
      setContentScrollable(false);
      return;
    }
    setContentScrollable(false);
    return lockBodyScroll();
  }, [open]);

  if (typeof document === "undefined") return null;

  const shellEnter = fullscreen
    ? { opacity: 0 }
    : fullHeight
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.97 };
  const shellAnimate = fullscreen
    ? { opacity: 1 }
    : fullHeight
      ? { opacity: 1 }
      : { opacity: 1, scale: 1 };
  const shellExit = shellEnter;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          className={cn(
            "fixed inset-0 z-[200] flex flex-col overflow-hidden",
            fullscreen
              ? "bg-zinc-100 dark:bg-zinc-900"
              : fullHeight
                ? "max-md:bg-zinc-100 max-md:dark:bg-zinc-900 md:items-center md:justify-center md:p-4"
                : "max-md:flex-col max-md:bg-zinc-100 max-md:dark:bg-zinc-900 md:items-center md:justify-center md:p-4",
          )}
        >
          {!fullscreen ? (
            <div
              aria-hidden
              className="absolute inset-0 hidden bg-black/40 backdrop-blur-xl md:block dark:bg-black/55"
            />
          ) : null}
          <motion.div
            initial={shellEnter}
            animate={shellAnimate}
            exit={shellExit}
            transition={MODAL_SHELL_TRANSITION}
            onAnimationComplete={() => {
              setContentScrollable(true);
            }}
            className={cn(
              "relative z-10 flex min-h-0 w-full flex-col",
              fullscreen && "h-dvh max-w-none",
              fullHeight &&
                cn(
                  "max-md:h-dvh max-md:min-h-0 max-md:flex-1 max-md:max-w-none",
                  "md:mx-auto md:h-auto md:max-h-[calc(100dvh-2rem)] md:w-full",
                  maxWidth,
                ),
              !fullscreen &&
                !fullHeight &&
                cn("max-md:h-dvh max-md:min-h-0 max-md:flex-1 max-md:max-w-none", maxWidth),
            )}
          >
            <ModalFrame
              className={cn(
                fullscreen &&
                  "rounded-none border-0 shadow-none dark:bg-zinc-900 md:rounded-none",
                fullHeight && "max-md:h-full md:h-auto",
              )}
            >
              <div
                className={cn(
                  "flex shrink-0 items-center gap-3 border-b border-zinc-200/80 bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] dark:border-zinc-700 dark:bg-zinc-900 md:gap-4 md:px-6 md:py-4",
                  hideHeaderOnMobile && "max-md:hidden",
                  headerClassName,
                )}
              >
                {title || subtitle ? (
                  <div className="min-w-0 shrink">
                    {title ? (
                      <h3
                        className={cn(
                          "truncate text-lg tracking-tight md:text-xl",
                          modalAccentClass,
                        )}
                      >
                        {title}
                      </h3>
                    ) : null}
                    {subtitle ? (
                      <p
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          modalAccentClass,
                        )}
                      >
                        {subtitle}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {headerActions ? (
                  <div
                    className={cn(
                      "flex min-w-0 items-center",
                      headerActionsAlign === "end"
                        ? "min-w-0 flex-1 justify-end"
                        : "justify-start",
                    )}
                  >
                    {headerActions}
                  </div>
                ) : null}
                {!hideCloseButton ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="-mr-1 ml-auto flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-celeste-trifinio transition-colors hover:bg-celeste-trifinio/10"
                    aria-label="Cerrar"
                  >
                    <XIcon size={22} strokeWidth={2.25} />
                  </button>
                ) : null}
              </div>

              <div
                className={cn(
                  "min-h-0 flex-1 overflow-x-hidden bg-white dark:bg-zinc-900",
                  contentScrollable ? "overflow-y-auto overscroll-contain" : "overflow-hidden",
                  contentClassName ??
                    cn(
                      fullscreen &&
                        "flex flex-col items-center justify-center p-4 md:p-6",
                      fullHeight && "flex min-h-0 flex-1 flex-col p-4 md:p-6",
                      !fullscreen && !fullHeight && "p-4 md:p-6",
                    ),
                )}
              >
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

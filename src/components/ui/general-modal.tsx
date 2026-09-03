"use client";

import { useEffect, useState, type ReactNode } from "react";
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
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setInputValue(formatFechaManualGt(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, "");
    if (digits.length > 8) digits = digits.slice(0, 8);

    let formatted = digits;
    if (digits.length > 2 && digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }

    setInputValue(formatted);

    if (formatted.length === 10) {
      const parsed = parseFechaManualGt(formatted);
      if (parsed) onChange(parsed);
      return;
    }

    if (formatted === "") onChange("");
  };

  return (
    <ModalInput
      id={id}
      type="text"
      inputMode="numeric"
      placeholder="DD/MM/AAAA"
      value={inputValue}
      onChange={handleChange}
      required={required}
      className={className}
    />
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
        "mt-3 -mx-4 md:-mx-6 -mb-4 md:-mb-6 flex w-[calc(100%+2rem)] flex-wrap items-center justify-center gap-3 rounded-b-3xl border-t border-zinc-200/80 bg-zinc-100 px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] max-md:rounded-b-none dark:border-zinc-700 dark:bg-zinc-800 md:w-[calc(100%+3rem)] md:px-6 md:pb-4",
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
        <div
          className={cn(
            "fixed inset-0 z-[200] flex flex-col",
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
            initial={{ opacity: 0, scale: fullscreen || fullHeight ? 1 : 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: fullscreen || fullHeight ? 1 : 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "relative z-10 flex min-h-0 w-full flex-col",
              fullscreen && "h-dvh max-w-none",
              fullHeight &&
                "h-dvh w-full max-w-none md:mx-auto md:w-full md:max-w-lg",
              !fullscreen && !fullHeight && "max-md:h-dvh max-md:max-w-none",
              !fullscreen && !fullHeight && maxWidth,
            )}
          >
            <ModalFrame
              className={cn(
                fullscreen &&
                  "rounded-none border-0 shadow-none dark:bg-zinc-900 md:rounded-none",
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
                    className={cn(
                      "-mr-1 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-celeste-trifinio transition-colors hover:bg-celeste-trifinio/10",
                      headerActionsAlign === "start" && "ml-auto",
                    )}
                    aria-label="Cerrar"
                  >
                    <XIcon size={22} strokeWidth={2.25} />
                  </button>
                ) : null}
              </div>

              <div
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto bg-white dark:bg-zinc-900",
                  contentClassName ??
                    cn(
                      (fullscreen || fullHeight) &&
                        "flex flex-col items-center justify-center p-4 md:p-6",
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

"use client";

import { type ComponentProps, type ReactNode } from "react";
import { ModalShell } from "@/components/ui/general-modal";
import { cn } from "@/lib/utils";

export const GV_MODAL_CONTENT_CLASS =
  "!flex min-h-0 flex-1 flex-col !p-0 max-md:!overflow-hidden md:!block md:overflow-y-auto";

export const GV_MODAL_DETALLE_CONTENT_CLASS =
  "!flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain !p-0 md:!block md:overflow-y-auto";

export const GV_MODAL_INSET_CLASS =
  "mx-4 flex min-h-0 flex-1 flex-col max-md:mb-[max(1rem,env(safe-area-inset-bottom))] max-md:mt-[max(1rem,env(safe-area-inset-top))] md:mx-6 md:mb-6 md:mt-6";

export const GV_MODAL_FORM_CLASS =
  "flex min-h-0 flex-1 flex-col max-md:min-h-full md:space-y-4";

export const GV_MODAL_FORM_BODY_CLASS =
  "mx-4 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain max-md:mb-4 max-md:mt-[max(1rem,env(safe-area-inset-top))] md:mx-6 md:mb-0 md:mt-6";

export function GvModalForm({
  className,
  children,
  ...props
}: React.FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form {...props} className={cn(GV_MODAL_FORM_CLASS, className)}>
      {children}
    </form>
  );
}

export function GvModalFormBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn(GV_MODAL_FORM_BODY_CLASS, className)}>{children}</div>;
}

export function GvModalInset({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn(GV_MODAL_INSET_CLASS, className)}>{children}</div>;
}

export function GvModalContentMotion({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col max-md:min-h-full max-md:w-full md:contents">
      {children}
    </div>
  );
}

export const GV_MODAL_SELECT_CONTENT_CLASS =
  "z-[250] max-h-60 w-[var(--radix-select-trigger-width)] border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900";

export const GV_MODAL_SELECT_ITEM_CLASS =
  "cursor-pointer rounded-lg bg-white focus:bg-sky-50 dark:bg-zinc-900 dark:focus:bg-zinc-800";

export const GV_MODAL_SELECT_TRIGGER_CLASS =
  "h-10 w-full cursor-pointer rounded-lg border border-border bg-white shadow-none dark:border-zinc-700 dark:bg-zinc-950";

export function GvModalShell({
  children,
  open,
  contentClassName,
  sinHeader = false,
  hideCloseButton,
  headerClassName,
  headerActions,
  title,
  fullHeight = true,
  ...props
}: ComponentProps<typeof ModalShell> & { sinHeader?: boolean }) {
  const resolvedHeaderActions =
    headerActions ??
    (title && !sinHeader ? <span aria-hidden="true" className="min-w-0 flex-1" /> : undefined);

  return (
    <ModalShell
      open={open}
      fullHeight={fullHeight}
      contentClassName={contentClassName ?? GV_MODAL_CONTENT_CLASS}
      hideCloseButton={sinHeader ? true : hideCloseButton}
      headerClassName={cn(
        sinHeader && "hidden",
        !sinHeader && "[&_button[aria-label='Cerrar']]:mr-0",
        headerClassName,
      )}
      title={title}
      headerActions={resolvedHeaderActions}
      {...props}
    >
      {open ? <GvModalContentMotion>{children}</GvModalContentMotion> : null}
    </ModalShell>
  );
}

export {
  ModalCancelButton,
  ModalConfirmDelete,
  ModalField,
  ModalFooter,
  ModalForm,
  ModalInput,
  ModalLabel,
  ModalSubmit,
  ModalTextarea,
  modalAccentClass,
  modalActionMessage,
  modalFieldClass,
  toast,
} from "@/components/ui/general-modal";

export {
  GvFechaInput,
  GvFechaHoraInput,
  GvModalFechaInput,
  GvModalFechaHoraInput,
} from "./gv-fecha-input";

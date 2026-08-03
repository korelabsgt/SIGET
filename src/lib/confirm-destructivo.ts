import Swal, { type SweetAlertIcon, type SweetAlertResult } from "sweetalert2";

function isDarkTheme() {
  return document.documentElement.classList.contains("dark");
}

const swalCustomClass = {
  popup:
    "!rounded-2xl !border !border-border !bg-zinc-100 !p-6 dark:!border-zinc-700 dark:!bg-zinc-900",
  title: "!text-foreground !text-lg !font-black !mt-1",
  htmlContainer:
    "!text-muted-foreground !text-sm !font-medium !mt-3 dark:!text-zinc-400",
  confirmDestructive:
    "!mx-1 !inline-flex !h-10 !items-center !justify-center !rounded-xl !border-0 !bg-red-100 !px-5 !text-xs !font-bold !text-red-600 !shadow-none !transition-colors hover:!bg-red-200 dark:!bg-red-950 dark:!text-red-400 dark:hover:!bg-red-900",
  confirmPrimary:
    "!mx-1 !inline-flex !h-10 !items-center !justify-center !rounded-xl !border-0 !bg-sky-100 !px-5 !text-xs !font-bold !text-azul-trifinio !shadow-none !transition-colors hover:!bg-sky-200 dark:!bg-sky-950 dark:!text-azul-trifinio dark:hover:!bg-sky-900",
  cancelButton:
    "!mx-1 !inline-flex !h-10 !items-center !justify-center !rounded-xl !border-0 !bg-sky-100 !px-5 !text-xs !font-bold !text-azul-trifinio !shadow-none !transition-colors hover:!bg-sky-200 dark:!bg-sky-950 dark:!text-azul-trifinio dark:hover:!bg-sky-900",
  actions: "!mt-6 !flex !w-full !flex-wrap !justify-center !gap-2",
  icon: "!border-amber-500 !text-amber-500",
} as const;

function elevateSwalZIndex() {
  const container = Swal.getContainer();
  if (container) {
    container.style.zIndex = "10001";
  }
}

export type ConfirmSwalOptions = {
  title?: string;
  text?: string;
  icon?: SweetAlertIcon;
  confirmButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
  confirmTone?: "destructive" | "primary";
};

export function confirmSwal(options: ConfirmSwalOptions): Promise<SweetAlertResult> {
  const dark = isDarkTheme();
  const destructive = options.confirmTone !== "primary";
  const showCancel = options.showCancelButton ?? true;

  return Swal.fire({
    title: options.title ?? "¿Confirmar?",
    text: options.text,
    icon: options.icon ?? "warning",
    showCancelButton: showCancel,
    confirmButtonText: options.confirmButtonText ?? "Confirmar",
    cancelButtonText: options.cancelButtonText ?? "Cancelar",
    background: dark ? "#18181b" : "#f4f4f5",
    color: dark ? "#fafafa" : "#18181b",
    buttonsStyling: false,
    customClass: {
      popup: swalCustomClass.popup,
      title: swalCustomClass.title,
      htmlContainer: swalCustomClass.htmlContainer,
      confirmButton: destructive
        ? swalCustomClass.confirmDestructive
        : swalCustomClass.confirmPrimary,
      cancelButton: swalCustomClass.cancelButton,
      actions: swalCustomClass.actions,
      icon: swalCustomClass.icon,
    },
    didOpen: elevateSwalZIndex,
  });
}

export function confirmDestructivo(options: {
  title?: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}) {
  return confirmSwal({
    title: options.title ?? "¿Confirmar?",
    text: options.text ?? "Esta acción no se puede deshacer.",
    icon: "warning",
    confirmButtonText: options.confirmButtonText ?? "Confirmar",
    cancelButtonText: options.cancelButtonText ?? "Cancelar",
    confirmTone: "destructive",
  });
}

export function avisoSwal(options: {
  title: string;
  text: string;
  confirmButtonText?: string;
}) {
  return confirmSwal({
    title: options.title,
    text: options.text,
    icon: "warning",
    showCancelButton: false,
    confirmButtonText: options.confirmButtonText ?? "Entendido",
    confirmTone: "primary",
  });
}

import Swal from "sweetalert2";
import { toast } from "react-toastify";

type ToastKind = "success" | "error" | "warning" | "info";

const DEFAULT_AUTO_CLOSE: Record<ToastKind, number> = {
  success: 3000,
  error: 3000,
  warning: 6000,
  info: 3000,
};

export const showToast = (
  icon: ToastKind,
  title: string,
  options?: { toastId?: string; autoClose?: number },
) => {
  const toastOptions = {
    toastId: options?.toastId,
    autoClose: options?.autoClose ?? DEFAULT_AUTO_CLOSE[icon],
  };

  switch (icon) {
    case "success":
      toast.success(title, toastOptions);
      break;
    case "error":
      toast.error(title, toastOptions);
      break;
    case "warning":
      toast.warn(title, toastOptions);
      break;
    case "info":
      toast.info(title, toastOptions);
      break;
  }
};

export const showAlert = (
  icon: "success" | "error" | "warning",
  title: string,
  text: string,
) => {
  const isDark = document.documentElement.classList.contains("dark");
  return Swal.fire({
    icon,
    title,
    text,
    background: isDark ? "#121212" : "#ffffff",
    color: isDark ? "#fff" : "#09090b",
    confirmButtonColor: "#ea580c",
    customClass: {
      popup: "rounded-3xl border border-border/50 backdrop-blur-xl",
    },
    didOpen: () => {
      const container = Swal.getContainer();
      if (container) {
        container.style.zIndex = "99999";
      }
    },
  });
};

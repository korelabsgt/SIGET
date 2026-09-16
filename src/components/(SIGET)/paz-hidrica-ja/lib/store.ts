import { seedState } from "./seed";
import type { JaStoreState, RolJaPersistido } from "./zod";

const STORE_KEY = "siget-paz-hidrica-ja-v6";
const ROL_KEY = "siget-paz-hidrica-ja-rol";

function puedeUsarStorage(): boolean {
  return typeof window !== "undefined";
}

export function leerStore(): JaStoreState {
  if (!puedeUsarStorage()) return seedState();

  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      const inicial = seedState();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(inicial));
      return inicial;
    }
    const parsed = JSON.parse(raw) as JaStoreState;
    if (!parsed.incidentes || !parsed.sesiones || !parsed.acuerdos) {
      const inicial = seedState();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(inicial));
      return inicial;
    }
    if (!parsed.procesos) {
      parsed.procesos = [];
    }
    return parsed;
  } catch {
    const inicial = seedState();
    window.localStorage.setItem(STORE_KEY, JSON.stringify(inicial));
    return inicial;
  }
}

export function escribirStore(state: JaStoreState): void {
  if (!puedeUsarStorage()) return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

export function mutarStore(mutator: (state: JaStoreState) => JaStoreState): JaStoreState {
  const next = mutator(leerStore());
  escribirStore(next);
  return next;
}

export function leerRolJa(): RolJaPersistido {
  if (!puedeUsarStorage()) return "admin_marn";
  const raw = window.localStorage.getItem(ROL_KEY);
  if (
    raw === "admin_marn" ||
    raw === "tecnico" ||
    raw === "dialogo" ||
    raw === "auditor"
  ) {
    return raw;
  }
  return "admin_marn";
}

export function escribirRolJa(rol: RolJaPersistido): void {
  if (!puedeUsarStorage()) return;
  window.localStorage.setItem(ROL_KEY, rol);
}

export function reiniciarStore(): JaStoreState {
  const inicial = seedState();
  escribirStore(inicial);
  return inicial;
}

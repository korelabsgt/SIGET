"use client";

import { useSyncExternalStore } from "react";

function subscribeLgUp(onStoreChange: () => void) {
  const mq = window.matchMedia("(min-width: 1024px)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getLgUpSnapshot() {
  return window.matchMedia("(min-width: 1024px)").matches;
}

function getLgUpServerSnapshot() {
  return false;
}

export function useGvLgUp() {
  return useSyncExternalStore(subscribeLgUp, getLgUpSnapshot, getLgUpServerSnapshot);
}

"use client";

export function useGvNotificacionesVistas(_alertKey: string, total: number) {
  return {
    showBadge: total > 0,
    markSeen: () => {},
  };
}

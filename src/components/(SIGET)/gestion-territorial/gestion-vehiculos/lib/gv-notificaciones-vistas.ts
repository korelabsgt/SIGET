"use client";

import { useState } from "react";

export function useGvNotificacionesVistas(alertKey: string, total: number) {
  const [seenKey, setSeenKey] = useState<string | null>(null);
  const showBadge = total > 0 && seenKey !== alertKey;

  const markSeen = () => {
    if (total > 0) {
      setSeenKey(alertKey);
    }
  };

  return { showBadge, markSeen };
}

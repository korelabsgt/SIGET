export const GV_STALE_TIME_MS = 5 * 60 * 1000;

const inflight = new Map<string, Promise<unknown>>();

export function shareInflight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const current = inflight.get(key);
  if (current) return current as Promise<T>;
  const next = fn().finally(() => {
    if (inflight.get(key) === next) inflight.delete(key);
  });
  inflight.set(key, next);
  return next;
}

export const GV_QUERY_OPTIONS = {
  staleTime: GV_STALE_TIME_MS,
  refetchOnWindowFocus: false as const,
  refetchOnMount: false as const,
  refetchOnReconnect: false as const,
};

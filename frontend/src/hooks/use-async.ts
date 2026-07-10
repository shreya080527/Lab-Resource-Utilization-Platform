
import * as React from "react";
import { cn } from "@/lib/utils";

// Tiny generic async data hook with loading/error/refetch.
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: React.DependencyList,
): {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  setData: (d: T | undefined) => void;
} {
  const [data, setData] = React.useState<T | undefined>(undefined);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fn()
      .then((d) => {
        if (active) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e?.message ?? "Failed to load");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [...deps, tick]);

  return {
    data,
    loading,
    error,
    refetch: () => setTick((t) => t + 1),
    setData,
  };
}

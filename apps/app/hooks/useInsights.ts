import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  collectionApi,
  dashboardApi,
  type Analytics,
  type CollectionResponse,
} from "@/lib/api";

export function useCollection(
  sort: "amount" | "age" = "amount",
  enabled = true,
) {
  const [data, setData] = useState<CollectionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setData(await collectionApi.list(sort));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [sort]);

  // The outstanding list reloads when the screen regains focus, so a
  // transaction recorded a moment earlier shows its new balance without the
  // user pulling to refresh.
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      refresh();
    }, [refresh, enabled]),
  );

  return { data, loading, error, refresh };
}

export function useAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setData(await dashboardApi.analytics());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

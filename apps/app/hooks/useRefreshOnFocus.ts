import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";

/**
 * Re-runs a query refetch when a screen regains focus, skipping the initial
 * mount (which `useQuery` already fetches).
 */
export function useRefreshOnFocus(refetch: () => Promise<unknown> | unknown) {
  const firstTimeRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false;
        return;
      }
      void refetch();
    }, [refetch]),
  );
}

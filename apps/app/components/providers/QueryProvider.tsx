import { useEffect, useState, type ReactNode } from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";
import * as Network from "expo-network";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from "@tanstack/react-query";

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
}

/**
 * Single TanStack Query client for the mobile app, wired to React Native
 * foreground (`AppState`) and connectivity (`expo-network`) events.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            gcTime: 1000 * 60 * 5,
            retry: 1,
            networkMode: "offlineFirst",
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    return onlineManager.setEventListener((setOnline) => {
      let cancelled = false;

      const syncNetwork = async () => {
        try {
          const state = await Network.getNetworkStateAsync();
          if (!cancelled) {
            setOnline(Boolean(state.isConnected));
          }
        } catch {
          if (!cancelled) setOnline(true);
        }
      };

      void syncNetwork();

      const netSubscription = Network.addNetworkStateListener((state) => {
        if (!cancelled) {
          setOnline(Boolean(state.isConnected));
        }
      });

      const appStateSubscription = AppState.addEventListener(
        "change",
        (status) => {
          if (status === "active") {
            void syncNetwork();
          }
        },
      );

      return () => {
        cancelled = true;
        netSubscription.remove();
        appStateSubscription.remove();
      };
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

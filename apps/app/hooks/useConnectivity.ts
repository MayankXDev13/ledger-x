// Connectivity + foreground replay triggers (design: expo-network drives
// connectivity transitions; replay also runs on app foreground).
import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import * as Network from "expo-network";

export interface ConnectivityState {
  isOnline: boolean;
  /** AppState value so screens can react to foregrounding. */
  appState: AppStateStatus;
}

export function useConnectivity(): ConnectivityState {
  const [state, setState] = useState<ConnectivityState>({
    isOnline: true,
    appState: (AppState.currentState ?? "unknown") as AppStateStatus,
  });

  useEffect(() => {
    let cancelled = false;

    const readNetwork = async () => {
      try {
        const network = await Network.getNetworkStateAsync();
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            isOnline: !!network.isConnected,
          }));
        }
      } catch {
        // Assume online when the network API fails; the API call itself
        // determines success.
        if (!cancelled) setState((prev) => ({ ...prev, isOnline: true }));
      }
    };

    const subscription = AppState.addEventListener("change", (appState) => {
      setState((prev) => ({ ...prev, appState }));
      if (appState === "active") readNetwork();
    });

    readNetwork();

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return state;
}

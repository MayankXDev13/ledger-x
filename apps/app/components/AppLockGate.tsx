import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as ScreenCapture from "expo-screen-capture";
import { Ionicons } from "@expo/vector-icons";
import {
  isLockEnabled,
  loadAttemptState,
  resetAttempts,
  saveAttemptState,
  verifyPin,
} from "@/lib/app-lock";
import { isLocked, recordFailure } from "@/lib/app-lock-core";
import { colors } from "@/lib/theme";
import { announce } from "@/lib/announce";

const AUTO_LOCK_MS = 60_000;

/**
 * Device-local lock gate (tasks 9.3/9.4):
 * - cold start locks when a PIN is set,
 * - backgrounding past the auto-lock timer re-locks,
 * - biometrics unlock with PIN fallback,
 * - the app-switcher snapshot is masked via expo-screen-capture,
 * - five consecutive wrong PINs start an exponential cooldown.
 */
export function AppLockGate({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [lockOn, setLockOn] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  // Mask the app-switcher snapshot only while app lock is enabled.
  // When the lock is off, screenshots stay available (e.g. sharing a
  // statement image), per spec: masking is required only with lock on.
  useEffect(() => {
    if (lockOn) {
      ScreenCapture.preventScreenCaptureAsync().catch(() => undefined);
    } else {
      ScreenCapture.allowScreenCaptureAsync().catch(() => undefined);
    }
  }, [lockOn]);

  const evaluate = useCallback(async () => {
    const enabled = await isLockEnabled();
    setLockOn(enabled);
    if (!enabled) {
      setLocked(false);
      setChecking(false);
      return;
    }
    setLocked(true);
    setChecking(false);

    const biometrics = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBioAvailable(biometrics && enrolled);
  }, []);

  const tryBiometrics = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Ledger-X",
      fallbackLabel: "Use PIN",
    });
    if (result.success) {
      setLocked(false);
      setAttempts(0);
      await resetAttempts();
    }
  }, []);

  useEffect(() => {
    evaluate();
  }, [evaluate]);

  // Auto-lock on background past the timer.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        const bgAt = backgroundedAt.current;
        backgroundedAt.current = null;
        if (bgAt !== null && Date.now() - bgAt >= AUTO_LOCK_MS) {
          isLockEnabled().then((enabled) => {
            if (enabled) {
              setLocked(true);
              setPin("");
              setError(null);
            }
          });
        }
      } else if (state === "background" || state === "inactive") {
        backgroundedAt.current = Date.now();
      }
    });

    return () => subscription.remove();
  }, []);

  const submitPin = async () => {
    const now = Date.now();
    const state = await loadAttemptState();

    if (isLocked(state, now)) {
      setCooldownUntil(state.lockedUntil);
      setError("Too many attempts — wait for the cooldown");
      announce("Too many attempts. Wait for the cooldown before trying again.");
      return;
    }

    const ok = await verifyPin(pin);
    if (ok) {
      setLocked(false);
      setPin("");
      setError(null);
      setAttempts(0);
      await resetAttempts();
      return;
    }

    const next = recordFailure(state, now);
    await saveAttemptState(next);
    setAttempts(next.consecutiveFailures);
    setCooldownUntil(next.lockedUntil);
    const failureMessage = next.lockedUntil
      ? "Too many attempts — wait for the cooldown"
      : "Incorrect PIN";
    setError(failureMessage);
    announce(failureMessage);
    setPin("");
  };

  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!locked) return <>{children}</>;

  const cooldownRemaining =
    cooldownUntil !== null ? Math.max(0, cooldownUntil - Date.now()) : 0;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        justifyContent: "center",
        paddingHorizontal: 32,
      }}
    >
      <View style={{ alignItems: "center", marginBottom: 28 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: "rgba(234, 88, 12, 0.10)",
            borderWidth: 1,
            borderColor: "rgba(234, 88, 12, 0.25)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Ionicons name="lock-closed" size={28} color={colors.brand} />
        </View>
        <Text style={{ color: colors.ink, fontSize: 20, fontWeight: "700" }}>
          Ledger-X is locked
        </Text>
        <Text style={{ color: colors.inkMuted, fontSize: 13, marginTop: 6 }}>
          Enter your PIN to continue
        </Text>
      </View>

      <TextInput
        value={pin}
        onChangeText={(text) => {
          setPin(text.replace(/\D/g, "").slice(0, 6));
          setError(null);
        }}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        placeholder="••••"
        placeholderTextColor={colors.inkFaint}
        style={{
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 12,
          backgroundColor: colors.surface,
          color: colors.ink,
          fontSize: 22,
          letterSpacing: 12,
          textAlign: "center",
          paddingVertical: 14,
          marginBottom: 12,
        }}
        onSubmitEditing={submitPin}
      />

      {error && (
        <View accessibilityLiveRegion="assertive">
        <Text style={{ color: colors.dangerText, fontSize: 13, textAlign: "center" }}>
          {error}
          {cooldownRemaining > 0
            ? ` (${Math.ceil(cooldownRemaining / 1000)}s)`
            : ""}
        </Text>
        </View>
      )}
      {attempts > 0 && attempts < 5 && !error && (
        <Text style={{ color: colors.inkMuted, fontSize: 11, textAlign: "center" }}>
          {attempts} failed attempt{attempts === 1 ? "" : "s"}
        </Text>
      )}

      <Pressable
            accessibilityRole="button"
        accessibilityLabel="Unlock Ledger-X"
        accessibilityState={{ disabled: cooldownRemaining > 0 || pin.length < 4 }}
        onPress={submitPin}
        disabled={cooldownRemaining > 0 || pin.length < 4}
        style={{
          backgroundColor: cooldownRemaining > 0 || pin.length < 4 ? colors.surfaceRaised : colors.brandFill,
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <Text
          style={{
            color: cooldownRemaining > 0 || pin.length < 4 ? colors.inkMuted : colors.white,
            fontWeight: "700",
            fontSize: 14,
          }}
        >
          Unlock
        </Text>
      </Pressable>

      {bioAvailable && (
        <Pressable
            accessibilityRole="button"
          accessibilityLabel="Unlock with biometrics"
          onPress={tryBiometrics}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 18,
          }}
        >
          <Ionicons name="finger-print" size={20} color={colors.brand} />
          <Text style={{ color: colors.brand, fontSize: 13, fontWeight: "600" }}>
            Use biometrics instead
          </Text>
        </Pressable>
      )}
    </View>
  );
}

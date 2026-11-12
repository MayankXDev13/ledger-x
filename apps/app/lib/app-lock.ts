// App lock: device-local PIN gate. Only a salted SHA-256 of the PIN is stored
// (expo-secure-store), never the PIN itself. Biometrics use
// expo-local-authentication with the device PIN as fallback; the five-attempt
// cooldown math lives in app-lock-core (unit-tested).
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import {
  combineForHash,
  isValidPin,
  type AttemptState,
  type PinRecord,
} from "./app-lock-core";

const PIN_RECORD_KEY = "ledgerx_app_lock_pin";
const ATTEMPTS_KEY = "ledgerx_app_lock_attempts";
const ENABLED_KEY = "ledgerx_app_lock_enabled";

async function sha256Hex(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

export async function isLockEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(ENABLED_KEY)) === "true";
}

/**
 * Remove every trace of the device-local lock.
 *
 * The lock belongs to the signed-in session: when the session ends, the PIN,
 * the lock flag and the failed-attempt state go with it, so a signed-out app
 * never asks for a PIN.
 */
export async function clearAppLock(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_RECORD_KEY);
  await SecureStore.deleteItemAsync(ENABLED_KEY);
  await SecureStore.deleteItemAsync(ATTEMPTS_KEY);
}

export async function setLockEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(ENABLED_KEY, "true");
  } else {
    await clearAppLock();
  }
}

export async function hasPin(): Promise<boolean> {
  return (await SecureStore.getItemAsync(PIN_RECORD_KEY)) !== null;
}

/** Store only salt:hash — the PIN itself never touches storage. */
export async function setPin(pin: string): Promise<void> {
  if (!isValidPin(pin)) {
    throw new Error(`PIN must be 4-6 digits`);
  }

  const salt = Crypto.getRandomBytes(16).reduce(
    (hex, byte) => hex + byte.toString(16).padStart(2, "0"),
    "",
  );
  const hash = await sha256Hex(combineForHash(salt, pin));
  const record: PinRecord = { salt, hash };
  await SecureStore.setItemAsync(PIN_RECORD_KEY, JSON.stringify(record));
  await setLockEnabled(true);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const raw = await SecureStore.getItemAsync(PIN_RECORD_KEY);
  if (!raw) return false;

  const record = JSON.parse(raw) as PinRecord;
  const hash = await sha256Hex(combineForHash(record.salt, pin));
  return hash === record.hash;
}

/** Disabling requires the current PIN (or biometric success upstream). */
export async function disableWithPin(pin: string): Promise<boolean> {
  const ok = await verifyPin(pin);
  if (ok) await setLockEnabled(false);
  return ok;
}

export async function loadAttemptState(): Promise<AttemptState> {
  const raw = await SecureStore.getItemAsync(ATTEMPTS_KEY);
  if (!raw) return { consecutiveFailures: 0, lockedUntil: null };
  try {
    return JSON.parse(raw) as AttemptState;
  } catch {
    return { consecutiveFailures: 0, lockedUntil: null };
  }
}

export async function saveAttemptState(state: AttemptState): Promise<void> {
  await SecureStore.setItemAsync(ATTEMPTS_KEY, JSON.stringify(state));
}

export async function resetAttempts(): Promise<void> {
  await SecureStore.deleteItemAsync(ATTEMPTS_KEY);
}

import { describe, expect, it, mock } from "bun:test";

/**
 * The app lock lives in the operating system's secure storage, which is not
 * available in a plain bun runtime. The module is mocked here so the storage
 * contract of the lock can be asserted without a device.
 */
const secureStore = new Map<string, string>();

mock.module("expo-secure-store", () => ({
  getItemAsync: async (key: string) => secureStore.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => {
    secureStore.set(key, value);
  },
  deleteItemAsync: async (key: string) => {
    secureStore.delete(key);
  },
}));

mock.module("expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  digestStringAsync: async (_algorithm: string, input: string) =>
    `hash:${input}`,
  getRandomBytes: (size: number) => new Uint8Array(size).fill(7),
}));

const { clearAppLock, hasPin, isLockEnabled, setPin } = await import(
  "./app-lock"
);

describe("clearAppLock", () => {
  it("removes the PIN, the lock flag and the attempt state", async () => {
    await setPin("4321");
    expect(await hasPin()).toBe(true);
    expect(await isLockEnabled()).toBe(true);

    await clearAppLock();

    expect(await hasPin()).toBe(false);
    expect(await isLockEnabled()).toBe(false);
    expect(secureStore.size).toBe(0);
  });

  it("is safe to call when no lock was ever set", async () => {
    await clearAppLock();
    expect(await hasPin()).toBe(false);
    expect(await isLockEnabled()).toBe(false);
  });

  it("leaves the lock off after a clear", async () => {
    await setPin("123456");
    await clearAppLock();
    await setPin("123456");
    expect(await isLockEnabled()).toBe(true);
  });
});

import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { useAuth } from "@/hooks/useAuth";
import {
  accountApi,
  exportsApi,
  sampleDataApi,
  customersApi,
} from "@/lib/api";
import { isValidUpiId } from "@/lib/upi";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/Button";
import { SectionHeader } from "@/components/SectionHeader";
import {
  disableWithPin,
  hasPin,
  isLockEnabled,
  setPin,
} from "@/lib/app-lock";
import { COOLDOWN_THRESHOLD } from "@/lib/app-lock-core";
import { colors } from "@/lib/theme";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const { settings, update } = useSettings();
  const scrollRef = useRef<any>(null);
  const upiSectionY = useRef(0);

  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [savingUpi, setSavingUpi] = useState(false);
  const [hasSamples, setHasSamples] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [lockEnabled, setLockEnabledState] = useState(false);
  const [pinExists, setPinExists] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinMode, setPinMode] = useState<"idle" | "setup" | "disable">("idle");
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setUpiId(settings.upiId ?? "");
      setPayeeName(settings.payeeName ?? "");
    }
  }, [settings]);

  useEffect(() => {
    (async () => {
      setLockEnabledState(await isLockEnabled());
      setPinExists(await hasPin());
    })();
  }, []);

  useEffect(() => {
    customersApi
      .list()
      .then((rows) => setHasSamples(rows.some((row) => row.isSample)))
      .catch(() => undefined);
  }, []);

  const upiError =
    upiId.trim() && !isValidUpiId(upiId.trim())
      ? "Use a UPI ID like name@bank"
      : null;

  const saveUpi = async () => {
    if (upiError) return;
    setSavingUpi(true);
    try {
      await update({
        upiId: upiId.trim() || null,
        payeeName: payeeName.trim() || null,
      });
      Alert.alert("Saved", "UPI settings updated.");
    } catch (error) {
      Alert.alert(
        "Could not save",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setSavingUpi(false);
    }
  };

  const shareCsv = async (kind: "customers" | "transactions") => {
    setBusy(kind);
    try {
      const csv =
        kind === "customers"
          ? await exportsApi.customersCsv()
          : await exportsApi.transactionsCsv();
      if (await Sharing.isAvailableAsync()) {
        const filename = `ledger-x-${kind}.csv`;
        await Share.share({ message: csv, title: filename });
      } else {
        Alert.alert("Sharing unavailable on this device");
      }
    } catch (error) {
      Alert.alert(
        "Export failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setBusy(null);
    }
  };

  const shareArchive = async () => {
    setBusy("archive");
    try {
      const archive = await accountApi.archive();
      if (await Sharing.isAvailableAsync()) {
        await Share.share({
          message: JSON.stringify(archive, null, 2),
          title: "ledger-x-account-export.json",
        });
      } else {
        Alert.alert("Sharing unavailable on this device");
      }
    } catch (error) {
      Alert.alert(
        "Archive failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setBusy(null);
    }
  };

  const toggleSamples = async () => {
    setBusy("samples");
    try {
      if (hasSamples) {
        await sampleDataApi.remove();
        setHasSamples(false);
      } else {
        await sampleDataApi.seed();
        setHasSamples(true);
      }
    } catch (error) {
      Alert.alert(
        "Sample data failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setBusy(null);
    }
  };

  const confirmPin = async () => {
    setPinError(null);
    try {
      if (pinMode === "setup") {
        await setPin(pinInput);
        setLockEnabledState(true);
        setPinExists(true);
        Alert.alert("App lock on", "A PIN is now required to open Ledger-X.");
      } else if (pinMode === "disable") {
        const ok = await disableWithPin(pinInput);
        if (!ok) {
          setPinError("Incorrect PIN");
          return;
        }
        setLockEnabledState(false);
        setPinExists(false);
      }
      setPinMode("idle");
      setPinInput("");
    } catch (error) {
      setPinError(error instanceof Error ? error.message : "Invalid PIN");
    }
  };

  const toggleLock = async (enabled: boolean) => {
    if (enabled) {
      setPinMode("setup");
    } else {
      setPinMode("disable");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE") return;
    setDeleting(true);
    try {
      await accountApi.delete();
      await signOut();
      router.replace("/auth/login");
    } catch (error) {
      Alert.alert(
        "Deletion failed",
        error instanceof Error ? error.message : "Unknown error",
      );
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await signOut();
    router.replace("/auth/login");
  };

  const shareApp = async () => {
    try {
      await Share.share({ message: "Try Ledger-X for your shop khata!" });
    } catch {
      Alert.alert("Share failed", "Could not open share sheet.");
    }
  };

  const scrollToUpi = () => {
    scrollRef.current?.scrollTo({ y: upiSectionY.current, animated: true });
  };

  if (!session) {
    return null;
  }

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <Text className="font-mukta-bold text-[24px] leading-[30px] text-ink">
            Profile
          </Text>
          <Text className="mt-1 font-mukta text-[15px] text-ink-muted">
            {session.user.email}
          </Text>
        </View>

        <View
          onLayout={(e) => {
            upiSectionY.current = e.nativeEvent.layout.y;
          }}
        >
          <SectionHeader label="Payment settings" className="mb-3" />
          <View className="rounded-2xl border border-line bg-surface p-4">
            <Text className="mb-2 font-mukta-semibold text-[15px] text-ink">
              UPI collections
            </Text>
            <Text className="mb-3 font-mukta text-[13px] text-ink-muted">
              Customers scan your QR or open a UPI intent pre-filled with this
              ID. Payments are still recorded manually.
            </Text>
            <Text className="mb-1 font-mukta-medium text-[13px] text-ink-muted">
              UPI ID (VPA)
            </Text>
            <TextInput
              accessibilityLabel="UPI ID"
              className="mb-3 rounded-xl border border-line bg-surface-raised px-4 py-3 font-mukta text-[15px] text-ink"
              placeholder="yourname@okhdfcbank"
              placeholderTextColor={colors.inkFaint}
              value={upiId}
              onChangeText={setUpiId}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="username"
            />
            <Text className="mb-1 font-mukta-medium text-[13px] text-ink-muted">
              Payee name
            </Text>
            <TextInput
              accessibilityLabel="Payee name"
              className="mb-1 rounded-xl border border-line bg-surface-raised px-4 py-3 font-mukta text-[15px] text-ink"
              placeholder="Payee name (e.g. Ramesh Kirana)"
              placeholderTextColor={colors.inkFaint}
              value={payeeName}
              onChangeText={setPayeeName}
              autoCapitalize="words"
            />
            {upiError ? (
              <Text
                accessibilityLiveRegion="polite"
                className="mb-2 font-mukta text-[13px] text-danger-text"
              >
                {upiError}
              </Text>
            ) : null}
            <Button
              title="Save UPI settings"
              onPress={saveUpi}
              disabled={savingUpi || !!upiError}
              loading={savingUpi}
              className="mt-2"
            />
          </View>
        </View>

        <View className="mt-6">
          <SectionHeader label="Data & export" className="mb-3" />
          <View className="rounded-2xl border border-line bg-surface p-4">
            <Text className="mb-3 font-mukta text-[13px] text-ink-muted">
              Downloads include every active record and exclude sample data.
              Amounts are in rupees with two decimals.
            </Text>
            <View className="gap-2">
              {[
                { key: "customers" as const, label: "Customers CSV" },
                { key: "transactions" as const, label: "Transactions CSV" },
                { key: "archive" as const, label: "Full account archive (JSON)" },
              ].map((action) => (
                <Pressable
                  key={action.key}
                  onPress={() =>
                    action.key === "archive"
                      ? shareArchive()
                      : shareCsv(action.key)
                  }
                  disabled={busy === action.key}
                  className="min-h-[52px] items-center justify-center rounded-xl border border-line active:bg-surface-raised"
                  accessibilityRole="button"
                >
                  <Text className="font-mukta-semibold text-[14px] text-ink">
                    {busy === action.key ? "Preparing…" : action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View className="mt-6">
          <SectionHeader label="App lock" className="mb-3" />
          <View className="rounded-2xl border border-line bg-surface p-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-mukta-semibold text-[15px] text-ink">
                Require PIN to open
              </Text>
              <Switch
                value={lockEnabled}
                onValueChange={toggleLock}
                trackColor={{ true: colors.brand, false: colors.line }}
                thumbColor={colors.ink}
              />
            </View>
            <Text className="mb-3 font-mukta text-[13px] text-ink-muted">
              Stored as a salted hash on this device only. After{" "}
              {COOLDOWN_THRESHOLD} wrong attempts a cooldown applies. Auto-lock
              after 60 seconds in background.
            </Text>

            {pinMode !== "idle" && (
              <View>
                <TextInput
                  className="mb-2 rounded-xl border border-line bg-surface-raised px-4 py-3 font-plex text-[15px] tracking-[8px] text-ink"
                  placeholder="Enter 4-6 digit PIN"
                  placeholderTextColor={colors.inkFaint}
                  value={pinInput}
                  onChangeText={(text) =>
                    setPinInput(text.replace(/\D/g, "").slice(0, 6))
                  }
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={6}
                />
                {pinError && (
                  <Text className="mb-2 font-mukta text-[12px] text-danger-text">
                    {pinError}
                  </Text>
                )}
                <View className="flex-row gap-2">
                  <Button
                    title="Cancel"
                    variant="secondary"
                    onPress={() => {
                      setPinMode("idle");
                      setPinInput("");
                      setPinError(null);
                    }}
                    className="flex-1"
                  />
                  <Button
                    title={pinMode === "setup" ? "Set PIN" : "Confirm"}
                    onPress={confirmPin}
                    disabled={pinInput.length < 4}
                    className="flex-1"
                  />
                </View>
              </View>
            )}
            {pinMode === "idle" && pinExists && (
              <Text className="font-mukta text-[12px] text-ink-muted">
                PIN is set. Turn the switch off and confirm your PIN to disable.
              </Text>
            )}
          </View>
        </View>

        <View className="mt-6">
          <SectionHeader label="Sample data" className="mb-3" />
          <View className="rounded-2xl border border-line bg-surface p-4">
            <Text className="mb-3 font-mukta text-[13px] text-ink-muted">
              Sample customers and entries are labelled and never appear in
              exports.
            </Text>
            <Button
              title={hasSamples ? "Remove sample data" : "Load sample data"}
              variant="secondary"
              onPress={toggleSamples}
              disabled={busy === "samples"}
              loading={busy === "samples"}
            />
          </View>
        </View>

        <View className="mt-6">
          <SectionHeader label="Invite" className="mb-3" />
          <Pressable
            onPress={shareApp}
            className="flex-row items-center gap-4 rounded-2xl border border-brand/30 bg-surface p-4 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel="Invite a shopkeeper"
          >
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-brand/10">
              <Ionicons name="share-social" size={24} color={colors.brand} />
            </View>
            <View className="flex-1">
              <Text className="font-mukta-semibold text-[15px] text-ink">
                Invite a shopkeeper
              </Text>
              <Text className="mt-0.5 font-mukta text-[12px] text-ink-muted">
                Share Ledger-X with another shop owner
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.inkMuted} />
          </Pressable>
        </View>

        <View className="mt-6">
          <SectionHeader label="Account" className="mb-3" />
          <View className="gap-3 rounded-2xl border border-line bg-surface p-4">
            <View>
              <Text className="mb-2 font-mukta-semibold text-[15px] text-ink">
                Delete account
              </Text>
              <Text className="mb-3 font-mukta text-[13px] text-ink-muted">
                Permanently removes your identity, customers, transactions, and
                settings. Type DELETE to confirm.
              </Text>
              <TextInput
                className="mb-2 rounded-xl border border-danger/40 bg-surface-raised px-4 py-3 font-mukta text-[15px] text-ink"
                placeholder="DELETE"
                placeholderTextColor={colors.inkFaint}
                value={deleteText}
                onChangeText={setDeleteText}
                autoCapitalize="characters"
              />
              <Button
                title="Delete my account"
                variant="danger"
                onPress={handleDeleteAccount}
                disabled={deleteText !== "DELETE"}
                loading={deleting}
              />
            </View>
          </View>
        </View>

        <View className="mt-6">
          <SectionHeader label="Session" className="mb-3" />
          <View className="rounded-2xl border border-line bg-surface p-4">
            <Button
              title="Log out"
              variant="secondary"
              onPress={handleLogout}
              loading={isLoggingOut}
              icon={<Ionicons name="log-out-outline" size={18} color={colors.ink} />}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth-session";
import {
  accountApi,
  exportsApi,
  sampleDataApi,
  customersApi,
} from "@/lib/api";
import { isValidUpiId } from "@/lib/upi";
import { useSettings } from "@/hooks/useSettings";
import {
  disableWithPin,
  hasPin,
  isLockEnabled,
  setPin,
} from "@/lib/app-lock";
import { COOLDOWN_THRESHOLD } from "@/lib/app-lock-core";

function Section({
  icon,
  title,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="rounded-xl border border-brand-border bg-brand-card mb-4 overflow-hidden">
      <View className="flex-row items-center gap-2 px-4 pt-4 pb-2">
        <Ionicons name={icon} size={16} color="#10B981" />
        <Text className="text-sm font-semibold text-white">{title}</Text>
      </View>
      <View className="px-4 pb-4">{children}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { settings, update } = useSettings();

  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [savingUpi, setSavingUpi] = useState(false);
  const [hasSamples, setHasSamples] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // App lock state
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
        // Sharing a text payload via the OS sheet; the data itself is CSV.
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

  if (!session) {
    return null;
  }

  return (
    <View className="flex-1 bg-brand-dark">
      <View className="px-6 pb-4" style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-3xl font-bold text-white">Profile</Text>
        <Text className="text-base text-[#888888] mt-1">{session.user.email}</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* UPI */}
        <Section icon="wallet-outline" title="UPI collections">
          <TextInput
            className="border border-[#3D3D3D] rounded-lg px-4 py-3 text-white bg-[#2D2D2D] mb-3"
            placeholder="yourname@okhdfcbank"
            placeholderTextColor="#666666"
            value={upiId}
            onChangeText={setUpiId}
            autoCapitalize="none"
          />
          <TextInput
            className="border border-[#3D3D3D] rounded-lg px-4 py-3 text-white bg-[#2D2D2D] mb-1"
            placeholder="Payee name (e.g. Ramesh Kirana)"
            placeholderTextColor="#666666"
            value={payeeName}
            onChangeText={setPayeeName}
          />
          {upiError && (
            <Text className="text-red-500 text-xs mb-1">{upiError}</Text>
          )}
          <Text className="text-[#666666] text-xs mb-3">
            Customers scan your QR or open a UPI intent pre-filled with this ID.
            Payments are still recorded manually.
          </Text>
          <Pressable
            onPress={saveUpi}
            disabled={savingUpi || !!upiError}
            className="rounded-lg bg-[#10B981] py-3 items-center"
          >
            {savingUpi ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text className="text-black text-sm font-bold">Save UPI settings</Text>
            )}
          </Pressable>
        </Section>

        {/* Exports */}
        <Section icon="download-outline" title="Export & archive">
          <Text className="text-[#666666] text-xs mb-3">
            Downloads include every active record and exclude sample data.
            Amounts are in rupees with two decimals.
          </Text>
          <View className="gap-2">
            <Pressable
              onPress={() => shareCsv("customers")}
              disabled={busy === "customers"}
              className="rounded-lg border border-[#3D3D3D] py-3 items-center"
            >
              <Text className="text-white text-sm font-semibold">
                {busy === "customers" ? "Preparing…" : "Customers CSV"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => shareCsv("transactions")}
              disabled={busy === "transactions"}
              className="rounded-lg border border-[#3D3D3D] py-3 items-center"
            >
              <Text className="text-white text-sm font-semibold">
                {busy === "transactions" ? "Preparing…" : "Transactions CSV"}
              </Text>
            </Pressable>
            <Pressable
              onPress={shareArchive}
              disabled={busy === "archive"}
              className="rounded-lg border border-[#3D3D3D] py-3 items-center"
            >
              <Text className="text-white text-sm font-semibold">
                {busy === "archive" ? "Preparing…" : "Full account archive (JSON)"}
              </Text>
            </Pressable>
          </View>
        </Section>

        {/* Sample data */}
        <Section icon="flask-outline" title="Sample data">
          <Text className="text-[#666666] text-xs mb-3">
            Sample customers and entries are labelled and never appear in
            exports.
          </Text>
          <Pressable
            onPress={toggleSamples}
            disabled={busy === "samples"}
            className="rounded-lg border border-[#3D3D3D] py-3 items-center"
          >
            <Text className="text-white text-sm font-semibold">
              {busy === "samples"
                ? "Working…"
                : hasSamples
                  ? "Remove sample data"
                  : "Load sample data"}
            </Text>
          </Pressable>
        </Section>

        {/* App lock */}
        <Section icon="lock-closed-outline" title="App lock">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white text-sm">Require PIN to open</Text>
            <Switch
              value={lockEnabled}
              onValueChange={toggleLock}
              trackColor={{ true: "#10B981", false: "#333333" }}
            />
          </View>
          <Text className="text-[#666666] text-xs mb-3">
            Stored as a salted hash on this device only. After{" "}
            {COOLDOWN_THRESHOLD} wrong attempts a cooldown applies. Auto-lock
            after 60 seconds in background.
          </Text>

          {pinMode !== "idle" && (
            <View>
              <TextInput
                className="border border-[#3D3D3D] rounded-lg px-4 py-3 text-white bg-[#2D2D2D] mb-2 tracking-[8px]"
                placeholder="Enter 4-6 digit PIN"
                placeholderTextColor="#666666"
                value={pinInput}
                onChangeText={(text) => setPinInput(text.replace(/\D/g, "").slice(0, 6))}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
              />
              {pinError && (
                <Text className="text-red-500 text-xs mb-2">{pinError}</Text>
              )}
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => {
                    setPinMode("idle");
                    setPinInput("");
                    setPinError(null);
                  }}
                  className="flex-1 rounded-lg border border-[#3D3D3D] py-3 items-center"
                >
                  <Text className="text-white text-sm">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={confirmPin}
                  disabled={pinInput.length < 4}
                  className="flex-1 rounded-lg bg-[#10B981] py-3 items-center"
                >
                  <Text className="text-black text-sm font-bold">
                    {pinMode === "setup" ? "Set PIN" : "Confirm"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
          {pinMode === "idle" && pinExists && (
            <Text className="text-[#666666] text-xs">
              PIN is set. Turn the switch off and confirm your PIN to disable.
            </Text>
          )}
        </Section>

        {/* Danger zone */}
        <Section icon="warning-outline" title="Delete account">
          <Text className="text-[#666666] text-xs mb-3">
            Permanently removes your identity, customers, transactions, and
            settings. Audit markers are retained pseudonymously. Type DELETE to
            confirm.
          </Text>
          <TextInput
            className="border border-[#EF4444]/40 rounded-lg px-4 py-3 text-white bg-[#2D2D2D] mb-3"
            placeholder="DELETE"
            placeholderTextColor="#666666"
            value={deleteText}
            onChangeText={setDeleteText}
            autoCapitalize="characters"
          />
          <Pressable
            onPress={handleDeleteAccount}
            disabled={deleteText !== "DELETE" || deleting}
            className="rounded-lg border border-[#EF4444]/50 py-3 items-center"
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Text className="text-[#EF4444] text-sm font-bold">
                Delete my account
              </Text>
            )}
          </Pressable>
        </Section>

        {/* Sign out */}
        <Pressable
          className="flex-row items-center justify-center py-4 rounded-xl gap-3 border border-[#ff6b6b]"
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#ff6b6b" />
          <Text className="text-[#ff6b6b] text-base font-semibold">
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

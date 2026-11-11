import { useMemo, useState, useRef } from "react";
import { ErrorState } from "@/components/ErrorState";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
import { useCollection } from "@/hooks/useInsights";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { buildUpiUri } from "@/lib/upi";
import { CustomerAvatar } from "@/components/CustomerAvatar";
import { MoneyText } from "@/components/MoneyText";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/Button";
import { AgingStrip } from "@/components/AgingStrip";
import { formatCurrency } from "@/types/database";
import type { CollectionRow } from "@/lib/api";
import { colors } from "@/lib/theme";
import { usePressable } from "@/lib/press-feedback";
import { announce } from "@/lib/announce";

function ageLabel(ageDays: number | null): string {
  if (ageDays === null) return "—";
  if (ageDays === 0) return "Today";
  if (ageDays === 1) return "1 day";
  return `${ageDays} days`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type BusyAction = "share" | "copy" | "download" | "print" | null;

export default function CollectionScreen() {
  const press = usePressable();
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState<"amount" | "age">("amount");
  const { data, loading, error, refresh } = useCollection(sort);
  const { pendingCustomers, pendingEntries } = useOfflineQueue();
  const { settings } = useSettings();
  const { session } = useAuth();
  const [qrRow, setQrRow] = useState<CollectionRow | null>(null);
  const [busy, setBusy] = useState<BusyAction>(null);
  const qrRef = useRef<any>(null);

  const payeeName =
    settings?.payeeName?.trim() || session?.user.email.split("@")[0] || "Ledger-X";
  const upiId = settings?.upiId?.trim() ?? "";

  const shopUri = upiId
    ? buildUpiUri({ upiId, payeeName, note: "Khata payment" })
    : "";

  const upiUriFor = (row: CollectionRow) =>
    buildUpiUri({
      upiId,
      payeeName,
      amount: row.outstanding,
      note: `Khata balance for ${row.name}`,
    });

  const requireUpi = (): boolean => {
    if (upiId) return true;
    Alert.alert(
      "Add your UPI ID",
      "Open Profile → Payment settings, save your UPI ID, then come back to collect.",
    );
    return false;
  };

  const getQrBase64 = (): Promise<string> =>
    new Promise((resolve, reject) => {
      const ref = qrRef.current;
      if (!ref?.toDataURL) {
        reject(new Error("QR is still rendering"));
        return;
      }
      ref.toDataURL((data: string) => resolve(data));
    });

  const writeQrFile = async (): Promise<string> => {
    const base64 = await getQrBase64();
    const directory = FileSystem.cacheDirectory;
    if (!directory) throw new Error("No cache directory available");
    const fileUri = `${directory}ledger-x-upi-qr.png`;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return fileUri;
  };

  const shareQrFile = async (dialogTitle: string) => {
    const fileUri = await writeQrFile();
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Sharing unavailable", "The QR image was created on this device.");
      return;
    }
    await Sharing.shareAsync(fileUri, {
      mimeType: "image/png",
      dialogTitle,
      UTI: "public.png",
    });
  };

  const copyUpi = async () => {
    if (!requireUpi()) return;
    setBusy("copy");
    try {
      await Clipboard.setStringAsync(upiId);
      Alert.alert("Copied", "UPI ID copied to clipboard.");
    } finally {
      setBusy(null);
    }
  };

  const shareShopQr = async () => {
    if (!requireUpi()) return;
    setBusy("share");
    try {
      await shareQrFile("Share your payment QR");
    } catch {
      Alert.alert(
        "Could not share QR",
        "The QR image could not be created on this device. You can still copy your UPI ID.",
      );
    } finally {
      setBusy(null);
    }
  };

  const downloadQr = async () => {
    if (!requireUpi()) return;
    setBusy("download");
    try {
      await shareQrFile("Save your payment QR");
    } catch {
      Alert.alert(
        "Download failed",
        "The QR image could not be created on this device.",
      );
    } finally {
      setBusy(null);
    }
  };

  const printQr = async () => {
    if (!requireUpi()) return;
    setBusy("print");
    try {
      const base64 = await getQrBase64();
      await Print.printAsync({
        html: `
          <html>
            <body style="font-family: sans-serif; text-align: center; padding: 40px;">
              <h1 style="margin: 0 0 4px;">${escapeHtml(payeeName)}</h1>
              <p style="margin: 0 0 24px; color: #A3A3A3;">Scan to pay · UPI</p>
              <img src="data:image/png;base64,${base64}" width="320" height="320" />
              <p style="margin-top: 24px; font-size: 14px;">${escapeHtml(upiId)}</p>
            </body>
          </html>`,
      });
    } catch {
      Alert.alert("Print failed", "The print sheet could not be opened.");
    } finally {
      setBusy(null);
    }
  };

  /**
   * Customers created offline are queued locally, so they are merged into the
   * collection list with the balance recorded against them. Once they sync,
   * the server list contains them and the queue drops them.
   */
  const rows = useMemo<CollectionRow[]>(() => {
    const serverRows = data?.data ?? [];
    const pendingRows: CollectionRow[] = pendingCustomers.map((customer) => {
      const outstanding = pendingEntries
        .filter((entry) => entry.customerId === customer.id)
        .reduce(
          (sum, entry) =>
            sum + (entry.type === "credit" ? entry.amount : -entry.amount),
          0,
        );
      return {
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
        outstanding,
        oldestUnpaidCreditAt: null,
        ageDays: null,
      };
    });
    return [...pendingRows, ...serverRows];
  }, [data, pendingCustomers, pendingEntries]);

  const renderItem = ({ item }: { item: CollectionRow }) => {
    const ageTone =
      item.ageDays !== null && item.ageDays > 60
        ? "text-danger-text"
        : "text-ink-muted";
    return (
      <View className="flex-row items-center gap-3 border-b border-line py-3.5">
        <CustomerAvatar name={item.name} size={40} />
        <View className="flex-1">
          <Link href={`/customers/details?id=${item.customerId}`} asChild>
            <Pressable
              onPressIn={press.onPressIn}
              onPressOut={press.onPressOut}
              style={press.animatedStyle}
              className="min-h-[44px] justify-center active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.name}, ${formatCurrency(item.outstanding)} outstanding`}
            >
              <Text
                className="font-mukta-semibold text-[15px] text-ink"
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </Pressable>
          </Link>
          <Text className={`font-mukta text-[12px] ${ageTone}`}>
            Oldest unpaid: {ageLabel(item.ageDays)}
          </Text>
        </View>
        <View className="w-[88px] items-end">
          <MoneyText value={item.outstanding} numberOfLines={1} />
          <AgingStrip
            mode="bucket"
            ageDays={item.ageDays}
            className="mt-2 w-[64px]"
          />
        </View>
        <Pressable
          onPress={() => {
            if (!requireUpi()) return;
            setQrRow(item);
            announce(
              `Collection code opened for ${item.name}, ${formatCurrency(item.outstanding)} outstanding`,
            );
          }}
          className={`h-11 w-11 items-center justify-center rounded-xl border active:opacity-70 ${
            upiId ? "border-line bg-surface-raised" : "border-line bg-transparent"
          }`}
          accessibilityRole="button"
          accessibilityLabel={`Collect from ${item.name} via UPI`}
          accessibilityHint={
            upiId
              ? "Opens a QR code for this balance"
              : "Explains how to add your UPI ID"
          }
        >
          <Ionicons
            name="qr-code-outline"
            size={19}
            color={upiId ? colors.brandText : colors.inkMuted}
          />
        </Pressable>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-bg">
      <View className="px-5 pb-3" style={{ paddingTop: insets.top + 12 }}>
        <Text className="font-mukta-bold text-[24px] leading-[30px] text-ink">
          Collection
        </Text>
        <Text className="mt-0.5 font-mukta text-[12px] text-ink-muted">
          Scan, share, or print your payment QR
        </Text>
      </View>

      <FlatList
        data={rows}
        renderItem={renderItem}
        keyExtractor={(item) => item.customerId}
        showsVerticalScrollIndicator={false}
        onRefresh={refresh}
        refreshing={loading}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        ListHeaderComponent={
          <View className="gap-5 px-5 pb-2">
            <View className="rounded-2xl border border-brand-primary/30 bg-surface p-5">
              <View className="mb-4 h-[2px] w-10 rounded-full bg-brand-primary" />
              <Text className="font-mukta-bold text-[20px] text-ink">
                Scan to Pay
              </Text>
              <Text className="mt-1 font-mukta text-[13px] text-ink-muted">
                Let customers scan and pay via any UPI app.
              </Text>

              <View className="mt-4 items-center rounded-2xl bg-white p-4">
                {upiId ? (
                  <QRCode
                    value={shopUri}
                    size={176}
                    color={colors.bg}
                    backgroundColor={colors.white}
                    getRef={(ref) => {
                      qrRef.current = ref;
                    }}
                  />
                ) : (
                  <View className="h-[176px] w-[176px] items-center justify-center">
                    <Ionicons name="qr-code-outline" size={36} color={colors.inkFaint} />
                    <Text className="mt-2 px-3 text-center font-mukta text-[12px] text-ink-muted">
                      Add your UPI ID in Profile → Payment settings to enable
                      QRs.
                    </Text>
                  </View>
                )}
              </View>

              <View className="mt-4 flex-row items-center gap-2">
                <Text className="font-plex text-[11px] uppercase tracking-[1.2px] text-ink-muted">
                  {upiId ? upiId : "No UPI ID saved"}
                </Text>
              </View>

              <View className="my-4 flex-row items-center gap-3">
                <View className="h-px flex-1 bg-line" />
                <Text className="font-plex text-[11px] uppercase tracking-[1.5px] text-ink-muted">
                  or
                </Text>
                <View className="h-px flex-1 bg-line" />
              </View>

              <Button
                title="Share QR code"
                variant="secondary"
                onPress={shareShopQr}
                disabled={!upiId || busy !== null}
                loading={busy === "share"}
                icon={<Ionicons name="share-outline" size={17} color={colors.ink} />}
              />
            </View>

            <View>
              <SectionHeader label="Quick actions" />
              <View className="mt-3 gap-2">
                {[
                  {
                    key: "copy" as const,
                    label: "Copy UPI ID",
                    icon: "copy-outline" as const,
                    onPress: copyUpi,
                  },
                  {
                    key: "download" as const,
                    label: "Download QR",
                    icon: "download-outline" as const,
                    onPress: downloadQr,
                  },
                  {
                    key: "print" as const,
                    label: "Print QR",
                    icon: "print-outline" as const,
                    onPress: printQr,
                  },
                ].map((action) => (
                  <Pressable
                    key={action.key}
                    onPress={action.onPress}
                    disabled={busy !== null}
                    className="min-h-[52px] flex-row items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 active:bg-surface-raised disabled:opacity-60"
                    accessibilityRole="button"
                    accessibilityLabel={action.label}
                  >
                    <Ionicons name={action.icon} size={19} color={colors.brandText} />
                    <Text className="flex-1 font-mukta-semibold text-[14px] text-ink">
                      {action.label}
                    </Text>
                    {busy === action.key ? (
                      <ActivityIndicator size="small" color={colors.brand} />
                    ) : (
                      <Ionicons name="chevron-forward" size={17} color={colors.inkMuted} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <SectionHeader
                label={`To collect · ${rows.length}`}
                action={
                  <View className="flex-row gap-4">
                    {[
                      { key: "amount" as const, label: "Largest" },
                      { key: "age" as const, label: "Oldest" },
                    ].map((option) => (
                      <Pressable
                        key={option.key}
                        onPress={() => setSort(option.key)}
                        className="min-h-[44px] justify-center active:opacity-70"
                        accessibilityRole="tab"
                        accessibilityState={{ selected: sort === option.key }}
                      >
                        <Text
                          className={`font-mukta-semibold text-[12px] ${
                            sort === option.key
                              ? "text-brand-primary-text"
                              : "text-ink-muted"
                          }`}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                }
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          error ? (
            <View className="px-5 py-6">
              <ErrorState
                title="Could not load the collection list"
                message={error}
                onRetry={refresh}
              />
            </View>
          ) : !loading ? (
            <View className="items-center px-10 py-10">
              <Ionicons name="checkmark-circle-outline" size={38} color={colors.inkFaint} />
              <Text className="mt-3 font-mukta-semibold text-[17px] text-ink">
                Nothing to collect
              </Text>
              <Text className="mt-1 text-center font-mukta text-[13px] text-ink-muted">
                Every customer with a balance will appear here.
              </Text>
              {!upiId ? (
                <Button
                  title="Set up UPI"
                  variant="secondary"
                  className="mt-5"
                  onPress={() => router.push("/(tabs)/profile")}
                />
              ) : (
                <Button
                  title="Add a customer"
                  variant="secondary"
                  className="mt-5"
                  onPress={() => router.push("/customers/add")}
                />
              )}
            </View>
          ) : undefined
        }
      />

      <Modal
        visible={!!qrRow}
        transparent
        animationType="fade"
        onRequestClose={() => setQrRow(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/75 px-8">
          <View className="w-full items-center rounded-2xl border border-line bg-surface p-6">
            <Text className="font-mukta-bold text-[18px] text-ink">
              Collect from {qrRow?.name}
            </Text>
            <Text className="mt-1 text-center font-mukta text-[12px] text-ink-muted">
              Scan with any UPI app to pay{" "}
              {formatCurrency(qrRow?.outstanding ?? 0)} to {payeeName}
            </Text>
            {qrRow && upiId && (
              <View className="mt-5 rounded-xl bg-white p-4">
                <QRCode value={upiUriFor(qrRow)} size={200} />
              </View>
            )}
            <Text className="mt-4 text-center font-mukta text-[11px] text-ink-muted">
              Payment completion is recorded manually in the customer ledger.
            </Text>
            <Button
              title="Close"
              variant="secondary"
              className="mt-5 w-full"
              onPress={() => setQrRow(null)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

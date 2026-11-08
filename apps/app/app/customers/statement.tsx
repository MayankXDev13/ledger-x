import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { statementsApi, type Statement } from "@/lib/api";
import {
  formatMoney,
  formatStatementDate,
  renderStatementHtml,
  statementFileName,
} from "@/lib/statements";
import { useSettings } from "@/hooks/useSettings";

/**
 * Mobile statement flow (task 5.3): the API statement model is rendered into
 * HTML, turned into a PDF with expo-print, and handed to the OS share sheet
 * with the shared `<customer-slug>-statement-<start>_<end>.pdf` naming.
 */
export default function StatementScreen() {
  const { id, start: startParam, end: endParam } = useLocalSearchParams<{
    id: string;
    start?: string;
    end?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();

  const [statement, setStatement] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [start, setStart] = useState(startParam ?? "");
  const [end, setEnd] = useState(endParam ?? "");
  const [applied, setApplied] = useState({
    start: startParam ?? "",
    end: endParam ?? "",
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await statementsApi.get(id, {
          start: applied.start || undefined,
          end: applied.end || undefined,
        });
        if (!cancelled) setStatement(data);
      } catch (error) {
        if (!cancelled) {
          Alert.alert(
            "Statement unavailable",
            error instanceof Error ? error.message : "Could not load statement",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, applied]);

  const period =
    applied.start && applied.end
      ? `${formatStatementDate(applied.start)} – ${formatStatementDate(applied.end)}`
      : applied.start
        ? `From ${formatStatementDate(applied.start)}`
        : applied.end
          ? `Until ${formatStatementDate(applied.end)}`
          : "All transactions";

  const sharePdf = async () => {
    if (!statement) return;
    setSharing(true);
    try {
      const html = renderStatementHtml(statement, {
        businessName: settings?.payeeName ?? undefined,
      });
      const { uri } = await Print.printToFileAsync({ html });
      const filename = statementFileName(
        statement.customer.name,
        applied.start || null,
        applied.end || null,
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: filename,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Sharing unavailable", `PDF saved to ${uri}`);
      }
    } catch (error) {
      Alert.alert(
        "Could not share statement",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </Pressable>
        <Text style={styles.headerTitle}>Statement</Text>
        <Pressable onPress={sharePdf} disabled={!statement || sharing}>
          {sharing ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <Ionicons
              name="share-social-outline"
              size={22}
              color={statement ? "#10B981" : "#555555"}
            />
          )}
        </Pressable>
      </View>

      {/* Period filter */}
      <View style={styles.filter}>
        <View style={styles.filterField}>
          <Text style={styles.filterLabel}>Start (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.filterInput}
            placeholder="2026-01-01"
            placeholderTextColor="#555555"
            value={start}
            onChangeText={setStart}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.filterField}>
          <Text style={styles.filterLabel}>End (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.filterInput}
            placeholder="2026-01-31"
            placeholderTextColor="#555555"
            value={end}
            onChangeText={setEnd}
            autoCapitalize="none"
          />
        </View>
        <Pressable
          style={styles.applyBtn}
          onPress={() => setApplied({ start, end })}
        >
          <Text style={styles.applyText}>Apply</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : !statement ? (
        <View style={styles.loader}>
          <Text style={{ color: "#888888" }}>No statement available.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.document}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        >
          <View style={styles.docHeader}>
            <View>
              <Text style={styles.businessName}>
                {settings?.payeeName?.trim() || "Ledger-X"}
              </Text>
              <Text style={styles.muted}>Customer account statement</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.muted}>Period</Text>
              <Text style={styles.period}>{period}</Text>
            </View>
          </View>

          <View style={styles.customerBlock}>
            <Text style={styles.muted}>Customer</Text>
            <Text style={styles.customerName}>{statement.customer.name}</Text>
            <Text style={styles.muted}>{statement.customer.phone}</Text>
          </View>

          <View style={styles.totalsRow}>
            <View style={styles.totalItem}>
              <Text style={styles.muted}>Opening</Text>
              <Text style={styles.totalValue}>
                {formatMoney(statement.openingBalance)}
              </Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.muted}>Credit</Text>
              <Text style={[styles.totalValue, { color: "#10B981" }]}>
                {formatMoney(statement.totalCredit)}
              </Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.muted}>Paid</Text>
              <Text style={[styles.totalValue, { color: "#EF4444" }]}>
                {formatMoney(statement.totalDebit)}
              </Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[styles.muted, { color: "#CCCCCC" }]}>Closing</Text>
              <Text style={styles.totalValue}>
                {formatMoney(statement.closingBalance)}
              </Text>
            </View>
          </View>

          {/* Entries */}
          {statement.entries.length === 0 ? (
            <Text style={styles.empty}>No transactions in this period.</Text>
          ) : (
            statement.entries.map((entry) => (
              <View key={entry.id} style={styles.entryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryNoteText}>
                    {entry.note ||
                      (entry.type === "credit" ? "Credit" : "Payment")}
                    {entry.paymentMethod
                      ? `  ·  ${entry.paymentMethod.toUpperCase()}`
                      : ""}
                  </Text>
                  <Text style={styles.muted}>
                    {formatStatementDate(entry.date)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.entryAmount,
                    { color: entry.type === "credit" ? "#10B981" : "#EF4444" },
                  ]}
                >
                  {entry.type === "credit" ? "+" : "-"}
                  {formatMoney(entry.amount)}
                </Text>
                <Text style={styles.entryBalance}>
                  {formatMoney(entry.runningBalance)}
                </Text>
              </View>
            ))
          )}

          <Text style={styles.footnote}>
            Balances are computed over the customer's full history. Soft-deleted
            entries are excluded. Generated by Ledger-X; not a tax invoice.
          </Text>

          <Pressable style={styles.shareButton} onPress={sharePdf}>
            <Ionicons name="share-social" size={18} color="#000000" />
            <Text style={styles.shareText}>
              {sharing ? "Preparing PDF…" : "Share as PDF"}
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#ffffff" },
  filter: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  filterField: { flex: 1 },
  filterLabel: { color: "#888888", fontSize: 10, marginBottom: 4 },
  filterInput: {
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 8,
    backgroundColor: "#171717",
    color: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
  },
  applyBtn: {
    backgroundColor: "#1F1F1F",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  applyText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  document: { flex: 1, backgroundColor: "#121212", paddingHorizontal: 20 },
  docHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#2D2D2D",
    paddingVertical: 14,
  },
  businessName: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  muted: { color: "#888888", fontSize: 11 },
  period: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  customerBlock: { paddingVertical: 14 },
  customerName: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  totalsRow: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 14,
  },
  totalItem: { flex: 1 },
  totalValue: { color: "#ffffff", fontSize: 12, fontWeight: "700", marginTop: 2 },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#222222",
    paddingVertical: 10,
  },
  entryNoteText: { color: "#ffffff", fontSize: 12, fontWeight: "500" },
  entryAmount: { fontSize: 12, fontWeight: "700", width: 90, textAlign: "right" },
  entryBalance: {
    color: "#888888",
    fontSize: 11,
    width: 90,
    textAlign: "right",
  },
  empty: { color: "#888888", textAlign: "center", paddingVertical: 32 },
  footnote: { color: "#666666", fontSize: 10, marginTop: 16 },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10B981",
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 20,
  },
  shareText: { color: "#000000", fontSize: 14, fontWeight: "700" },
});

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
import { colors } from "@/lib/theme";

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
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            style={{ minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }}
            onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Statement</Text>
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share statement"
            accessibilityState={{ disabled: !statement || sharing, busy: sharing }}
            style={{ minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }}
            onPress={sharePdf}
            disabled={!statement || sharing}>
          {sharing ? (
            <ActivityIndicator size="small" color={colors.brand} />
          ) : (
            <Ionicons
              name="share-social-outline"
              size={22}
              color={statement ? colors.brand : colors.inkFaint}
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
            placeholderTextColor={colors.inkFaint}
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
            placeholderTextColor={colors.inkFaint}
            value={end}
            onChangeText={setEnd}
            autoCapitalize="none"
          />
        </View>
        <Pressable
            accessibilityRole="button"
          accessibilityLabel="Apply date filter"
          style={styles.applyBtn}
          onPress={() => setApplied({ start, end })}
        >
          <Text style={styles.applyText}>Apply</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.ink} />
        </View>
      ) : !statement ? (
        <View style={styles.loader}>
          <Text style={{ color: colors.inkMuted }}>No statement available.</Text>
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
              <Text style={[styles.totalValue, { color: colors.ink }]}>
                {formatMoney(statement.totalCredit)}
              </Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.muted}>Paid</Text>
              <Text style={[styles.totalValue, { color: colors.positive }]}>
                {formatMoney(statement.totalDebit)}
              </Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[styles.muted, { color: colors.inkMuted }]}>Closing</Text>
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
                    { color: entry.type === "credit" ? colors.ink : colors.positive },
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

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share statement"
            style={styles.shareButton}
            onPress={sharePdf}
          >
            <Ionicons name="share-social" size={18} color={colors.ink} />
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
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: colors.ink },
  filter: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  filterField: { flex: 1 },
  filterLabel: { color: colors.inkMuted, fontSize: 11, marginBottom: 4 },
  filterInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.surface,
    color: colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  applyBtn: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  applyText: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  document: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  docHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 14,
  },
  businessName: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  muted: { color: colors.inkMuted, fontSize: 11 },
  period: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  customerBlock: { paddingVertical: 14 },
  customerName: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  totalsRow: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    padding: 14,
  },
  totalItem: { flex: 1 },
  totalValue: { color: colors.ink, fontSize: 13, fontWeight: "700", marginTop: 2, fontVariant: ["tabular-nums"] },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 10,
  },
  entryNoteText: { color: colors.ink, fontSize: 13, fontWeight: "500" },
  entryAmount: { fontSize: 13, fontWeight: "700", width: 90, textAlign: "right", fontVariant: ["tabular-nums"] },
  entryBalance: {
    color: colors.inkMuted,
    fontSize: 11,
    width: 90,
    textAlign: "right",
  },
  empty: { color: colors.inkMuted, textAlign: "center", paddingVertical: 32 },
  footnote: { color: colors.inkMuted, fontSize: 11, marginTop: 16 },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brandFill,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 20,
  },
  shareText: { color: colors.ink, fontSize: 14, fontWeight: "700" },
});

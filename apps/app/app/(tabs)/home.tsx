import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import {
  dashboardApi,
  type Analytics,
  type DashboardMetrics,
} from "@/lib/api";
import { QuickEntryModal } from "@/components/QuickEntryModal";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { OfflinePendingBar } from "@/components/OfflinePendingBar";
import { CustomerAvatar } from "@/components/CustomerAvatar";
import { Button } from "@/components/Button";
import { MoneyText } from "@/components/MoneyText";
import { AgingLegend, AgingStrip } from "@/components/AgingStrip";
import { SectionHeader } from "@/components/SectionHeader";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { colors } from "@/lib/theme";
import { usePressable } from "@/lib/press-feedback";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthLabel(month: string): string {
  const [, m] = month.split("-");
  return MONTH_LABELS[Number(m) - 1] ?? month;
}

function greetingName(name: string | null | undefined, email: string | undefined): string {
  if (name && name.trim()) {
    const first = name.trim().split(/\s+/)[0];
    return first.charAt(0).toUpperCase() + first.slice(1);
  }
  const local = email?.split("@")[0] ?? "shopkeeper";
  const cleaned = local.replace(/[0-9]+$/, "");
  const pretty = (cleaned || local).replace(/[._-]+/g, " ").trim();
  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
}

function StatColumn({
  label,
  children,
  first,
}: {
  label: string;
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <View className={`flex-1 px-3 ${first ? "" : "border-l border-line"}`}>
      <Text className="font-plex text-[11px] uppercase tracking-[1.2px] text-ink-muted">
        {label}
      </Text>
      <View className="mt-1">{children}</View>
    </View>
  );
}

function HomeSkeleton() {
  return (
    <View className="gap-4">
      <View className="h-6 w-40 rounded bg-surface-raised" />
      <View className="h-10 w-56 rounded bg-surface-raised" />
      <View className="h-12 rounded-xl bg-surface-raised" />
      <View className="h-10 rounded-xl bg-surface-raised" />
      <View className="h-28 rounded-2xl bg-surface-raised" />
      <View className="h-20 rounded-xl bg-surface-raised" />
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const press = usePressable();
  const { session, loading: authLoading } = useAuth();
  const { outstanding, items, syncing, isOnline, retry, discard, queuedEntries } =
    useOfflineQueue();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickEntryType, setQuickEntryType] = useState<"credit" | "debit" | null>(
    null,
  );

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [metricsData, analyticsData] = await Promise.all([
        dashboardApi.metrics(),
        dashboardApi.analytics(),
      ]);
      setMetrics(metricsData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your totals");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (authLoading) return;
      fetchDashboardData();
    }, [authLoading, fetchDashboardData]),
  );

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!session) {
    return null;
  }

  // Entries recorded offline are not on the server yet, so they are added to
  // the outstanding figure here. Once the server accepts them its value
  // includes them, and only the entries the server has not taken yet are
  // counted here, so nothing is counted twice.
  const pendingNet = queuedEntries
    .filter((entry) => entry.pending)
    .reduce(
      (sum, entry) => sum + (entry.type === "credit" ? entry.amount : -entry.amount),
      0,
    );
  const totalReceivables = (analytics?.totalReceivables ?? 0) + pendingNet;
  const aging = analytics?.aging ?? { "0-30": 0, "31-60": 0, "60+": 0 };
  const maxTrend = Math.max(
    1,
    ...(analytics?.trend ?? []).map((t) => Math.max(t.credit, t.debit)),
  );
  const oldestAge = (analytics?.topDebtors ?? []).reduce<number | null>(
    (oldest, debtor) =>
      debtor.ageDays === null
        ? oldest
        : oldest === null
          ? debtor.ageDays
          : Math.max(oldest, debtor.ageDays),
    null,
  );
  const hasTrend = (analytics?.trend ?? []).some((t) => t.credit || t.debit);
  const firstName = greetingName(session.user.name, session.user.email);
  const hasCustomers = (metrics?.totalCustomers ?? 0) > 0;

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchDashboardData();
            }}
            tintColor={colors.inkMuted}
            colors={[colors.brand]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="font-mukta-black text-[24px] leading-[30px] text-ink">
              Ledger-<Text className="text-brand-primary">X</Text>
            </Text>
            <Text className="mt-0.5 font-mukta text-[15px] text-ink-muted">
              Namaste, {firstName}
            </Text>
          </View>
          <Text className="mt-1 font-plex text-[11px] uppercase tracking-[1.5px] text-ink-muted">
            {format(new Date(), "d MMM").toUpperCase()}
          </Text>
        </View>

        <OfflinePendingBar
          outstanding={outstanding}
          syncing={syncing}
          isOnline={isOnline}
          items={items}
          onRetry={retry}
          onDiscard={discard}
        />

        {loading ? (
          <View className="mt-6">
            <HomeSkeleton />
          </View>
        ) : error ? (
          <View className="mt-8 rounded-2xl border border-line bg-surface p-5">
            <Text className="font-mukta-semibold text-[15px] text-ink">
              Couldn&apos;t load your totals
            </Text>
            <Text className="mt-1 font-mukta text-[13px] text-ink-muted">
              {error}
            </Text>
            <Button
              title="Try again"
              className="mt-4"
              onPress={() => {
                setLoading(true);
                fetchDashboardData();
              }}
            />
          </View>
        ) : (
          <>
            {/* ─── Hero: total outstanding ─── */}
            <View className="mt-7">
              <SectionHeader label="Total outstanding" />
              <MoneyText
                value={totalReceivables}
                size="hero"
                className="mt-3"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              />
              <AgingStrip
                mode="proportional"
                buckets={aging}
                className="mt-4"
              />
              <View className="mt-3 flex-row items-center justify-between gap-3">
                <AgingLegend />
                <Text className="font-mukta-medium text-[11px] text-ink-muted">
                  {oldestAge === null
                    ? "Nothing outstanding"
                    : `Oldest unpaid ${oldestAge}d`}
                </Text>
              </View>
            </View>

            {/* ─── Supporting stats ─── */}
            <View className="mt-6 flex-row border-y border-line py-3">
              <StatColumn label="Customers" first>
                <Text className="font-mukta-bold text-[15px] text-ink">
                  {metrics?.totalCustomers ?? 0}
                </Text>
              </StatColumn>
              <StatColumn label="This month">
                <MoneyText
                  value={metrics?.monthlyNet ?? 0}
                  sign={(metrics?.monthlyNet ?? 0) >= 0 ? "+" : "-"}
                  numberOfLines={1}
                />
              </StatColumn>
              <StatColumn label="Net balance">
                <MoneyText value={metrics?.totalBalance ?? 0} numberOfLines={1} />
              </StatColumn>
            </View>

            {/* ─── Actions ─── */}
            <View className="mt-5 flex-row gap-3">
              <Pressable
                onPress={() => setQuickEntryType("credit")}
                onPressIn={press.onPressIn}
                onPressOut={press.onPressOut}
                style={press.animatedStyle}
                className="min-h-[52px] flex-1 flex-row items-center justify-center gap-1 rounded-xl bg-brand-primary-fill px-4 active:opacity-80"
                accessibilityRole="button"
                accessibilityLabel="Add credit"
              >
                <Ionicons name="add" size={18} color={colors.white} />
                <Text className="font-mukta-semibold text-[15px] text-white">
                  Add credit
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setQuickEntryType("debit")}
                onPressIn={press.onPressIn}
                onPressOut={press.onPressOut}
                style={press.animatedStyle}
                className="min-h-[52px] flex-1 items-center justify-center rounded-xl border border-line bg-surface px-4 active:opacity-80"
                accessibilityRole="button"
                accessibilityLabel="Record payment"
              >
                <Text className="font-mukta-semibold text-[15px] text-ink">
                  Record payment
                </Text>
              </Pressable>
            </View>

            {/* ─── 12-month trend ─── */}
            <View className="mt-8">
              <SectionHeader
                label="12-month trend"
                action={
                  <View className="flex-row items-center gap-3">
                    <View className="flex-row items-center gap-1">
                      <View className="h-1.5 w-1.5 rounded-full bg-ink-muted" />
                      <Text className="font-mukta-medium text-[11px] text-ink-muted">
                        Credit given
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <View className="h-1.5 w-1.5 rounded-full bg-positive" />
                      <Text className="font-mukta-medium text-[11px] text-ink-muted">
                        Paid
                      </Text>
                    </View>
                  </View>
                }
              />
              <View className="mt-3 rounded-2xl border border-line bg-surface p-4">
                {hasTrend ? (
                  <>
                    <View className="h-28 flex-row items-end gap-1">
                      {analytics!.trend.map((point) => (
                        <View
                          key={point.month}
                          className="flex-1 flex-row items-end justify-center gap-[2px]"
                        >
                          {point.credit > 0 && (
                            <View
                              style={{
                                height: Math.max(
                                  3,
                                  (point.credit / maxTrend) * 100,
                                ),
                                width: 3,
                                borderRadius: 2,
                                backgroundColor: colors.inkMuted,
                              }}
                            />
                          )}
                          {point.debit > 0 && (
                            <View
                              style={{
                                height: Math.max(
                                  3,
                                  (point.debit / maxTrend) * 100,
                                ),
                                width: 3,
                                borderRadius: 2,
                                backgroundColor: colors.positive,
                              }}
                            />
                          )}
                        </View>
                      ))}
                    </View>
                    <View className="mt-3 h-px bg-line" />
                    <View className="mt-2 flex-row">
                      {analytics!.trend.map((point, index) => (
                        <Text
                          key={point.month}
                          className="flex-1 text-center font-plex text-[11px] text-ink-muted"
                        >
                          {index % 2 === 0 ? monthLabel(point.month) : ""}
                        </Text>
                      ))}
                    </View>
                  </>
                ) : (
                  <View className="items-center py-6">
                    <Ionicons
                      name="bar-chart-outline"
                      size={32}
                      color={colors.inkMuted}
                    />
                    <Text className="mt-2 font-mukta text-[13px] text-ink-muted">
                      No activity in the last 12 months
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* ─── Top debtors ─── */}
            <View className="mt-8">
              <SectionHeader
                label="Top debtors"
                action={
                  <Link href="/(tabs)/customers" asChild>
                    <Pressable
                      className="min-h-[44px] justify-center px-1 active:opacity-70"
                      accessibilityRole="button"
                      accessibilityLabel="View all customers"
                    >
                      <Text className="font-mukta-semibold text-[13px] text-ink">
                        View all →
                      </Text>
                    </Pressable>
                  </Link>
                }
              />
              {analytics && analytics.topDebtors.length > 0 ? (
                <View className="mt-3 gap-2">
                  {analytics.topDebtors.slice(0, 5).map((debtor) => {
                    const ageLabel =
                      debtor.ageDays === null
                        ? "No unpaid credit"
                        : `Unpaid ${debtor.ageDays}d`;
                    const ageColor =
                      debtor.ageDays !== null && debtor.ageDays > 60
                        ? "text-danger-text"
                        : "text-ink-muted";
                    return (
                      <Link
                        key={debtor.customerId}
                        href={`/customers/details?id=${debtor.customerId}`}
                        asChild
                      >
                        <Pressable
            accessibilityRole="button" className="flex-row items-center gap-3 rounded-xl border border-line bg-surface px-3 py-3 active:opacity-80">
                          <CustomerAvatar name={debtor.name} size={36} />
                          <View className="flex-1">
                            <Text
                              className="font-mukta-semibold text-[15px] text-ink"
                              numberOfLines={1}
                            >
                              {debtor.name}
                            </Text>
                            <Text
                              className={`mt-0.5 font-mukta text-[13px] ${ageColor}`}
                            >
                              {ageLabel}
                            </Text>
                          </View>
                          <View className="w-[84px] items-end">
                            <MoneyText
                              value={debtor.outstanding}
                              numberOfLines={1}
                            />
                            <AgingStrip
                              mode="bucket"
                              ageDays={debtor.ageDays}
                              className="mt-2 w-[64px]"
                            />
                          </View>
                        </Pressable>
                      </Link>
                    );
                  })}
                </View>
              ) : hasCustomers ? (
                <View className="mt-3 items-center rounded-xl border border-line bg-surface py-6">
                  <Text className="font-mukta text-[13px] text-ink-muted">
                    No outstanding balances
                  </Text>
                </View>
              ) : (
                <View className="mt-3 items-center rounded-xl border border-line bg-surface py-6 px-4">
                  <Text className="font-mukta-semibold text-[15px] text-ink">
                    Add your first customer
                  </Text>
                  <Text className="mt-1 text-center font-mukta text-[13px] text-ink-muted">
                    Record a credit and it will show up here with the amount the
                    customer owes you.
                  </Text>
                  <Link href="/(tabs)/customers" asChild>
                    <Pressable
                      className="mt-4 min-h-[44px] justify-center rounded-xl bg-brand-primary-fill px-5 active:opacity-80"
                      accessibilityRole="button"
                      accessibilityLabel="Add your first customer"
                    >
                      <Text className="font-mukta-semibold text-[15px] text-white">
                        Add customer
                      </Text>
                    </Pressable>
                  </Link>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <QuickEntryModal
        visible={quickEntryType !== null}
        onClose={() => setQuickEntryType(null)}
        type={quickEntryType || "credit"}
        onEntryAdded={fetchDashboardData}
      />

      <OnboardingDialog />
    </View>
  );
}

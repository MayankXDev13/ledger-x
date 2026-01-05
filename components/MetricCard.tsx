import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MetricCardProps {
  title: string;
  value: string;
  icon: string;
  iconColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function MetricCard({
  title,
  value,
  icon,
  iconColor,
  trend,
}: MetricCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View
          style={[styles.iconContainer, { backgroundColor: iconColor + "20" }]}
        >
          <Ionicons name={icon as any} size={20} color={iconColor} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {trend && (
        <View style={styles.trendContainer}>
          <Ionicons
            name={trend.isPositive ? "trending-up" : "trending-down"}
            size={14}
            color={trend.isPositive ? "#10B981" : "#EF4444"}
          />
          <Text
            style={[
              styles.trendText,
              { color: trend.isPositive ? "#10B981" : "#EF4444" },
            ]}
          >
            {trend.value}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    color: "#888888",
    fontWeight: "500",
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trendText: {
    fontSize: 13,
    fontWeight: "500",
  },
});

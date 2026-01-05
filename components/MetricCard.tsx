import React from "react";
import { View, Text } from "react-native";
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
    <View className="bg-[#2a2a2a] rounded-xl p-4">
      <View className="flex-row items-center gap-2 mb-3">
        <View
          className="w-9 h-9 rounded-lg items-center justify-center"
          style={{ backgroundColor: iconColor + "20" }}
        >
          <Ionicons name={icon as any} size={20} color={iconColor} />
        </View>
        <Text className="text-sm text-gray-400 font-medium">{title}</Text>
      </View>
      <Text className="text-2xl font-bold text-white mb-1">{value}</Text>
      {trend && (
        <View className="flex-row items-center gap-1">
          <Ionicons
            name={trend.isPositive ? "trending-up" : "trending-down"}
            size={14}
            color={trend.isPositive ? "#10B981" : "#EF4444"}
          />
          <Text
            className="text-sm font-medium"
            style={{ color: trend.isPositive ? "#10B981" : "#EF4444" }}
          >
            {trend.value}
          </Text>
        </View>
      )}
    </View>
  );
}

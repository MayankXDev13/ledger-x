import React, { useState } from "react";
import { View, Text, Pressable, Modal, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DateFilter, DATE_FILTER_PRESETS } from "@/types/database";
import { colors } from "@/lib/theme";

interface DateFilterDropdownProps {
  selectedFilter: DateFilter;
  onFilterChange: (filter: DateFilter) => void;
}

export function DateFilterDropdown({
  selectedFilter,
  onFilterChange,
}: DateFilterDropdownProps) {
  const [visible, setVisible] = useState(false);

  const currentLabel =
    DATE_FILTER_PRESETS.find(
      (p) => p.start === selectedFilter.start && p.end === selectedFilter.end,
    )?.label || "Custom";

  const handleSelect = (filter: DateFilter) => {
    onFilterChange({
      ...filter,
      label:
        DATE_FILTER_PRESETS.find(
          (p) => p.start === filter.start && p.end === filter.end,
        )?.label || "Custom",
    });
    setVisible(false);
  };

  return (
    <>
      <Pressable
            accessibilityRole="button"
        accessibilityLabel={`Filter by date, currently ${currentLabel}`}
        accessibilityState={{ expanded: visible }}
        className="flex-row items-center bg-surface-raised px-3 py-2 rounded-lg gap-1.5"
        onPress={() => setVisible(true)}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.brand} />
        <Text className="text-white text-sm font-medium">{currentLabel}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.inkMuted} />
      </Pressable>

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
            accessibilityRole="button"
          className="flex-1 bg-black/50 justify-start pt-25 px-4"
          onPress={() => setVisible(false)}
        >
          <View className="bg-surface-raised rounded-xl overflow-hidden">
            <View className="flex-row justify-between items-center p-4 border-b border-line">
              <Text className="text-white text-base font-semibold">
                Filter by Date
              </Text>
              <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close date filter"
            style={{ minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }}
            onPress={() => setVisible(false)}>
                <Ionicons name="close" size={20} color={colors.inkMuted} />
              </Pressable>
            </View>

            <FlatList
              data={DATE_FILTER_PRESETS}
              keyExtractor={(item) => item.label}
              renderItem={({ item }) => {
                const isSelected =
                  item.start === selectedFilter.start &&
                  item.end === selectedFilter.end;

                return (
                  <Pressable
            accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: isSelected }}
                    className={`flex-row items-center py-3.5 px-4 gap-2.5 ${isSelected ? "bg-brand-primary-fill/10" : ""}`}
                    onPress={() => handleSelect(item)}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color={colors.brand} />
                    )}
                    <Text
                      className={`text-base ${isSelected ? "text-brand-primary font-medium" : "text-ink-muted"}`}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={() => (
                <View className="h-px bg-line mx-4" />
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

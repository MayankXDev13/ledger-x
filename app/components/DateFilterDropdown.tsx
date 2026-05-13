import React, { useState } from "react";
import { View, Text, Pressable, Modal, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DateFilter, DATE_FILTER_PRESETS } from "@/types/database";

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
        className="flex-row items-center bg-[#2D2D2D] px-3 py-2 rounded-lg gap-1.5"
        onPress={() => setVisible(true)}
      >
        <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
        <Text className="text-white text-sm font-medium">{currentLabel}</Text>
        <Ionicons name="chevron-down" size={16} color="#A0A0A0" />
      </Pressable>

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-start pt-25 px-4"
          onPress={() => setVisible(false)}
        >
          <View className="bg-[#2D2D2D] rounded-xl overflow-hidden">
            <View className="flex-row justify-between items-center p-4 border-b border-[#3D3D3D]">
              <Text className="text-white text-base font-semibold">
                Filter by Date
              </Text>
              <Pressable onPress={() => setVisible(false)}>
                <Ionicons name="close" size={20} color="#A0A0A0" />
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
                    className={`flex-row items-center py-3.5 px-4 gap-2.5 ${isSelected ? "bg-blue-500/10" : ""}`}
                    onPress={() => handleSelect(item)}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#3B82F6" />
                    )}
                    <Text
                      className={`text-base ${isSelected ? "text-blue-500 font-medium" : "text-[#A0A0A0]"}`}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={() => (
                <View className="h-px bg-[#3D3D3D] mx-4" />
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

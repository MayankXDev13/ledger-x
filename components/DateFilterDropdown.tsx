import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
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
      <Pressable style={styles.trigger} onPress={() => setVisible(true)}>
        <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
        <Text style={styles.triggerText}>{currentLabel}</Text>
        <Ionicons name="chevron-down" size={16} color="#A0A0A0" />
      </Pressable>

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.dropdown}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Filter by Date</Text>
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
                    style={[styles.item, isSelected && styles.itemSelected]}
                    onPress={() => handleSelect(item)}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#3B82F6" />
                    )}
                    <Text
                      style={[
                        styles.itemText,
                        isSelected && styles.itemTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2D2D2D",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  triggerText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    paddingTop: 100,
    paddingHorizontal: 16,
  },
  dropdown: {
    backgroundColor: "#2D2D2D",
    borderRadius: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#3D3D3D",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  itemSelected: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  itemText: {
    color: "#A0A0A0",
    fontSize: 15,
  },
  itemTextSelected: {
    color: "#3B82F6",
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: "#3D3D3D",
    marginHorizontal: 16,
  },
});

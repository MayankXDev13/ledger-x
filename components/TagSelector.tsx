import React from "react";
import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ContactTag } from "@/types/database";

interface TagSelectorProps {
  selectedTags: ContactTag[];
  onTagsChange: (tags: ContactTag[]) => void;
  availableTags: ContactTag[];
  onManageTags: () => void;
}

export function TagSelector({
  selectedTags,
  onTagsChange,
  availableTags,
  onManageTags,
}: TagSelectorProps) {
  const toggleTag = (tag: ContactTag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Tags</Text>
        <Pressable style={styles.manageButton} onPress={onManageTags}>
          <Ionicons name="pricetags-outline" size={16} color="#3B82F6" />
          <Text style={styles.manageButtonText}>Manage</Text>
        </Pressable>
      </View>

      {availableTags.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tags yet</Text>
          <Pressable onPress={onManageTags} style={styles.createTagButton}>
            <Text style={styles.createTagButtonText}>
              Create your first tag
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          horizontal
          data={availableTags}
          keyExtractor={(tag) => tag.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item: tag }) => {
            const isSelected = selectedTags.some((t) => t.id === tag.id);
            return (
              <Pressable
                style={[
                  styles.tagChip,
                  { backgroundColor: tag.color + "20" },
                  isSelected && styles.tagChipSelected,
                ]}
                onPress={() => toggleTag(tag)}
              >
                <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                <Text
                  style={[styles.tagText, isSelected && styles.tagTextSelected]}
                >
                  {tag.name}
                </Text>
                {isSelected && (
                  <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                )}
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
          contentContainerStyle={styles.tagsList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    color: "#A0A0A0",
    fontSize: 14,
    fontWeight: "500",
  },
  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  manageButtonText: {
    color: "#3B82F6",
    fontSize: 13,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emptyText: {
    color: "#A0A0A0",
    fontSize: 14,
    marginBottom: 8,
  },
  createTagButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#3B82F6",
    borderRadius: 8,
  },
  createTagButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  tagsList: {
    paddingVertical: 4,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 6,
  },
  tagChipSelected: {
    borderColor: "#FFFFFF",
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  tagTextSelected: {
    fontWeight: "500",
  },
});

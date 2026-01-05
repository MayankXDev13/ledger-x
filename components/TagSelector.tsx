import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";
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
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-2.5">
        <Text className="text-[#A0A0A0] text-sm font-medium">Tags</Text>
        <Pressable
          className="flex-row items-center gap-1 py-1 px-2"
          onPress={onManageTags}
        >
          <Ionicons name="pricetags-outline" size={16} color="#3B82F6" />
          <Text className="text-[#3B82F6] text-xs font-medium">Manage</Text>
        </Pressable>
      </View>

      {availableTags.length === 0 ? (
        <View className="items-center py-4">
          <Text className="text-[#A0A0A0] text-sm mb-2">No tags yet</Text>
          <Pressable
            onPress={onManageTags}
            className="py-2 px-4 bg-blue-500 rounded-lg"
          >
            <Text className="text-white text-sm font-medium">
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
                className={`flex-row items-center py-1.5 px-3 rounded-full gap-1.5 border border-transparent ${isSelected ? "border-white" : ""}`}
                style={{ backgroundColor: tag.color + "20" }}
                onPress={() => toggleTag(tag)}
              >
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <Text
                  className={`text-white text-sm ${isSelected ? "font-medium" : ""}`}
                >
                  {tag.name}
                </Text>
                {isSelected && (
                  <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                )}
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View className="w-2" />}
          contentContainerStyle={{ paddingVertical: 1 }}
        />
      )}
    </View>
  );
}

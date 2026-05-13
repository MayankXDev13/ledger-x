import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TransactionTag, TAG_COLORS } from "@/types/database";
import { supabase } from "@/lib/supabase";

interface TransactionTagManagementModalProps {
  visible: boolean;
  onClose: () => void;
  tags: TransactionTag[];
  onTagsChange: (tags: TransactionTag[]) => void;
  userId: string;
}

export function TransactionTagManagementModal({
  visible,
  onClose,
  tags,
  onTagsChange,
  userId,
}: TransactionTagManagementModalProps) {
  const [editingTag, setEditingTag] = useState<TransactionTag | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<string>(TAG_COLORS[0]);
  const [deleteConfirmTag, setDeleteConfirmTag] =
    useState<TransactionTag | null>(null);
  const [deleteUsageCount, setDeleteUsageCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleCreateTag = async () => {
    if (!editName.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transaction_tags")
        .insert({ user_id: userId, name: editName.trim(), color: editColor })
        .select()
        .single();

      if (error) throw error;
      onTagsChange([...tags, data]);
      setEditName("");
      setEditColor(TAG_COLORS[0]);
    } catch (error) {
      console.error("Error creating tag:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTag = async () => {
    if (!editingTag || !editName.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("transaction_tags")
        .update({ name: editName.trim(), color: editColor })
        .eq("id", editingTag.id);

      if (error) throw error;

      onTagsChange(
        tags.map((t) =>
          t.id === editingTag.id
            ? { ...t, name: editName.trim(), color: editColor }
            : t,
        ),
      );
      setEditingTag(null);
      setEditName("");
    } catch (error) {
      console.error("Error updating tag:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async () => {
    if (!deleteConfirmTag) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("transaction_tags")
        .delete()
        .eq("id", deleteConfirmTag.id);

      if (error) throw error;
      onTagsChange(tags.filter((t) => t.id !== deleteConfirmTag.id));
      setDeleteConfirmTag(null);
    } catch (error) {
      console.error("Error deleting tag:", error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (tag: TransactionTag) => {
    setEditingTag(tag);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const startDelete = async (tag: TransactionTag) => {
    const { data } = await supabase.rpc("get_transaction_tag_usage_count", {
      p_tag_id: tag.id,
    });
    setDeleteUsageCount(data || 0);
    setDeleteConfirmTag(tag);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-[#1A1A1A]">
        <View className="flex-row justify-between items-center px-4 py-4 border-b border-[#2D2D2D]">
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">
            Manage Transaction Tags
          </Text>
          <View className="w-6" />
        </View>

        <FlatList
          data={tags}
          keyExtractor={(tag) => tag.id}
          ListHeaderComponent={
            <View className="p-4 bg-[#2D2D2D] mb-4 rounded-xl">
              <Text className="text-white text-sm font-semibold mb-3">
                Create New Tag
              </Text>
              <View className="flex-row items-center gap-2.5 mb-3">
                <View
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: editColor }}
                />
                <TextInput
                  className="flex-1 bg-[#3D3D3D] rounded-lg px-3 py-2.5 text-white text-sm"
                  placeholder="Tag name"
                  placeholderTextColor="#666"
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>

              <View className="flex-row gap-2 mb-4 flex-wrap">
                {TAG_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    className={`w-7 h-7 rounded-full ${
                      editColor === color ? "border-2 border-white" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onPress={() => setEditColor(color)}
                  />
                ))}
              </View>

              <Pressable
                className={`py-3 rounded-lg items-center ${
                  !editName.trim() || loading ? "opacity-50" : "bg-blue-500"
                }`}
                onPress={handleCreateTag}
                disabled={!editName.trim() || loading}
              >
                <Text className="text-white text-sm font-semibold">
                  Create Tag
                </Text>
              </Pressable>
            </View>
          }
          renderItem={({ item: tag }) => (
            <View className="flex-row justify-between items-center py-3">
              <View className="flex-row items-center gap-2.5">
                <View
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <Text className="text-white text-base">{tag.name}</Text>
              </View>
              <View className="flex-row gap-2">
                <Pressable className="p-2" onPress={() => startEdit(tag)}>
                  <Ionicons name="pencil-outline" size={20} color="#3B82F6" />
                </Pressable>
                <Pressable className="p-2" onPress={() => startDelete(tag)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text className="text-[#666] text-sm text-center py-8">
              No transaction tags created yet
            </Text>
          }
          ItemSeparatorComponent={() => <View className="h-px bg-[#2D2D2D]" />}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />

        {editingTag && (
          <Modal
            transparent
            visible={!!editingTag}
            animationType="fade"
            onRequestClose={() => setEditingTag(null)}
          >
            <Pressable
              className="flex-1 bg-black/70 justify-center items-center"
              onPress={() => setEditingTag(null)}
            >
              <View className="bg-[#2D2D2D] rounded-xl p-6 w-[85%] max-w-[360]">
                <Text className="text-white text-xl font-semibold mb-4 text-center">
                  Edit Tag
                </Text>
                <View className="flex-row items-center gap-2.5 mb-3">
                  <View
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: editColor }}
                  />
                  <TextInput
                    className="flex-1 bg-[#3D3D3D] rounded-lg px-3 py-2.5 text-white text-sm"
                    placeholder="Tag name"
                    placeholderTextColor="#666"
                    value={editName}
                    onChangeText={setEditName}
                  />
                </View>

                <View className="flex-row gap-2 mb-4 flex-wrap">
                  {TAG_COLORS.map((color) => (
                    <Pressable
                      key={color}
                      className={`w-7 h-7 rounded-full ${
                        editColor === color ? "border-2 border-white" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onPress={() => setEditColor(color)}
                    />
                  ))}
                </View>

                <View className="flex-row gap-3">
                  <Pressable
                    className="flex-1 py-3 rounded-lg items-center bg-[#3D3D3D]"
                    onPress={() => setEditingTag(null)}
                  >
                    <Text className="text-white text-sm font-medium">
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    className={`flex-1 py-3 rounded-lg items-center ${
                      loading ? "opacity-50" : "bg-blue-500"
                    }`}
                    onPress={handleEditTag}
                    disabled={loading}
                  >
                    <Text className="text-white text-sm font-semibold">
                      Save
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </Modal>
        )}

        {deleteConfirmTag && (
          <Modal
            transparent
            visible={!!deleteConfirmTag}
            animationType="fade"
            onRequestClose={() => setDeleteConfirmTag(null)}
          >
            <Pressable
              className="flex-1 bg-black/70 justify-center items-center"
              onPress={() => setDeleteConfirmTag(null)}
            >
              <View className="bg-[#2D2D2D] rounded-xl p-6 w-[85%] max-w-[360]">
                <Ionicons
                  name="warning-outline"
                  size={48}
                  color="#EF4444"
                  className="self-center mb-4"
                />
                <Text className="text-white text-xl font-semibold mb-4 text-center">
                  Delete Tag?
                </Text>
                <Text className="text-[#A0A0A0] text-sm text-center mb-6 leading-5">
                  This tag is used by {deleteUsageCount} transaction
                  {deleteUsageCount !== 1 ? "s" : ""}.{"\n\n"}Removing it will
                  remove this tag from all transactions.
                </Text>
                <View className="flex-row gap-3">
                  <Pressable
                    className="flex-1 py-3 rounded-lg items-center bg-[#3D3D3D]"
                    onPress={() => setDeleteConfirmTag(null)}
                  >
                    <Text className="text-white text-sm font-medium">
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 py-3 rounded-lg items-center bg-red-500"
                    onPress={handleDeleteTag}
                    disabled={loading}
                  >
                    <Text className="text-white text-sm font-semibold">
                      Delete
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

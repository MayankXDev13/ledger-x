import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ContactTag, TAG_COLORS } from "@/types/database";
import { supabase } from "@/lib/supabase";

interface TagManagementModalProps {
  visible: boolean;
  onClose: () => void;
  tags: ContactTag[];
  onTagsChange: (tags: ContactTag[]) => void;
  userId: string;
}

interface TagItem {
  tag: ContactTag;
  usageCount: number;
}

export function TagManagementModal({
  visible,
  onClose,
  tags,
  onTagsChange,
  userId,
}: TagManagementModalProps) {
  const [editingTag, setEditingTag] = useState<ContactTag | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<string>(TAG_COLORS[0]);
  const [deleteConfirmTag, setDeleteConfirmTag] = useState<ContactTag | null>(
    null,
  );
  const [deleteUsageCount, setDeleteUsageCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleCreateTag = async () => {
    if (!editName.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_tags")
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
        .from("contact_tags")
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
        .from("contact_tags")
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

  const startEdit = (tag: ContactTag) => {
    setEditingTag(tag);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const startDelete = async (tag: ContactTag) => {
    const { data } = await supabase.rpc("get_tag_usage_count", {
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Manage Tags</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={tags}
          keyExtractor={(tag) => tag.id}
          ListHeaderComponent={
            <View style={styles.createSection}>
              <Text style={styles.sectionTitle}>Create New Tag</Text>
              <View style={styles.createRow}>
                <View
                  style={[styles.colorDot, { backgroundColor: editColor }]}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Tag name"
                  placeholderTextColor="#666"
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>

              <View style={styles.colorPicker}>
                {TAG_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      editColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setEditColor(color)}
                  />
                ))}
              </View>

              <Pressable
                style={[
                  styles.createButton,
                  (!editName.trim() || loading) && styles.createButtonDisabled,
                ]}
                onPress={handleCreateTag}
                disabled={!editName.trim() || loading}
              >
                <Text style={styles.createButtonText}>Create Tag</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item: tag }) => (
            <View style={styles.tagItem}>
              <View style={styles.tagInfo}>
                <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                <Text style={styles.tagName}>{tag.name}</Text>
              </View>
              <View style={styles.tagActions}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => startEdit(tag)}
                >
                  <Ionicons name="pencil-outline" size={20} color="#3B82F6" />
                </Pressable>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => startDelete(tag)}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tags created yet</Text>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
        />

        {editingTag && (
          <Modal
            transparent
            visible={!!editingTag}
            animationType="fade"
            onRequestClose={() => setEditingTag(null)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setEditingTag(null)}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Tag</Text>
                <View style={styles.createRow}>
                  <View
                    style={[styles.colorDot, { backgroundColor: editColor }]}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Tag name"
                    placeholderTextColor="#666"
                    value={editName}
                    onChangeText={setEditName}
                  />
                </View>

                <View style={styles.colorPicker}>
                  {TAG_COLORS.map((color) => (
                    <Pressable
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        editColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setEditColor(color)}
                    />
                  ))}
                </View>

                <View style={styles.modalButtons}>
                  <Pressable
                    style={styles.modalCancelButton}
                    onPress={() => setEditingTag(null)}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.modalSaveButton,
                      loading && styles.createButtonDisabled,
                    ]}
                    onPress={handleEditTag}
                    disabled={loading}
                  >
                    <Text style={styles.modalSaveButtonText}>Save</Text>
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
              style={styles.modalOverlay}
              onPress={() => setDeleteConfirmTag(null)}
            >
              <View style={styles.modalContent}>
                <Ionicons
                  name="warning-outline"
                  size={48}
                  color="#EF4444"
                  style={{ alignSelf: "center", marginBottom: 16 }}
                />
                <Text style={styles.modalTitle}>Delete Tag?</Text>
                <Text style={styles.deleteMessage}>
                  This tag is used by {deleteUsageCount} customer
                  {deleteUsageCount !== 1 ? "s" : ""}.{"\n\n"}Removing it will
                  remove this tag from all customers.
                </Text>
                <View style={styles.modalButtons}>
                  <Pressable
                    style={styles.modalCancelButton}
                    onPress={() => setDeleteConfirmTag(null)}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalDeleteButton}
                    onPress={handleDeleteTag}
                    disabled={loading}
                  >
                    <Text style={styles.modalDeleteButtonText}>Delete</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2D2D2D",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  createSection: {
    padding: 16,
    backgroundColor: "#2D2D2D",
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#3D3D3D",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 15,
  },
  colorPicker: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  colorOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  createButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
  },
  tagItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  tagInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tagDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tagName: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  tagActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#2D2D2D",
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#2D2D2D",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 360,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  deleteMessage: {
    color: "#A0A0A0",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#3D3D3D",
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#3B82F6",
    alignItems: "center",
  },
  modalSaveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  modalDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
  },
  modalDeleteButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});

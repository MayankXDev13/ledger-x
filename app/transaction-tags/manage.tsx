import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { TransactionTag, TAG_COLORS } from "@/types/database";

export default function ManageTransactionTagsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [tags, setTags] = useState<TransactionTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState<string>(TAG_COLORS[0]);
  const [editingTag, setEditingTag] = useState<TransactionTag | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<string>(TAG_COLORS[0]);
  const [deleteConfirmTag, setDeleteConfirmTag] =
    useState<TransactionTag | null>(null);
  const [deleteUsageCount, setDeleteUsageCount] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchTags();
    }
  }, [session]);

  const fetchTags = async () => {
    if (!session?.user) return;

    const { data } = await supabase
      .from("transaction_tags")
      .select("*")
      .eq("user_id", session.user.id)
      .order("name");

    setTags(data || []);
    setLoading(false);
  };

  const handleCreateTag = async () => {
    if (!session?.user || !newTagName.trim()) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("transaction_tags")
        .insert({
          user_id: session.user.id,
          name: newTagName.trim(),
          color: newTagColor,
        })
        .select()
        .single();

      if (error) throw error;

      setTags([...tags, data]);
      setNewTagName("");
      setNewTagColor(TAG_COLORS[0]);
    } catch (error) {
      console.error("Error creating tag:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditTag = async () => {
    if (!editingTag || !editName.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("transaction_tags")
        .update({ name: editName.trim(), color: editColor })
        .eq("id", editingTag.id);

      if (error) throw error;

      setTags(
        tags.map((t) =>
          t.id === editingTag.id
            ? { ...t, name: editName.trim(), color: editColor }
            : t,
        ),
      );
      setEditingTag(null);
    } catch (error) {
      console.error("Error updating tag:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = async () => {
    if (!deleteConfirmTag) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("transaction_tags")
        .delete()
        .eq("id", deleteConfirmTag.id);

      if (error) throw error;

      setTags(tags.filter((t) => t.id !== deleteConfirmTag.id));
      setDeleteConfirmTag(null);
    } catch (error) {
      console.error("Error deleting tag:", error);
    } finally {
      setSaving(false);
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

  const renderTagItem = ({ item }: { item: TransactionTag }) => (
    <View style={styles.tagItem}>
      <View style={styles.tagInfo}>
        <View style={[styles.tagDot, { backgroundColor: item.color }]} />
        <Text style={styles.tagName}>{item.name}</Text>
      </View>
      <View style={styles.tagActions}>
        <Pressable style={styles.actionButton} onPress={() => startEdit(item)}>
          <Ionicons name="pencil-outline" size={20} color="#3B82F6" />
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => startDelete(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Transaction Tags</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.createSection}>
        <Text style={styles.sectionTitle}>Create New Tag</Text>
        <View style={styles.createRow}>
          <View style={[styles.colorDot, { backgroundColor: newTagColor }]} />
          <TextInput
            style={styles.input}
            placeholder="Tag name"
            placeholderTextColor="#666"
            value={newTagName}
            onChangeText={setNewTagName}
          />
        </View>

        <View style={styles.colorPicker}>
          {TAG_COLORS.map((color) => (
            <Pressable
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                newTagColor === color && styles.colorOptionSelected,
              ]}
              onPress={() => setNewTagColor(color)}
            />
          ))}
        </View>

        <Pressable
          style={[
            styles.createButton,
            (!newTagName.trim() || saving) && styles.createButtonDisabled,
          ]}
          onPress={handleCreateTag}
          disabled={!newTagName.trim() || saving}
        >
          <Text style={styles.createButtonText}>Create Tag</Text>
        </Pressable>
      </View>

      <Text style={styles.listTitle}>
        Your Transaction Tags ({tags.length})
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : tags.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="pricetags-outline" size={48} color="#3D3D3D" />
          <Text style={styles.emptyText}>No transaction tags yet</Text>
          <Text style={styles.emptySubtext}>
            Create tags to categorize your transactions
          </Text>
        </View>
      ) : (
        <FlatList
          data={tags}
          keyExtractor={(item) => item.id}
          renderItem={renderTagItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

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
                    saving && styles.createButtonDisabled,
                  ]}
                  onPress={handleEditTag}
                  disabled={saving}
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
                This tag is used by {deleteUsageCount} transaction
                {deleteUsageCount !== 1 ? "s" : ""}.{"\n\n"}
                Removing it will remove this tag from all transactions.
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
                  disabled={saving}
                >
                  <Text style={styles.modalDeleteButtonText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
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
    paddingTop: 60,
    paddingBottom: 20,
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
    margin: 16,
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
  listTitle: {
    color: "#A0A0A0",
    fontSize: 14,
    fontWeight: "500",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#666",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    color: "#666",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
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
    gap: 4,
  },
  actionButton: {
    padding: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#2D2D2D",
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

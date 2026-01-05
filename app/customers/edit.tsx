import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Contact, ContactTag } from "@/types/database";
import { TagSelector } from "@/components/TagSelector";
import { TagManagementModal } from "@/components/TagManagementModal";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { getUserTags, getContactTags, replaceContactTags } from "@/lib/tags";

export default function EditCustomerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<ContactTag[]>([]);
  const [availableTags, setAvailableTags] = useState<ContactTag[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [originalPhone, setOriginalPhone] = useState("");

  useEffect(() => {
    if (id && session?.user) {
      fetchCustomer();
    }
  }, [id, session]);

  const fetchCustomer = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data: contactData, error: contactError } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .single();

      if (contactError) throw contactError;

      setName(contactData.name);
      setPhone(contactData.phone);
      setOriginalPhone(contactData.phone);

      const contactTags = await getContactTags(id);
      setSelectedTags(contactTags);

      if (session?.user) {
        const userTags = await getUserTags(session.user.id);
        setAvailableTags(userTags);
      }
    } catch (err) {
      setError("Failed to load customer");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    let valid = true;
    setNameError(null);
    setPhoneError(null);

    if (!name.trim()) {
      setNameError("Name is required");
      valid = false;
    }

    if (!phone.trim()) {
      setPhoneError("Phone number is required");
      valid = false;
    } else if (phone.replace(/\D/g, "").length < 10) {
      setPhoneError("Valid phone number required");
      valid = false;
    }

    return valid;
  };

  const onSave = async () => {
    if (!session?.user || !validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      if (phone.trim() !== originalPhone) {
        const { data: existingContact } = await supabase
          .from("contacts")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("phone", phone.trim())
          .neq("id", id)
          .single();

        if (existingContact) {
          setError("A customer with this phone number already exists");
          setSaving(false);
          return;
        }
      }

      const { error: updateError } = await supabase
        .from("contacts")
        .update({
          name: name.trim(),
          phone: phone.trim(),
        })
        .eq("id", id);

      if (updateError) {
        if (updateError.code === "23505") {
          setError("A customer with this phone number already exists");
        } else {
          setError(updateError.message);
        }
        setSaving(false);
        return;
      }

      const tagIds = selectedTags.map((t) => t.id);
      await replaceContactTags(id as string, tagIds);

      router.back();
    } catch (err) {
      setError("An unexpected error occurred");
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!id) return;

    const { error } = await supabase.rpc("soft_delete_customer", {
      p_contact_id: id,
    });

    if (error) {
      console.error("Error deleting customer:", error);
      setError("Failed to delete customer");
      return;
    }

    router.replace("/(tabs)/customers");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Customer</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#666"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setNameError(null);
              }}
            />
            {nameError && <Text style={styles.errorText}>{nameError}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 98765 43210"
              placeholderTextColor="#666"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setPhoneError(null);
              }}
              keyboardType="phone-pad"
            />
            {phoneError && <Text style={styles.errorText}>{phoneError}</Text>}
          </View>

          <TagSelector
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            availableTags={availableTags}
            onManageTags={() => setShowTagModal(true)}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttonContainer}>
            <Pressable
              style={[
                styles.button,
                styles.saveButton,
                saving && styles.buttonDisabled,
              ]}
              onPress={onSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.deleteSection}>
            <Pressable
              style={styles.deleteButton}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.deleteButtonText}>Delete Customer</Text>
            </Pressable>
            <Text style={styles.deleteWarning}>
              This will delete all transactions and remove this customer.
            </Text>
          </View>
        </View>
      </ScrollView>

      <TagManagementModal
        visible={showTagModal}
        onClose={() => {
          setShowTagModal(false);
          if (session?.user) {
            getUserTags(session.user.id).then(setAvailableTags);
          }
        }}
        tags={availableTags}
        onTagsChange={setAvailableTags}
        userId={session?.user?.id || ""}
      />

      <DeleteConfirmationDialog
        visible={showDeleteConfirm}
        title="Delete Customer?"
        message="This will permanently delete this customer and all their transactions. This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteCustomer}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  form: {
    paddingHorizontal: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#A0A0A0",
  },
  input: {
    borderWidth: 1,
    borderColor: "#3D3D3D",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#ffffff",
    backgroundColor: "#2D2D2D",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#3B82F6",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#2D2D2D",
    alignItems: "center",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "500",
  },
  deleteWarning: {
    color: "#666666",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
});

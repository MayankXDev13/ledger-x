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
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { ContactTag } from "@/types/database";
import { TagSelector } from "@/components/TagSelector";
import { TagManagementModal } from "@/components/TagManagementModal";

export default function AddCustomerScreen() {
  const { session } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<ContactTag[]>([]);
  const [availableTags, setAvailableTags] = useState<ContactTag[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchTags();
    }
  }, [session]);

  const fetchTags = async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from("contact_tags")
      .select("*")
      .eq("user_id", session.user.id)
      .order("name");
    setAvailableTags(data || []);
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
    } else {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 12) {
        setPhoneError("Enter a valid phone number (10-12 digits)");
        valid = false;
      }
    }

    return valid;
  };

  const onSubmit = async () => {
    if (!session?.user || !validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const { data: existingContact } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("phone", phone.trim())
        .single();

      let contactData;

      if (existingContact && !existingContact.deleted_at) {
        setError("A customer with this phone number already exists");
        setLoading(false);
        return;
      }

      if (existingContact && existingContact.deleted_at) {
        const { data: restoredContact, error: restoreError } = await supabase
          .from("contacts")
          .update({ name: name.trim(), deleted_at: null })
          .eq("id", existingContact.id)
          .select()
          .single();

        if (restoreError) throw restoreError;
        contactData = restoredContact;
      } else {
        const { data: newContact, error: insertError } = await supabase
          .from("contacts")
          .insert({
            user_id: session.user.id,
            name: name.trim(),
            phone: phone.trim(),
          })
          .select()
          .single();

        if (insertError) {
          if (insertError.code === "23505") {
            setError("A customer with this phone number already exists");
          } else {
            setError(insertError.message);
          }
          setLoading(false);
          return;
        }
        contactData = newContact;
      }

      if (selectedTags.length > 0) {
        const tagMappings = selectedTags.map((tag) => ({
          contact_id: contactData.id,
          tag_id: tag.id,
        }));
        await supabase.from("contact_tag_map").insert(tagMappings);
      }

      router.back();
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Add Customer</Text>
        <Text style={styles.subtitle}>Enter customer details</Text>

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
              style={[styles.button, styles.cancelButton]}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                styles.saveButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={onSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Save Customer</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      <TagManagementModal
        visible={showTagModal}
        onClose={() => {
          setShowTagModal(false);
          fetchTags();
        }}
        tags={availableTags}
        onTagsChange={setAvailableTags}
        userId={session?.user?.id || ""}
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#888888",
    marginBottom: 32,
  },
  form: {
    flex: 1,
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
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#3B82F6",
  },
  cancelButton: {
    backgroundColor: "#2D2D2D",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

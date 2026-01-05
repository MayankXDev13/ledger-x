import { StatusBar } from "expo-status-bar";
import {
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
      className="flex-1 bg-[#1a1a1a]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 px-6 pt-[60px]">
        <Text className="text-3xl font-bold text-white mb-2">Add Customer</Text>
        <Text className="text-lg text-[#888888] mb-8">
          Enter customer details
        </Text>

        <View className="flex-1 gap-5">
          <View className="gap-2">
            <Text className="text-sm font-medium text-[#A0A0A0]">
              Customer Name
            </Text>
            <TextInput
              className="border border-[#3D3D3D] rounded-lg px-4 py-3.5 text-base text-white bg-[#2D2D2D]"
              placeholder="Full Name"
              placeholderTextColor="#666"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setNameError(null);
              }}
            />
            {nameError && (
              <Text className="text-red-500 text-sm">{nameError}</Text>
            )}
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-[#A0A0A0]">
              Phone Number
            </Text>
            <TextInput
              className="border border-[#3D3D3D] rounded-lg px-4 py-3.5 text-base text-white bg-[#2D2D2D]"
              placeholder="+91 99999 99999"
              placeholderTextColor="#666"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setPhoneError(null);
              }}
              keyboardType="phone-pad"
            />
            {phoneError && (
              <Text className="text-red-500 text-sm">{phoneError}</Text>
            )}
          </View>

          <TagSelector
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            availableTags={availableTags}
            onManageTags={() => setShowTagModal(true)}
          />

          {error && <Text className="text-red-500 text-sm">{error}</Text>}

          <View className="flex-row gap-4 mt-4">
            <Pressable
              className="flex-1 py-4 rounded-lg items-center bg-[#2D2D2D]"
              onPress={() => router.back()}
            >
              <Text className="text-white text-base font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              className={`flex-1 py-4 rounded-lg items-center ${loading ? "opacity-60" : "bg-blue-500"}`}
              onPress={onSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  Save Customer
                </Text>
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

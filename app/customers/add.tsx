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
import { useState } from "react";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function AddCustomerScreen() {
  const { session } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

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

  const onSubmit = async () => {
    if (!session?.user || !validateForm()) return;

    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from("contacts").insert({
      user_id: session.user.id,
      name: name.trim(),
      phone: phone.trim(),
    });

    if (insertError) {
      if (insertError.code === "23505") {
        setError("A customer with this phone number already exists");
      } else {
        setError(insertError.message);
      }
      setLoading(false);
      return;
    }

    router.back();
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
              placeholderTextColor="#999999"
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
              placeholderTextColor="#999999"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setPhoneError(null);
              }}
              keyboardType="phone-pad"
            />
            {phoneError && <Text style={styles.errorText}>{phoneError}</Text>}
          </View>

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
      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#666666",
    marginBottom: 32,
  },
  form: {
    flex: 1,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#000000",
  },
  errorText: {
    color: "#FF0000",
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
    backgroundColor: "#000000",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonText: {
    color: "#333333",
    fontSize: 16,
    fontWeight: "600",
  },
});

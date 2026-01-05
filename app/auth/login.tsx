import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validateForm = () => {
    let valid = true;
    setEmailError(null);
    setPasswordError(null);

    if (!email) {
      setEmailError("Email is required");
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("Invalid email address");
      valid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    }

    return valid;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.replace("/home");
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="email@address.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setEmailError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {emailError && <Text style={styles.errorText}>{emailError}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setPasswordError(null);
              }}
              secureTextEntry
            />
            {passwordError && (
              <Text style={styles.errorText}>{passwordError}</Text>
            )}
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don’t have an account?</Text>
          <Pressable onPress={() => router.push("/auth/signup")}>
            <Text style={styles.linkText}>Sign Up</Text>
          </Pressable>
        </View>
      </View>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    padding: 20,
  },

  card: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 15,
    color: "#aaa",
    marginBottom: 24,
  },

  form: {
    gap: 18,
  },

  inputGroup: {
    gap: 6,
  },

  label: {
    fontSize: 13,
    color: "#ccc",
    fontWeight: "500",
  },

  input: {
    backgroundColor: "#333",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#fff",
  },

  errorText: {
    color: "#ff6b6b",
    fontSize: 13,
  },

  button: {
    backgroundColor: "#fff",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    gap: 6,
  },

  footerText: {
    color: "#888",
    fontSize: 15,
  },

  linkText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});

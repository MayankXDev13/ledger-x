import { useState, useEffect } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { session, loading: authLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.replace("/auth/login");
  };

  useEffect(() => {
    if (!authLoading && !session && !isLoggingOut) {
      router.replace("/auth/login");
    }
  }, [authLoading, session, isLoggingOut]);

  if (authLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={48} color="#ffffff" />
        </View>
        <Text style={styles.email}>{session.user.email}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.changePasswordButton,
            pressed && styles.pressed,
            isLoggingOut && styles.buttonDisabled,
          ]}
          onPress={() => router.push("/auth/update-password")}
          disabled={isLoggingOut}
        >
          <Ionicons name="lock-closed-outline" size={20} color="#000000" />
          <Text style={styles.changePasswordButtonText}>Change Password</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.logoutButton,
            (pressed || isLoggingOut) && styles.pressed,
          ]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#ff6b6b" />
          <Text style={styles.logoutButtonText}>
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#888888",
    fontSize: 16,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 40,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  email: {
    fontSize: 18,
    fontWeight: "500",
    color: "#ffffff",
  },
  buttonContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  changePasswordButton: {
    backgroundColor: "#ffffff",
  },
  changePasswordButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  logoutButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ff6b6b",
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ff6b6b",
  },
});

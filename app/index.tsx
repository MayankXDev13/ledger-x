import { Link } from "expo-router";
import { StyleSheet, Text, View, Pressable } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.brandContainer}>
        <Text style={styles.title}>LedgerX</Text>
        <Text style={styles.subtitle}>Simple • Fast • Reliable Ledger</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Link href="/auth/login" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryText}>Login</Text>
          </Pressable>
        </Link>

        <Link href="/auth/signup" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryText}>Create Account</Text>
          </Pressable>
        </Link>
      </View>

      <Text style={styles.footerText}>Made for small businesses</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    backgroundColor: "#1a1a1a",
  },

  brandContainer: {
    marginTop: 120,
    alignItems: "center",
  },

  title: {
    fontSize: 52,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },

  subtitle: {
    fontSize: 16,
    color: "#888",
    marginTop: 8,
  },

  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },

  footerText: {
    textAlign: "center",
    color: "#666",
    fontSize: 13,
    marginBottom: 16,
  },

  buttonContainer: {
    alignItems: "center",
    marginBottom: 40,
  },

  primaryButton: {
    width: 320,
    backgroundColor: "#fff",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 14,
  },

  primaryText: {
    color: "#000",
    fontSize: 19,
    fontWeight: "700",
  },

  secondaryButton: {
    width: 320,
    backgroundColor: "transparent",
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
  },

  secondaryText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

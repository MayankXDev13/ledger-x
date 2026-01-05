import { StyleSheet, Text, View } from "react-native";

export default function TabIndex() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Welcome to LedgerX</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginTop: 60,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginTop: 8,
  },
});

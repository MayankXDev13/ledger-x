import { Link } from 'expo-router';
import { StyleSheet, Text, View, Pressable } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LedgerX</Text>
      <Text style={styles.subtitle}>Simple Ledger Tracking</Text>
      <View style={styles.buttonContainer}>
        <Link href="/auth/login" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Login</Text>
          </Pressable>
        </Link>
        <Link href="/auth/signup" asChild>
          <Pressable style={[styles.button, styles.outlineButton]}>
            <Text style={[styles.buttonText, styles.outlineButtonText]}>Sign Up</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 48,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#000000',
  },
  outlineButtonText: {
    color: '#000000',
  },
});

import { useCallback, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useFocusEffect, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Contact } from "@/types/database";

export default function CustomersScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchContacts = async () => {
    if (!session?.user) return;

    setLoading(true);
    try {
      const { data: contactsData, error } = await supabase
        .from("contacts")
        .select("*")
        .is("deleted_at", null)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setContacts(contactsData || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchContacts();
    }, [session]),
  );

  if (!session) {
    return null;
  }

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery);

    return matchesSearch;
  });

  const renderContact = ({ item }: { item: Contact }) => (
    <Link href={`/customers/details?id=${item.id}`} asChild>
      <Pressable className="flex-row items-center justify-between py-4 border-b border-brand-border">
        <View className="flex-1">
          <Text className="text-white font-medium text-lg">{item.name}</Text>
          <Text className="text-[#888888] text-sm mt-1">{item.phone}</Text>
        </View>
        <Text className="text-[#666666] text-xl ml-3">›</Text>
      </Pressable>
    </Link>
  );

  return (
    <View className="flex-1 bg-brand-dark">
      <View className="px-6 pb-4" style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-3xl font-bold text-white">Customers</Text>
        <Text className="text-base text-[#888888] mt-1">
          {filteredContacts.length} contacts
        </Text>
      </View>

      <View className="px-6 mb-4">
        <TextInput
          className="border border-brand-border rounded-lg px-4 py-3 text-base text-white bg-brand-card mb-3"
          placeholder="Search customers..."
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : filteredContacts.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-[#888888] text-lg">
            {searchQuery ? "No customers found" : "No customers yet"}
          </Text>
          {!searchQuery && (
            <Text className="text-[#666666] text-sm mt-2">
              Tap + to add your first customer
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Link href="/customers/add" asChild>
        <Pressable
          style={{
            position: "absolute",
            bottom: insets.bottom + 16,
            right: 16,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="add" size={28} color="#000000" />
        </Pressable>
      </Link>
    </View>
  );
}

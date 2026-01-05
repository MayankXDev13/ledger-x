import { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import { useFocusEffect, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Contact, ContactTag } from "@/types/database";
import { getUserTags } from "@/lib/tags";

interface ContactWithTags extends Contact {
  tags: ContactTag[];
}

export default function CustomersScreen() {
  const { session } = useAuth();

  const [contacts, setContacts] = useState<ContactWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableTags, setAvailableTags] = useState<ContactTag[]>([]);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(
    null,
  );

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

      const contactIds = (contactsData || []).map((c) => c.id);

      let contactsWithTags: ContactWithTags[] = contactsData || [];

      if (contactIds.length > 0) {
        const { data: allTagMappings } = await supabase
          .from("contact_tag_map")
          .select(
            "contact_id, contact_tags(id, user_id, name, color, created_at)",
          )
          .in("contact_id", contactIds);

        const tagsByContact = new Map<string, ContactTag[]>();
        allTagMappings?.forEach((item) => {
          if (item.contact_tags && item.contact_id) {
            const existing = tagsByContact.get(item.contact_id) || [];
            tagsByContact.set(item.contact_id, [
              ...existing,
              item.contact_tags as unknown as ContactTag,
            ]);
          }
        });

        contactsWithTags = (contactsData || []).map((contact) => ({
          ...contact,
          tags: tagsByContact.get(contact.id) || [],
        }));
      }

      setContacts(contactsWithTags);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    if (!session?.user) return;
    const tags = await getUserTags(session.user.id);
    setAvailableTags(tags);
  };

  useEffect(() => {
    if (session?.user) {
      fetchTags();
    }
  }, [session]);

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

    const matchesTag =
      !selectedTagFilter ||
      contact.tags.some((tag) => tag.id === selectedTagFilter);

    return matchesSearch && matchesTag;
  });

  const renderContact = ({ item }: { item: ContactWithTags }) => (
    <Link href={`/customers/details?id=${item.id}`} asChild>
      <Pressable className="flex-row items-center justify-between py-4 border-b border-[#333333]">
        <View className="flex-1">
          <Text className="text-white font-medium text-lg">{item.name}</Text>
          <Text className="text-[#888888] text-sm mt-1">{item.phone}</Text>
          {item.tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-2 -ml-1"
              contentContainerStyle={{
                flexDirection: "row",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              {item.tags.slice(0, 3).map((tag) => (
                <View
                  key={tag.id}
                  className="flex-row items-center py-0.5 px-2 rounded-full"
                  style={{ backgroundColor: tag.color + "30" }}
                >
                  <View
                    className="w-1.5 h-1.5 rounded-full mr-1"
                    style={{ backgroundColor: tag.color }}
                  />
                  <Text className="text-[#A0A0A0] text-xs">{tag.name}</Text>
                </View>
              ))}
              {item.tags.length > 3 && (
                <Text className="text-[#666666] text-xs ml-0.5">
                  +{item.tags.length - 3}
                </Text>
              )}
            </ScrollView>
          )}
        </View>
        <Text className="text-[#666666] text-xl ml-3">›</Text>
      </Pressable>
    </Link>
  );

  return (
    <View className="flex-1 bg-[#1a1a1a]">
      <View className="px-6 pt-[60px] pb-4">
        <Text className="text-3xl font-bold text-white">Customers</Text>
        <Text className="text-base text-[#888888] mt-1">
          {filteredContacts.length} contacts
        </Text>
      </View>

      <View className="px-6 mb-4">
        <TextInput
          className="border border-[#333333] rounded-lg px-4 py-3 text-base text-white bg-[#2a2a2a] mb-3"
          placeholder="Search customers..."
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {availableTags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mx-[-24] px-6"
            contentContainerStyle={{ gap: 2 }}
          >
            <Pressable
              className={`flex-row items-center gap-1.5 py-1.5 px-3 bg-[#2a2a2a] rounded-full border ${!selectedTagFilter ? "border-blue-500 bg-blue-500" : "border-[#333333]"}`}
              onPress={() => setSelectedTagFilter(null)}
            >
              <Text
                className={`text-xs font-medium ${!selectedTagFilter ? "text-white" : "text-[#888888]"}`}
              >
                All
              </Text>
            </Pressable>

            {availableTags.map((tag) => (
              <Pressable
                key={tag.id}
                className={`flex-row items-center gap-1.5 py-1.5 px-3 bg-[#2a2a2a] rounded-full border ${selectedTagFilter === tag.id ? "border-blue-500 bg-blue-500" : "border-[#333333]"}`}
                onPress={() =>
                  setSelectedTagFilter(
                    selectedTagFilter === tag.id ? null : tag.id,
                  )
                }
              >
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <Text
                  className={`text-xs font-medium ${selectedTagFilter === tag.id ? "text-white" : "text-[#888888]"}`}
                >
                  {tag.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : filteredContacts.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-[#888888] text-lg">
            {searchQuery || selectedTagFilter
              ? "No customers found"
              : "No customers yet"}
          </Text>
          {!searchQuery && !selectedTagFilter && (
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
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Link href="/customers/add" asChild>
        <Pressable className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-white items-center justify-center">
          <Ionicons name="add" size={28} color="#000000" />
        </Pressable>
      </Link>
    </View>
  );
}

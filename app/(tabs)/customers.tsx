import { useCallback, useState, useEffect } from "react";
import {
  StyleSheet,
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
      <Pressable style={styles.contactCard}>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactPhone}>{item.phone}</Text>
          {item.tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagsContainer}
              contentContainerStyle={styles.tagsContent}
            >
              {item.tags.slice(0, 3).map((tag) => (
                <View
                  key={tag.id}
                  style={[
                    styles.tagChip,
                    { backgroundColor: tag.color + "30" },
                  ]}
                >
                  <View
                    style={[styles.tagDot, { backgroundColor: tag.color }]}
                  />
                  <Text style={styles.tagText}>{tag.name}</Text>
                </View>
              ))}
              {item.tags.length > 3 && (
                <Text style={styles.moreTags}>+{item.tags.length - 3}</Text>
              )}
            </ScrollView>
          )}
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
    </Link>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customers</Text>
        <Text style={styles.subtitle}>{filteredContacts.length} contacts</Text>
      </View>

      <View style={styles.filterContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {availableTags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagFilterContainer}
            contentContainerStyle={styles.tagFilterContent}
          >
            <Pressable
              style={[
                styles.tagFilterChip,
                !selectedTagFilter && styles.tagFilterChipSelected,
              ]}
              onPress={() => setSelectedTagFilter(null)}
            >
              <Text
                style={[
                  styles.tagFilterText,
                  !selectedTagFilter && styles.tagFilterTextSelected,
                ]}
              >
                All
              </Text>
            </Pressable>

            {availableTags.map((tag) => (
              <Pressable
                key={tag.id}
                style={[
                  styles.tagFilterChip,
                  selectedTagFilter === tag.id && styles.tagFilterChipSelected,
                ]}
                onPress={() =>
                  setSelectedTagFilter(
                    selectedTagFilter === tag.id ? null : tag.id,
                  )
                }
              >
                <View
                  style={[styles.tagFilterDot, { backgroundColor: tag.color }]}
                />
                <Text
                  style={[
                    styles.tagFilterText,
                    selectedTagFilter === tag.id &&
                      styles.tagFilterTextSelected,
                  ]}
                >
                  {tag.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : filteredContacts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {searchQuery || selectedTagFilter
              ? "No customers found"
              : "No customers yet"}
          </Text>
          {!searchQuery && !selectedTagFilter && (
            <Text style={styles.emptySubtext}>
              Tap + to add your first customer
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Link href="/customers/add" asChild>
        <Pressable style={styles.fab}>
          <Ionicons name="add" size={28} color="#000000" />
        </Pressable>
      </Link>
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
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 16,
    color: "#888888",
    marginTop: 4,
  },
  filterContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#ffffff",
    backgroundColor: "#2a2a2a",
    marginBottom: 12,
  },
  tagFilterContainer: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  tagFilterContent: {
    gap: 8,
  },
  tagFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333333",
  },
  tagFilterChipSelected: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  tagFilterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagFilterText: {
    color: "#888888",
    fontSize: 13,
    fontWeight: "500",
  },
  tagFilterTextSelected: {
    color: "#ffffff",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#888888",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "500",
    color: "#ffffff",
  },
  contactPhone: {
    fontSize: 14,
    color: "#888888",
    marginTop: 4,
  },
  tagsContainer: {
    marginTop: 8,
    marginHorizontal: -4,
  },
  tagsContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagText: {
    color: "#A0A0A0",
    fontSize: 11,
  },
  moreTags: {
    color: "#666666",
    fontSize: 11,
    marginLeft: 2,
  },
  arrow: {
    fontSize: 22,
    color: "#666666",
    marginLeft: 12,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
});

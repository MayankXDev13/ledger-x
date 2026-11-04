import { supabase } from "./supabase";
import { ContactTag } from "@/types/database";

export const getUserTags = async (userId: string): Promise<ContactTag[]> => {
  const { data, error } = await supabase
    .from("contact_tags")
    .select("*")
    .eq("user_id", userId)
    .order("name");

  if (error) throw error;
  return data || [];
};

export const createTag = async (
  userId: string,
  name: string,
  color: string,
): Promise<ContactTag> => {
  const { data, error } = await supabase
    .from("contact_tags")
    .insert({ user_id: userId, name, color })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTag = async (
  tagId: string,
  name: string,
  color: string,
): Promise<void> => {
  const { error } = await supabase
    .from("contact_tags")
    .update({ name, color })
    .eq("id", tagId);

  if (error) throw error;
};

export const deleteTag = async (tagId: string): Promise<void> => {
  const { error } = await supabase
    .from("contact_tags")
    .delete()
    .eq("id", tagId);

  if (error) throw error;
};

export const getContactTags = async (
  contactId: string,
): Promise<ContactTag[]> => {
  const { data, error } = await supabase.rpc("get_contact_tags", {
    p_contact_id: contactId,
  });

  if (error) throw error;
  return data || [];
};

export const addTagToContact = async (
  contactId: string,
  tagId: string,
): Promise<void> => {
  const { error: checkError } = await supabase
    .from("contact_tag_map")
    .select("id")
    .eq("contact_id", contactId)
    .eq("tag_id", tagId)
    .single();

  if (checkError?.code === "PGRST116") {
    const { error: insertError } = await supabase
      .from("contact_tag_map")
      .insert({ contact_id: contactId, tag_id: tagId });

    if (insertError) throw insertError;
  } else if (checkError) {
    throw checkError;
  }
};

export const removeTagFromContact = async (
  contactId: string,
  tagId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("contact_tag_map")
    .delete()
    .eq("contact_id", contactId)
    .eq("tag_id", tagId);

  if (error) throw error;
};

export const replaceContactTags = async (
  contactId: string,
  tagIds: string[],
): Promise<void> => {
  const { error: deleteError } = await supabase
    .from("contact_tag_map")
    .delete()
    .eq("contact_id", contactId);

  if (deleteError) throw deleteError;

  if (tagIds.length > 0) {
    const inserts = tagIds.map((tagId) => ({
      contact_id: contactId,
      tag_id: tagId,
    }));

    const { error: insertError } = await supabase
      .from("contact_tag_map")
      .insert(inserts);

    if (insertError) throw insertError;
  }
};

export const getTagUsageCount = async (tagId: string): Promise<number> => {
  const { data, error } = await supabase.rpc("get_tag_usage_count", {
    p_tag_id: tagId,
  });

  if (error) throw error;
  return data || 0;
};

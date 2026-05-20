"use server";

import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const createFolderSchema = z.object({
  name: z.string().min(1).max(50),
});

export async function getAllFolders() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("folders")
    .select(`
    *,
    sheets (
      *,
      owner:profiles!sheets_owner_id_fkey (
        id,
        name,
        email,
        avatar_url
      ),
      rows ( id ),
      columns ( id )
    )
  `)
    .eq("owner_id", user.id)
    .is("organization_id", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data;
}

export async function createFolder(name: string, OrganizationId?: string) {
  const supabase = await createSupabaseServerClient();
  const parsed = createFolderSchema.safeParse({ name });
  if (!parsed.success) throw new Error("Invalid folder name");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("folders")
    .insert([
      {
        name: parsed.data.name,
        owner_id: user.id,
        is_personal: OrganizationId ? false : true,
        organization_id: OrganizationId || null,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteFolder(folderId: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Verify ownership
  const { data: folder, error: fetchError } = await supabase
    .from("folders")
    .select("id, owner_id")
    .eq("id", folderId)
    .single();

  if (fetchError || !folder) throw new Error("Folder not found");
  if (folder.owner_id !== user.id) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", folderId);

  if (error) throw new Error(error.message);
  return { success: true };
}

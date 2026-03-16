"use server";

import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const createFolderSchema = z.object({
  name: z.string().min(1).max(50),
});

export async function getAllFolders() {
  const cookieStore = await cookies();
  console.log("COOKIES:", cookieStore.getAll());
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("folders")
    .select(`*, sheets(*)`)
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

  console.log("SERVER USER:", user);

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

"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createOrganizationMember(
  organizationId: string,
  userId: string,
  role: "owner" | "admin" | "editor" | "viewer" = "viewer"
) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("organization_members")
    .insert({
      organization_id: organizationId,
      user_id: userId,
      role,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}
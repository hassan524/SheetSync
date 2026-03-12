"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOrganizationMember } from "./members";

const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function getAllOrganizations() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("organization_members")
    .select(`
    role,
    organizations (
      id,
      name,
      created_at,
      sheets (
        id,
        title,
        updated_at,
        is_starred
      ),
      organization_members!inner (
        id,
        profiles (
          id,
          email,
          name,
          avatar_url
        )
      )
    )
  `)
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  if (error) throw new Error(error.message);

  const organizations = data.map((item: any) => {
    const org = item.organizations;
    return {
      id: org?.id,
      name: org?.name ?? "Unknown",
      role: item.role,
      created_at: org?.created_at,
      sheets: org?.sheets ?? [],
      sheetsCount: org?.sheets?.length ?? 0,
      members: org?.organization_members ?? [],
      membersCount: org?.organization_members?.length ?? 0,
    };
  });

  return organizations;
}

export async function getOrganizationById(id: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .eq("created_by", user.id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createOrganization(name: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: org, error } = await supabase
    .from("organizations")
    .insert({
      name,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await createOrganizationMember(org.id, user.id, "owner");

  return org;
}

export async function deleteOrganization(id: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
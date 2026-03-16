"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOrganizationMember } from "./members";
import { getInitials,  } from "@/lib/utils";
import type { Organization, Sheet, Member } from "@/types";

/**
 * Schema used to validate organization creation input.
 */
const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
});


/**
 * Get all organizations the current user belongs to.
 *
 * Returns:
 * - organization basic info
 * - number of sheets
 * - number of members
 * - role of the current user inside the organization
 */
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


/**
 * Get a single organization with full details.
 *
 * Returns:
 * - organization info
 * - sheets list (formatted for UI)
 * - members list (formatted for UI)
 * - current user's role
 */
// lib/querys/organization/organization.ts

export async function getOrganizationById(id: string): Promise<Organization | null> {
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
          folder_id,
          owner_id,
          organization_id,
          template_id,
          is_starred,
          is_personal,
          last_modified_by,
          created_at,
          updated_at,
          size_mb,
          owner:profiles!sheets_owner_id_fkey (
            id,
            name
          ),
          lastEditor:profiles!sheets_last_modified_by_fkey (
            id,
            name
          )
        ),
        organization_members (
          id,
          role,
          joined_at,
          profiles (
            id,
            name,
            email,
            avatar_url
          )
        )
      )
    `)
    .eq("organization_id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Query error:", error);
    throw new Error(error.message);
  }

  // ✅ organizations is an OBJECT not an array when using .single()
  const org = data.organizations as any;
  if (!org) return null;

  /* ---------------- SHEETS ---------------- */
  const sheets: Sheet[] =
    org.sheets?.map((sheet: any) => ({
      id: sheet.id,
      title: sheet.title,
      folder_id: sheet.folder_id ?? null,
      owner_id: sheet.owner_id,
      organization_id: sheet.organization_id,
      template_id: sheet.template_id ?? "",
      is_starred: sheet.is_starred,
      is_personal: sheet.is_personal ?? true,
      created_at: sheet.created_at,
      updated_at: sheet.updated_at,
      owner: {
        name: sheet.owner?.name || "Unknown",
        initials: getInitials(sheet.owner?.name || "U"),
      },
      visibility: sheet.organization_id ? "team" : "private",
      last_modified_by: sheet.lastEditor?.name || sheet.owner?.name || "Unknown",
      collaborators: Math.floor(Math.random() * 8) + 1,
      activeEditors: Math.floor(Math.random() * 3),
      size: sheet.size_mb?.toString() || "0",
    })) ?? [];

  /* ---------------- MEMBERS ---------------- */
  const members: Member[] =
    org.organization_members?.map((member: any) => ({
      id: member.profiles.id,
      profiles: {
        id: member.profiles.id,
        name: member.profiles.name,
        email: member.profiles.email,
        avatar_url: member.profiles.avatar_url,
      },
      role: member.role,
      status: Math.random() > 0.3 ? "online" : "offline",
      lastActive:
        Math.random() > 0.5
          ? "Just now"
          : `${Math.floor(Math.random() * 60)} min ago`,
      avatar: getInitials(member.profiles.name),
    })) ?? [];

  /* ---------------- STORAGE ---------------- */
  const storageUsed = sheets.reduce(
    (sum, s) => sum + parseFloat(s.size || "0"),
    0
  );
  const storageLimit = 10;

  /* ---------------- WEEKLY STATS ---------------- */
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  const sheetsCreated = sheets.filter(
    (s) => new Date(s.created_at) >= weekAgo
  ).length;
  const editsThisWeek = sheets.filter(
    (s) => new Date(s.updated_at) >= weekAgo
  ).length;
  const collaborations = sheets
    .filter((s) => new Date(s.updated_at) >= weekAgo)
    .reduce((sum, s) => sum + (s.collaborators || 0), 0);

  return {
    id: org.id,
    name: org.name,
    role: data.role,
    created_at: org.created_at,
    sheets,
    members,
    storageUsed,
    storageLimit,
    weeklyStats: { sheetsCreated, editsThisWeek, collaborations },
  };
}

/**
 * Create a new organization.
 *
 * Steps:
 * 1. Insert organization
 * 2. Add creator as "owner" in organization_members
 */
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


/**
 * Delete an organization.
 *
 * Only the creator (owner) can delete it.
 */
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
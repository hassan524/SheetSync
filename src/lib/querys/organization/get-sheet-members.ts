"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  status?: "online" | "away" | "offline";
  last_active_at?: string | null;
}

export interface SheetOrgData {
  orgId: string;
  orgName: string;
  members: OrgMember[];
}

/**
 * Given a sheet ID, fetch the organization it belongs to
 * and return all org members with their profiles.
 *
 * Returns `null` if the sheet is personal (no organization_id).
 */
export async function getSheetOrgMembers(
  sheetId: string
): Promise<SheetOrgData | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Get the sheet's organization_id
  const { data: sheet, error: sheetError } = await supabase
    .from("sheets")
    .select("organization_id")
    .eq("id", sheetId)
    .single();

  if (sheetError) throw new Error(sheetError.message);
  if (!sheet?.organization_id) return null; // Personal sheet

  const orgId = sheet.organization_id;

  // 2. Get org name
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  if (orgError) throw new Error(orgError.message);

  // 3. Get all members with profiles
  const { data: members, error: membersError } = await supabase
    .from("organization_members")
    .select(`
      role,
      status,
      last_active_at,
      profiles (
        id,
        name,
        email,
        avatar_url
      )
    `)
    .eq("organization_id", orgId);

  if (membersError) throw new Error(membersError.message);

  const mapped: OrgMember[] = (members ?? []).map((m: any) => ({
    id: m.profiles.id,
    name: m.profiles.name ?? "Unknown",
    email: m.profiles.email ?? "",
    avatar_url: m.profiles.avatar_url ?? null,
    role: m.role ?? "viewer",
    status: m.status ?? "offline",
    last_active_at: m.last_active_at ?? null,
  }));

  return {
    orgId,
    orgName: org.name,
    members: mapped,
  };
}

/**
 * Given a sheet ID with NO organization, fetch everyone with direct
 * access via sheet_members (plus the owner) and return them in the
 * same shape as getSheetOrgMembers, so the UI can render avatars
 * identically for org and non-org sheets.
 */
export async function getSheetDirectMembers(
  sheetId: string
): Promise<SheetOrgData | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: sheet, error: sheetError } = await supabase
    .from("sheets")
    .select("id, title, owner_id, organization_id")
    .eq("id", sheetId)
    .single();

  if (sheetError) throw new Error(sheetError.message);
  if (!sheet || sheet.organization_id) return null;

  const { data: members, error: membersError } = await supabase
    .from("sheet_members")
    .select(`
      role,
      user_id,
      profiles (
        id,
        name,
        email,
        avatar_url
      )
    `)
    .eq("sheet_id", sheetId);

  if (membersError) throw new Error(membersError.message);

  const mapped: OrgMember[] = (members ?? [])
    .filter((m: any) => m.profiles)
    .map((m: any) => ({
      id: m.profiles.id,
      name: m.profiles.name ?? "Unknown",
      email: m.profiles.email ?? "",
      avatar_url: m.profiles.avatar_url ?? null,
      role: m.role ?? "viewer",
      status: "online",
      last_active_at: null,
    }));

  if (sheet.owner_id && !mapped.some((member) => member.id === sheet.owner_id)) {
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("id, name, email, avatar_url")
      .eq("id", sheet.owner_id)
      .maybeSingle();
    if (ownerProfile) {
      mapped.unshift({
        id: ownerProfile.id,
        name: ownerProfile.name ?? "Unknown",
        email: ownerProfile.email ?? "",
        avatar_url: ownerProfile.avatar_url ?? null,
        role: "owner",
        status: "online",
        last_active_at: null,
      });
    }
  }

  return {
    orgId: "",
    orgName: sheet.title ?? "Sheet",
    members: mapped,
  };
}
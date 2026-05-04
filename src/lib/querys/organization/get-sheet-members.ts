"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
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
  }));

  return {
    orgId,
    orgName: org.name,
    members: mapped,
  };
}

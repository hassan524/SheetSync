"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getInitials, timeAgo } from "@/lib/utils";

/**
 * Infer presence status from the last_active_at timestamp.
 *   ≤ 5 min  → online
 *   ≤ 30 min → away
 *   else     → offline
 */
function inferStatus(
  lastActiveAt: string | null,
): "online" | "away" | "offline" {
  if (!lastActiveAt) return "offline";
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  if (diff <= 5 * 60 * 1000) return "online";
  if (diff <= 30 * 60 * 1000) return "away";
  return "offline";
}

export interface PersonData {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatar?: string;
  role: "Owner" | "Admin" | "Editor" | "Viewer";
  status: "online" | "away" | "offline";
  lastActive: string;
  sheetsAccess: number;
  organizations: string[];
}

export interface PendingInvite {
  id: string;
  email: string;
  created_at: string;
}

/**
 * Get all people (collaborators) across every organization the
 * current user belongs to.  Returns de-duplicated people, the
 * list of organization names (for filter dropdowns), and any
 * pending invites the current user has sent.
 */
export async function getAllPeople(): Promise<{
  people: PersonData[];
  organizations: { id: string; name: string }[];
  pendingInvites: PendingInvite[];
}> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  /* ── Fetch orgs I belong to, with their members ── */
  const { data: myOrgs, error: orgsError } = await supabase
    .from("organization_members")
    .select(
      `
      role,
      organizations (
        id,
        name,
        sheets ( id ),
        organization_members (
          role,
          status,
          last_active_at,
          profiles (
            id,
            email,
            name,
            avatar_url
          )
        )
      )
    `,
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  if (orgsError) throw new Error(orgsError.message);
  if (!myOrgs || myOrgs.length === 0) {
    return { people: [], organizations: [], pendingInvites: [] };
  }

  /* ── Mark current user as active across all their memberships ── */
  const orgIds = myOrgs
    .map((m: any) => (m.organizations as any)?.id)
    .filter(Boolean);

  if (orgIds.length > 0) {
    await supabase
      .from("organization_members")
      .update({
        status: "online",
        last_active_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .in("organization_id", orgIds);
  }

  /* ── Aggregate people across organizations ── */
  const peopleMap = new Map<string, PersonData>();
  const orgList: { id: string; name: string }[] = [];

  const roleMap: Record<string, "Admin" | "Editor" | "Viewer"> = {
    owner: "Admin",
    admin: "Admin",
    editor: "Editor",
    viewer: "Viewer",
  };

  for (const membership of myOrgs) {
    const org = membership.organizations as any;
    if (!org) continue;

    orgList.push({ id: org.id, name: org.name });
    const sheetCount = org.sheets?.length ?? 0;

    for (const member of org.organization_members ?? []) {
      const profile = member.profiles as any;
      if (!profile?.id) continue;

      const existing = peopleMap.get(profile.id);

      if (existing) {
        if (!existing.organizations.includes(org.name)) {
          existing.organizations.push(org.name);
        }
        existing.sheetsAccess += sheetCount;
      } else {
        peopleMap.set(profile.id, {
          id: profile.id,
          name: profile.name ?? "Unknown",
          email: profile.email ?? "",
          initials: getInitials(profile.name ?? "U"),
          avatar: profile.avatar_url,
          organizations: [org.name],
          status:
            profile.id === user.id
              ? "online"
              : inferStatus(member.last_active_at),
          role: roleMap[member.role] ?? "Viewer",
          lastActive: member.last_active_at
            ? timeAgo(member.last_active_at)
            : "Never",
          sheetsAccess: sheetCount,
        });
      }
    }
  }

  /* ── Pending invites sent by the current user ── */
  let pendingInvites: PendingInvite[] = [];
  try {
    const { data: invites } = await supabase
      .from("organization_invites")
      .select("id, email, created_at")
      .eq("invited_by", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    pendingInvites = (invites ?? []).map((inv: any) => ({
      id: inv.id,
      email: inv.email,
      created_at: inv.created_at,
    }));
  } catch {
    // Table may not exist yet — graceful fallback
  }

  return {
    people: Array.from(peopleMap.values()),
    organizations: orgList,
    pendingInvites,
  };
}


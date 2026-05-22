"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function trackOrganizationActive(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Update organization_members status to online and last_active_at
  await supabase
    .from("organization_members")
    .update({
      status: "online",
      last_active_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("user_id", user.id);

  // Optionally update user's profile last_seen_at
  await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", user.id);
}

export async function trackOrganizationOffline(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Update organization_members status to offline
  await supabase
    .from("organization_members")
    .update({
      status: "offline",
      last_active_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("user_id", user.id);
}


"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function trackSheetOpen(sheetId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: sheet } = await supabase
    .from("sheets")
    .select("owner_id, organization_id")
    .eq("id", sheetId)
    .maybeSingle();

  if (!sheet) return;

  let canTrack = sheet.owner_id === user.id;

  if (!canTrack && sheet.organization_id) {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", sheet.organization_id)
      .eq("user_id", user.id)
      .maybeSingle();
    canTrack = Boolean(membership);
  }

  if (!canTrack) return;

  await supabase
    .from("sheets")
    .update({ last_opened_at: new Date().toISOString() })
    .eq("id", sheetId);
}

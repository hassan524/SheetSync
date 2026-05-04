"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function trackSheetOpen(sheetId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
        .from("sheets")
        .update({ last_opened_at: new Date().toISOString() })
        .eq("id", sheetId)
        .eq("owner_id", user.id);
}
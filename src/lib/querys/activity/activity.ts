"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function logActivity({
    sheetId,
    action,
    target,
}: {
    sheetId?: string;
    userId: string;
    action: string;
    target?: string;
}) {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase.from("sheet_history").insert({
        sheet_id: sheetId ?? null,
        user_id: user.id,
        action,
        target: target ?? null,
    });

    if (error) throw error;
}


export async function getActivity() {

    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("sheet_history")
        .select(`
      id,
      action,
      target,
      created_at,
      sheets (
        id,
        title
      ),
      profiles (
        id,
        name,
        email
      )
    `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

    if (error) throw error;

    return data || [];
}
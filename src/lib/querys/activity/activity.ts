import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * LOG ACTIVITY (use everywhere)
 */
export async function logActivity({
    sheetId,
    organizationId,
    action,
    target,
}: {
    sheetId?: string;
    organizationId?: string;
    action: string;
    target?: string;
}) {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase.from("sheet_history").insert({
        user_id: user.id,
        actor_id: user.id,
        sheet_id: sheetId ?? null,
        organization_id: organizationId ?? null,
        action,
        target: target ?? null,
    });

    if (error) throw error;
}

/**
 * MAIN DASHBOARD ACTIVITY (personal feed)
 */
export async function getMyActivity() {
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
      sheet_id,
      organization_id,
      sheets (
        id,
        title
      )
    `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

    if (error) throw error;

    return data || [];
}

/**
 * ORGANIZATION ACTIVITY (team feed)
 */
export async function getOrgActivity(orgId: string) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("sheet_history")
        .select(`
      id,
      action,
      target,
      created_at,
      user_id,
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
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) throw error;

    return data || [];
}
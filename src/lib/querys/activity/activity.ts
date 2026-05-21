"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/querys/profiles/ensure-profile";

/**
 * LOG ACTIVITY (GLOBAL FUNCTION — USE EVERYWHERE)
 *
 * Non-throwing: catches errors so it never breaks the calling action.
 * Both `sheetId` and `organizationId` are optional — supports
 * personal activities, org activities, and sheet-less activities.
 */
export async function logActivity({
    sheetId,
    organizationId,
    action,
    target,
}: {
    sheetId?: string;
    organizationId?: string | null;
    action: string;
    target?: string;
}) {
    try {
        const supabase = await createSupabaseServerClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return; // silently bail — don't crash the caller
        await ensureUserProfile(supabase, user);

        const { error } = await supabase.from("sheet_history").insert({
            actor_id: user.id,
            user_id: user.id,
            sheet_id: sheetId ?? null,
            organization_id: organizationId ?? null,
            action,
            target: target ?? null,
        });

        if (error) console.error("logActivity insert error:", error.message);
    } catch (err) {
        console.error("logActivity failed:", err);
    }
}

/**
 * PERSONAL DASHBOARD ACTIVITY
 * Returns the current user's own actions (personal feed).
 */
export async function getMyActivity() {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("sheet_history")
        .select(
            `
            id,
            action,
            target,
            created_at,
            sheet_id,
            organization_id,
            actor_id,
            sheets (
                title
            ),
            organizations (
                name
            )
            `
        )
        .eq("actor_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

    if (error) {
        console.error("getMyActivity error:", error.message);
        return [];
    }
    return data || [];
}
/**
 * ORGANIZATION ACTIVITY FEED
 * All member actions inside a specific organization.
 */
export async function getOrgActivity(orgId: string) {
    const supabase = await createSupabaseServerClient();

    // Fetch activities for this org
    const { data, error } = await supabase
        .from("sheet_history")
        .select(
            `
            id,
            action,
            target,
            created_at,
            actor_id,
            sheet_id
            `
        )
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error("getOrgActivity error:", error.message);
        return [];
    }

    if (!data || data.length === 0) return [];

    // Collect unique actor IDs to fetch profiles separately (avoids FK join issues)
    const actorIds = [...new Set(data.map((d) => d.actor_id).filter(Boolean))];
    const sheetIds = [...new Set(data.map((d) => d.sheet_id).filter(Boolean))];

    // Fetch actor profiles
    let profilesMap: Record<string, { id: string; name: string }> = {};
    if (actorIds.length > 0) {
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, name")
            .in("id", actorIds);
        if (profiles) {
            profilesMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
        }
    }

    // Fetch sheet titles
    let sheetsMap: Record<string, { id: string; title: string }> = {};
    if (sheetIds.length > 0) {
        const { data: sheets } = await supabase
            .from("sheets")
            .select("id, title")
            .in("id", sheetIds);
        if (sheets) {
            sheetsMap = Object.fromEntries(sheets.map((s) => [s.id, s]));
        }
    }

    // Merge
    return data.map((row) => ({
        ...row,
        profiles: row.actor_id ? profilesMap[row.actor_id] ?? null : null,
        sheets: row.sheet_id ? sheetsMap[row.sheet_id] ?? null : null,
    }));
}

/**
 * LOG INVITE ACTIVITY
 */
export async function logInviteActivity({
    organizationId,
    email,
}: {
    organizationId: string;
    email: string;
}) {
    await logActivity({
        organizationId,
        action: "invited user",
        target: email,
    });
}


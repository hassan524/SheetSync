"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface DashboardStats {
    totalSheets: number;
    activeCollaborators: number;
    organizationsCount: number;
    starredSheets: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // 1. Total personal sheets
    const { count: totalSheets } = await supabase
        .from("sheets")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id);

    // 2. Starred sheets
    const { count: starredSheets } = await supabase
        .from("sheets")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id)
        .eq("is_starred", true);

    // 3. Orgs the user belongs to
    const { data: orgs } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id);

    const orgIds = orgs?.map((o) => o.organization_id) ?? [];
    const organizationsCount = orgIds.length;

    // 4. Unique collaborators across all orgs (excluding self)
    let activeCollaborators = 0;
    if (orgIds.length > 0) {
        const { data: allMembers } = await supabase
            .from("organization_members")
            .select("user_id")
            .in("organization_id", orgIds)
            .neq("user_id", user.id);

        const uniqueIds = new Set(allMembers?.map((m) => m.user_id) ?? []);
        activeCollaborators = uniqueIds.size;
    }

    return {
        totalSheets: totalSheets ?? 0,
        starredSheets: starredSheets ?? 0,
        organizationsCount,
        activeCollaborators,
    };
}
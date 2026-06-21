export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role } from "@/types/index";

const EDITABLE_ROLES: Role[] = ["editor", "viewer"];

async function getContext(sheetId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized. Please login again." }, { status: 401 }) };
  }

  const { data: sheet, error: sheetError } = await supabase
    .from("sheets")
    .select("organization_id, owner_id")
    .eq("id", sheetId)
    .maybeSingle();

  if (sheetError || !sheet) {
    return { error: NextResponse.json({ error: "Sheet not found" }, { status: 404 }) };
  }

  const orgId = sheet.organization_id;
  const isOrg = !!orgId;

  if (isOrg) {
    const { data: ownerMember, error: ownerError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (ownerError || ownerMember?.role !== "owner") {
      return { error: NextResponse.json({ error: "Only the organization owner can manage members" }, { status: 403 }) };
    }

    return { supabase, user, organizationId: orgId, isOrg: true };
  } else {
    if (sheet.owner_id !== user.id) {
      return { error: NextResponse.json({ error: "Only the sheet owner can manage members" }, { status: 403 }) };
    }

    return { supabase, user, sheetId, isOrg: false };
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { sheetId, userId, role } = await req.json();
    if (!sheetId || !userId || !role) {
      return NextResponse.json({ error: "Sheet ID, user ID, and role are required" }, { status: 400 });
    }
    if (!EDITABLE_ROLES.includes(role)) {
      return NextResponse.json({ error: "Members can only be changed to editor or viewer" }, { status: 400 });
    }

    const ctx = await getContext(sheetId);
    if ("error" in ctx) return ctx.error;
    if (ctx.user.id === userId) {
      return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
    }

    if (ctx.isOrg) {
      const { data: target, error: targetError } = await ctx.supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", ctx.organizationId)
        .eq("user_id", userId)
        .maybeSingle();

      if (targetError || !target) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }
      if (target.role === "owner") {
        return NextResponse.json({ error: "The owner role cannot be changed here" }, { status: 400 });
      }

      const { error: updateError } = await ctx.supabase
        .from("organization_members")
        .update({ role })
        .eq("organization_id", ctx.organizationId)
        .eq("user_id", userId);

      if (updateError) {
        return NextResponse.json({ error: "Failed to update member role" }, { status: 500 });
      }
    } else {
      const { data: target, error: targetError } = await ctx.supabase
        .from("sheet_members")
        .select("role")
        .eq("sheet_id", sheetId)
        .eq("user_id", userId)
        .maybeSingle();

      if (targetError || !target) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }
      if (target.role === "owner") {
        return NextResponse.json({ error: "The owner role cannot be changed here" }, { status: 400 });
      }

      const { error: updateError } = await ctx.supabase
        .from("sheet_members")
        .update({ role })
        .eq("sheet_id", sheetId)
        .eq("user_id", userId);

      if (updateError) {
        return NextResponse.json({ error: "Failed to update member role" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, role });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unexpected server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sheetId = req.nextUrl.searchParams.get("sheetId") ?? "";
    const userId = req.nextUrl.searchParams.get("userId") ?? "";
    if (!sheetId || !userId) {
      return NextResponse.json({ error: "Sheet ID and user ID are required" }, { status: 400 });
    }

    const ctx = await getContext(sheetId);
    if ("error" in ctx) return ctx.error;
    if (ctx.user.id === userId) {
      return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
    }

    if (ctx.isOrg) {
      const { data: target, error: targetError } = await ctx.supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", ctx.organizationId)
        .eq("user_id", userId)
        .maybeSingle();

      if (targetError || !target) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }
      if (target.role === "owner") {
        return NextResponse.json({ error: "The organization owner cannot be removed" }, { status: 400 });
      }

      const { error: deleteError } = await ctx.supabase
        .from("organization_members")
        .delete()
        .eq("organization_id", ctx.organizationId)
        .eq("user_id", userId);

      if (deleteError) {
        return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
      }
    } else {
      const { data: target, error: targetError } = await ctx.supabase
        .from("sheet_members")
        .select("role")
        .eq("sheet_id", sheetId)
        .eq("user_id", userId)
        .maybeSingle();

      if (targetError || !target) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }
      if (target.role === "owner") {
        return NextResponse.json({ error: "The sheet owner cannot be removed" }, { status: 400 });
      }

      const { error: deleteError } = await ctx.supabase
        .from("sheet_members")
        .delete()
        .eq("sheet_id", sheetId)
        .eq("user_id", userId);

      if (deleteError) {
        return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unexpected server error" }, { status: 500 });
  }
}

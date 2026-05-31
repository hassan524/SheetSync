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
    .select("organization_id")
    .eq("id", sheetId)
    .maybeSingle();

  if (sheetError || !sheet?.organization_id) {
    return { error: NextResponse.json({ error: "Organization sheet not found" }, { status: 404 }) };
  }

  const { data: ownerMember, error: ownerError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", sheet.organization_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownerError || ownerMember?.role !== "owner") {
    return { error: NextResponse.json({ error: "Only the organization owner can manage members" }, { status: 403 }) };
  }

  return { supabase, user, organizationId: sheet.organization_id as string };
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
      return NextResponse.json({ error: "You cannot change your own owner role" }, { status: 400 });
    }

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

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unexpected server error" }, { status: 500 });
  }
}

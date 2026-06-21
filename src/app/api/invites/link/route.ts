// app/api/invites/link/route.ts

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getConfiguredAppOrigin } from "@/lib/app-url";

export async function POST(req: NextRequest) {
  try {
    const { sheetId, orgId, role } = await req.json();

    if (!sheetId && !orgId) {
      return NextResponse.json(
        { error: "Sheet ID or organization ID is required" },
        { status: 400 },
      );
    }

    if (!["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid invite role" },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please login again." },
        { status: 401 },
      );
    }

    const { data: sheet, error: sheetError } = sheetId
      ? await supabase
        .from("sheets")
        .select("id, title, organization_id, owner_id")
        .eq("id", sheetId)
        .maybeSingle()
      : { data: null, error: null };

    if (sheetId && (sheetError || !sheet)) {
      return NextResponse.json(
        { error: "Sheet not found" },
        { status: 404 },
      );
    }

    const organizationId = sheet?.organization_id ?? orgId;

    if (sheetId && !sheet?.organization_id) {
      if (!sheet || sheet.owner_id !== user.id) {
        return NextResponse.json(
          { error: "Only the sheet owner can share this sheet" },
          { status: 403 },
        );
      }
    }

    let inviterOrgName = sheet?.title ?? "Sheet";

    if (organizationId) {
      const { data: inviterMember, error: memberError } = await supabase
        .from("organization_members")
        .select("role, organizations(name)")
        .eq("organization_id", organizationId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError || !inviterMember) {
        return NextResponse.json(
          { error: "You are not a member of this organization" },
          { status: 403 },
        );
      }

      if (inviterMember.role !== "owner") {
        return NextResponse.json(
          { error: "Only the organization owner can create share links" },
          { status: 403 },
        );
      }

      inviterOrgName = (inviterMember as any).organizations?.name ?? inviterOrgName;
    }

    const token = randomUUID();
    const { error: insertError } = await supabase
      .from("organization_invites")
      .insert({
        organization_id: organizationId ?? "00000000-0000-0000-0000-000000000000",
        email: `link-${token}@sheetsync.local`,
        role,
        token,
        invited_by: user.id,
        status: "pending",
        created_at: new Date().toISOString(),
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      });

    if (insertError) {
      console.error("Link invite insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create share link" },
        { status: 500 },
      );
    }

    await supabase.from("sheet_history").insert({
      actor_id: user.id,
      user_id: user.id,
      sheet_id: sheetId ?? null,
      organization_id: organizationId,
      action: "created share link",
      target: inviterOrgName,
    });

    const origin =
      process.env.NODE_ENV === "production"
        ? getConfiguredAppOrigin() || req.nextUrl.origin
        : req.nextUrl.origin;
    const inviteUrl = sheetId
      ? new URL(`/sheet/${sheetId}`, origin)
      : new URL(`/invite/${token}`, origin);
    if (sheetId) {
      inviteUrl.searchParams.set("invited", "true");
      inviteUrl.searchParams.set("inviteToken", token);
      inviteUrl.searchParams.set("role", role);
      inviteUrl.searchParams.set("by", user.id);
    }

    return NextResponse.json({ success: true, inviteUrl: inviteUrl.toString() });
  } catch (err: any) {
    console.error("Link invite API error:", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected server error" },
      { status: 500 },
    );
  }
}

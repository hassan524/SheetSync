export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { sendInviteEmail } from "@/lib/email/send-invite-email";
import { getConfiguredAppOrigin } from "@/lib/app-url";

// Email validation
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgId: requestedOrgId, emails, role, sheetId } = body;

    // -----------------------------
    // Basic validation
    // -----------------------------
    if (!requestedOrgId && !sheetId)
      return NextResponse.json(
        { error: "Organization ID or sheet ID is required" },
        { status: 400 },
      );

    if (!emails || !Array.isArray(emails) || emails.length === 0)
      return NextResponse.json(
        { error: "At least one email is required" },
        { status: 400 },
      );

    if (!role)
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    if (!["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid invite role" },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();

    // -----------------------------
    // Auth check
    // -----------------------------
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user)
      return NextResponse.json(
        { error: "Unauthorized. Please login again." },
        { status: 401 },
      );

    let orgId = requestedOrgId;
    let sheetTitle = "";

    if (!orgId && sheetId) {
      const { data: sheet, error: sheetError } = await supabase
        .from("sheets")
        .select("title, organization_id")
        .eq("id", sheetId)
        .maybeSingle();

      if (sheetError || !sheet?.organization_id) {
        return NextResponse.json(
          { error: "Organization sheet not found" },
          { status: 404 },
        );
      }

      orgId = sheet.organization_id;
      sheetTitle = sheet.title ?? "";
    }

    const { data: inviterMember, error: inviterMemberError } = await supabase
      .from("organization_members")
      .select("role, organizations(name)")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (inviterMemberError || !inviterMember) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 },
      );
    }

    if (inviterMember.role !== "owner") {
      return NextResponse.json(
        { error: "Only the organization owner can invite members" },
        { status: 403 },
      );
    }

    const orgName =
      (inviterMember as any).organizations?.name ?? "your organization";

    const results: any[] = [];

    // -----------------------------
    // Process each email
    // -----------------------------
    for (const email of emails) {
      const cleanEmail = email.trim().toLowerCase();

      if (!isValidEmail(cleanEmail)) {
        results.push({
          email: cleanEmail,
          status: "failed",
          error: "Invalid email address",
        });
        continue;
      }

      // Prevent inviting yourself
      if (cleanEmail === user.email) {
        results.push({
          email: cleanEmail,
          status: "skipped",
          error: "You cannot invite yourself",
        });
        continue;
      }

      // -----------------------------
      // Check if email belongs to an existing user
      // -----------------------------
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (profileError) {
        console.error("Profile lookup error:", profileError);
      }

      // If user exists → check membership
      if (profile) {
        const { data: member, error: memberError } = await supabase
          .from("organization_members")
          .select("id")
          .eq("organization_id", orgId)
          .eq("user_id", profile.id)
          .maybeSingle();

        if (memberError) {
          console.error("Member check error:", memberError);
        }

        if (member) {
          results.push({
            email: cleanEmail,
            status: "skipped",
            error: "User is already a member",
          });
          continue;
        }
      }

      // -----------------------------
      // Check if invite already exists
      // -----------------------------
      const { data: existingInvite, error: inviteError } = await supabase
        .from("organization_invites")
        .select("id, status")
        .eq("organization_id", orgId)
        .eq("email", cleanEmail)
        .maybeSingle();

      if (inviteError) {
        console.error("Existing invite check error:", inviteError);
      }

      if (existingInvite?.status === "pending") {
        results.push({
          email: cleanEmail,
          status: "skipped",
          error: "Invite already sent",
        });
        continue;
      }

      // -----------------------------
      // Generate invite token
      // -----------------------------
      const token = randomUUID();

      // -----------------------------
      // Store invite
      // -----------------------------
      const invitePayload = {
        organization_id: orgId,
        email: cleanEmail,
        role,
        token,
        invited_by: user.id,
        status: "pending",
        created_at: new Date().toISOString(),
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };

      const inviteWrite = existingInvite
        ? await supabase
            .from("organization_invites")
            .update(invitePayload)
            .eq("id", existingInvite.id)
        : await supabase.from("organization_invites").insert(invitePayload);

      const insertError = inviteWrite.error;

      if (insertError) {
        console.error("Invite insert error:", insertError);

        results.push({
          email: cleanEmail,
          status: "failed",
          error: "Failed to store invite",
        });

        continue;
      }

      // -----------------------------
      // Send invite email
      // -----------------------------
      try {
        const origin =
          process.env.NODE_ENV === "production"
            ? getConfiguredAppOrigin() || req.nextUrl.origin
            : req.nextUrl.origin;
        const sheetInviteUrl = sheetId
          ? new URL(`/sheet/${sheetId}`, origin)
          : null;

        if (sheetInviteUrl) {
          sheetInviteUrl.searchParams.set("invited", "true");
          sheetInviteUrl.searchParams.set("inviteToken", token);
          sheetInviteUrl.searchParams.set("role", role);
          sheetInviteUrl.searchParams.set("by", user.id);
        }

        await sendInviteEmail({
          email: cleanEmail,
          organizationName: orgName,
          token,
          inviterName: user.user_metadata?.full_name || "Someone",
          role,
          redirectPath: sheetId ? `/sheet/${sheetId}` : undefined,
          inviteUrl: sheetInviteUrl?.toString(),
        });

        results.push({
          email: cleanEmail,
          status: "sent",
        });

        await supabase.from("sheet_history").insert({
          actor_id: user.id,
          user_id: user.id,
          sheet_id: null,
          organization_id: orgId,
          action: sheetId ? "invited user to sheet" : "invited user",
          target: sheetTitle || orgName,
        });
      } catch (emailError: any) {
        console.error("Email send error:", emailError);

        results.push({
          email: cleanEmail,
          status: "failed",
          error: "Invite stored but email failed to send",
        });
      }
    }

    // -----------------------------
    // Return results
    // -----------------------------
    const sentCount = results.filter((r) => r.status === "sent").length;

    return NextResponse.json({
      success: true,
      message: `${sentCount} invitation(s) processed`,
      results,
    });
  } catch (err: any) {
    console.error("Invite API error:", err);

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected server error",
        details: err.message,
      },
      { status: 500 },
    );
  }
}

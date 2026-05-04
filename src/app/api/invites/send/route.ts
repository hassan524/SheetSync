export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { sendInviteEmail } from "@/lib/email/send-invite-email";

// Email validation
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  console.log("API /invites/send hit");

  try {
    const body = await req.json();
    const { orgId, orgName, emails, role } = body;

    console.log("Request body:", body);

    // -----------------------------
    // Basic validation
    // -----------------------------
    if (!orgId)
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );

    if (!orgName)
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );

    if (!emails || !Array.isArray(emails) || emails.length === 0)
      return NextResponse.json(
        { error: "At least one email is required" },
        { status: 400 }
      );

    if (!role)
      return NextResponse.json({ error: "Role is required" }, { status: 400 });

    const supabase = await createSupabaseServerClient();

    // -----------------------------
    // Auth check
    // -----------------------------
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("Authenticated user:", user);

    if (userError || !user)
      return NextResponse.json(
        { error: "Unauthorized. Please login again." },
        { status: 401 }
      );

    const results: any[] = [];

    // -----------------------------
    // Process each email
    // -----------------------------
    for (const email of emails) {
      const cleanEmail = email.trim().toLowerCase();

      console.log("Processing email:", cleanEmail);

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
        .select("id")
        .eq("organization_id", orgId)
        .eq("email", cleanEmail)
        .eq("status", "pending")
        .maybeSingle();

      if (inviteError) {
        console.error("Existing invite check error:", inviteError);
      }

      if (existingInvite) {
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
      console.log("Generated token:", token);

      // -----------------------------
      // Store invite
      // -----------------------------
      const { error: insertError } = await supabase
        .from("organization_invites")
        .insert({
          organization_id: orgId,
          email: cleanEmail,
          role,
          token,
          invited_by: user.id,
          status: "pending",
          created_at: new Date().toISOString(),
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        });

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
        console.log("Sending invite email to:", cleanEmail);

        await sendInviteEmail({
          email: cleanEmail,
          organizationName: orgName,
          token,
          inviterName: user.user_metadata?.full_name || "Someone",
          role,
        });

        results.push({
          email: cleanEmail,
          status: "sent",
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

    console.log("Results:", results);

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
      { status: 500 }
    );
  }
}
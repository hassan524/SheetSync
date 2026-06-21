// app/api/invites/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendNotification } from "@/lib/notify";
import { memberJoinedTemplate } from "@/lib/notification-templates";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { token, inviteByLink, sheetId, role } = await req.json();

    if (!token)
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (inviteByLink) {
      console.log("MARKER_TEST_12345");
      console.log("🔗 [INVITE] Link invite flow started", {
        sheetId,
        userId: user.id,
        userEmail: user.email,
      });

      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );

      // ── Step 1: Look up the sheet ────────────────────────────────────────
      if (!sheetId) {
        console.error("❌ [INVITE] sheetId is missing from request body");
        return NextResponse.json(
          { error: "sheetId is required for link invites" },
          { status: 400 },
        );
      }
      const { data: sheet, error: sheetError } = await admin
        .from("sheets")
        .select("id, organization_id, owner_id")
        .eq("id", sheetId)
        .maybeSingle();

      console.log("📋 [INVITE] Sheet lookup result:", {
        sheet,
        sheetError,
        sheetId,
      });

      if (sheetError) {
        console.error("❌ [INVITE] Sheet lookup error:", sheetError);
        return NextResponse.json(
          { error: `Sheet lookup failed: ${sheetError.message}` },
          { status: 500 },
        );
      }

      if (!sheet) {
        console.error("❌ [INVITE] Sheet not found for id:", sheetId);
        return NextResponse.json(
          { error: `Sheet not found: ${sheetId}` },
          { status: 400 },
        );
      }

      const orgId = sheet.organization_id;

      if (!orgId) {
        const { error: collabError } = await admin
          .from("sheet_members")
          .upsert({
            sheet_id: sheetId,
            user_id: user.id,
            role: role || "viewer",
            joined_at: new Date().toISOString(),
          }, { onConflict: "sheet_id,user_id" });

        if (collabError) {
          console.error("❌ [INVITE] Failed to add sheet member:", collabError);
          return NextResponse.json({ error: "Failed to join sheet" }, { status: 500 });
        }

        return NextResponse.json({ role: role || "viewer", inviterName: null });
      }
      // ── Step 2: Verify org exists ────────────────────────────────────────
      const { data: org, error: orgError } = await admin
        .from("organizations")
        .select("id, name, created_by")
        .eq("id", orgId)
        .maybeSingle();

      console.log("🏢 [INVITE] Org lookup result:", { org, orgError, orgId });

      if (orgError || !org) {
        console.error("❌ [INVITE] Org not found:", { orgError, orgId });
        return NextResponse.json(
          { error: `Organization not found: ${orgId}` },
          { status: 400 },
        );
      }

      // ── Step 3: Check if already a member ───────────────────────────────
      const { data: linkInvite, error: linkInviteError } = await admin
        .from("organization_invites")
        .select("id, organization_id, role, status, expires_at")
        .eq("token", token)
        .eq("organization_id", orgId)
        .eq("status", "pending")
        .maybeSingle();

      if (linkInviteError || !linkInvite) {
        return NextResponse.json(
          { error: "Invite link is invalid or expired" },
          { status: 404 },
        );
      }

      if (
        linkInvite.expires_at &&
        new Date(linkInvite.expires_at) < new Date()
      ) {
        await admin
          .from("organization_invites")
          .update({ status: "expired" })
          .eq("id", linkInvite.id);
        return NextResponse.json(
          { error: "Invite link has expired" },
          { status: 410 },
        );
      }

      const effectiveRole = linkInvite.role || "viewer";

      const { data: existing, error: existingError } = await admin
        .from("organization_members")
        .select("id, role")
        .eq("organization_id", orgId)
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("👤 [INVITE] Existing member check:", {
        existing,
        existingError,
        userId: user.id,
        orgId,
      });

      if (existingError) {
        console.error("❌ [INVITE] Error checking existing member:", existingError);
        return NextResponse.json(
          { error: `Member check failed: ${existingError.message}` },
          { status: 500 },
        );
      }

      if (existing) {
        console.log("ℹ️ [INVITE] User is already a member:", {
          role: existing.role,
          userId: user.id,
          orgId,
        });
        return NextResponse.json({
          alreadyMember: true,
          role: existing.role,
        });
      }

      // ── Step 4: Insert new member ────────────────────────────────────────

      console.log("➕ [INVITE] Inserting new member:", {
        organization_id: orgId,
        user_id: user.id,
        role: effectiveRole,
      });

      const { error: memberError } = await admin
        .from("organization_members")
        .insert({
          organization_id: orgId,
          user_id: user.id,
          role: effectiveRole,
          joined_at: new Date().toISOString(),
        });

      if (memberError) {
        console.error("❌ [INVITE] Failed to insert member:", memberError);
        return NextResponse.json(
          { error: `Failed to add member: ${memberError.message}` },
          { status: 500 },
        );
      }

      console.log("✅ [INVITE] Member inserted successfully:", {
        userId: user.id,
        orgId,
        role: effectiveRole,
      });

      // ── Step 5: Log to sheet history ─────────────────────────────────────
      const { error: historyError } = await admin
        .from("sheet_history")
        .insert({
          actor_id: user.id,
          user_id: user.id,
          sheet_id: null,
          organization_id: orgId,
          action: "joined organization",
          target: org.name ?? "Organization",
        });

      if (historyError) {
        // Non-fatal — just log it
        console.warn("⚠️ [INVITE] Failed to log sheet history:", historyError);
      }

      // ── Step 6: Notify org owner ─────────────────────────────────────────
      if (org.created_by) {
        try {
          const memberName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email ||
            "Someone";

          console.log("🔔 [INVITE] Sending notification to org owner:", {
            ownerId: org.created_by,
            memberName,
            orgName: org.name,
          });

          const notification = memberJoinedTemplate({
            memberName,
            orgName: org.name || "your organization",
            role: effectiveRole,
          });

          await sendNotification({
            userId: org.created_by,
            title: notification.title,
            body: notification.body,
            url: notification.url,
            icon: notification.icon,
          });

          console.log("✅ [INVITE] Notification sent");
        } catch (notifError) {
          console.warn("⚠️ [INVITE] Notification failed (non-fatal):", notifError);
        }
      }

      console.log("🎉 [INVITE] Link invite complete:", {
        userId: user.id,
        orgId,
        role: effectiveRole,
      });

      return NextResponse.json({
        role: effectiveRole,
        inviterName: null,
      });
    }

    // ── EMAIL INVITE: existing logic unchanged below ───────────────────
    const { data: inviteData, error: inviteError } = await supabase
      .from("organization_invites")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single();

    if (inviteError || !inviteData)
      return NextResponse.json({ error: "Invite not found or expired" }, { status: 404 });

    if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
      await supabase.from("organization_invites").update({ status: "expired" }).eq("id", inviteData.id);
      return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
    }

    const isLinkInvite = String(inviteData.email).toLowerCase().startsWith("link-");

    if (!isLinkInvite && user.email?.toLowerCase() !== String(inviteData.email).toLowerCase())
      return NextResponse.json({ error: "This invite was sent to a different email address" }, { status: 403 });

    const { data: existingMember } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", inviteData.organization_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMember) {
      if (!isLinkInvite)
        await supabase.from("organization_invites").update({ status: "accepted" }).eq("id", inviteData.id);
      return NextResponse.json({ message: "You are already a member of this organization", organizationId: inviteData.organization_id });
    }

    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({ organization_id: inviteData.organization_id, user_id: user.id, role: inviteData.role, joined_at: new Date().toISOString() });

    if (memberError) throw memberError;

    if (!isLinkInvite) {
      const { error: updateError } = await supabase.from("organization_invites").update({ status: "accepted" }).eq("id", inviteData.id);
      if (updateError) throw updateError;
    }

    const { data: acceptedOrg } = await supabase.from("organizations").select("name").eq("id", inviteData.organization_id).maybeSingle();

    await supabase.from("sheet_history").insert({
      actor_id: user.id, user_id: user.id, sheet_id: null,
      organization_id: inviteData.organization_id, action: "joined organization",
      target: acceptedOrg?.name ?? "Organization",
    });

    try {
      const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const { data: orgData } = await admin.from("organizations").select("name, created_by").eq("id", inviteData.organization_id).single();
      if (orgData?.created_by) {
        const memberName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || "Someone";
        const notification = memberJoinedTemplate({ memberName, orgName: orgData.name || "your organization", role: inviteData.role });
        await sendNotification({ userId: orgData.created_by, title: notification.title, body: notification.body, url: notification.url, icon: notification.icon });
      }
    } catch (e) { console.error("Failed to send join notification:", e); }

    return NextResponse.json({ message: "Invite accepted", organizationId: inviteData.organization_id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

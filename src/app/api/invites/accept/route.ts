import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendNotification } from "@/lib/notify";
import { memberJoinedTemplate } from "@/lib/notification-templates";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { token } = await req.json();

    if (!token)
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: inviteData, error: inviteError } = await supabase
      .from("organization_invites")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single();

    if (inviteError || !inviteData) {
      return NextResponse.json(
        { error: "Invite not found or expired" },
        { status: 404 },
      );
    }

    if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
      await supabase
        .from("organization_invites")
        .update({ status: "expired" })
        .eq("id", inviteData.id);
      return NextResponse.json(
        { error: "Invite has expired" },
        { status: 410 },
      );
    }

    if (user.email?.toLowerCase() !== String(inviteData.email).toLowerCase()) {
      return NextResponse.json(
        { error: "This invite was sent to a different email address" },
        { status: 403 },
      );
    }

    // Check if user is already a member (prevent duplicates)
    const { data: existingMember } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", inviteData.organization_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMember) {
      // Already a member — just mark invite as accepted
      await supabase
        .from("organization_invites")
        .update({ status: "accepted" })
        .eq("id", inviteData.id);

      return NextResponse.json({
        message: "You are already a member of this organization",
        organizationId: inviteData.organization_id,
      });
    }

    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({
        organization_id: inviteData.organization_id,
        user_id: user.id,
        role: inviteData.role,
        joined_at: new Date().toISOString(),
      });

    if (memberError) throw memberError;

    const { error: updateError } = await supabase
      .from("organization_invites")
      .update({ status: "accepted" })
      .eq("id", inviteData.id);

    if (updateError) throw updateError;

    const { data: acceptedOrg } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", inviteData.organization_id)
      .maybeSingle();

    await supabase.from("sheet_history").insert({
      actor_id: user.id,
      user_id: user.id,
      sheet_id: null,
      organization_id: inviteData.organization_id,
      action: "joined organization",
      target: acceptedOrg?.name ?? "Organization",
    });

    // ─── Send push notification to the organization owner ───
    try {
      // Use service role client to look up the org owner (since the current user might not have access)
      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );

      // Get organization name and the owner's user_id
      const { data: orgData } = await adminSupabase
        .from("organizations")
        .select("name, created_by")
        .eq("id", inviteData.organization_id)
        .single();

      if (orgData?.created_by) {
        const memberName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email ||
          "Someone";

        const notification = memberJoinedTemplate({
          memberName,
          orgName: orgData.name || "your organization",
          role: inviteData.role,
        });

        await sendNotification({
          userId: orgData.created_by,
          title: notification.title,
          body: notification.body,
          url: notification.url,
          icon: notification.icon,
        });
      }
    } catch (notifError) {
      // Don't fail the invite acceptance if notification fails
      console.error("Failed to send join notification:", notifError);
    }

    return NextResponse.json({
      message: "Invite accepted",
      organizationId: inviteData.organization_id,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { token } = await req.json();

    if (!token) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: inviteData, error: inviteError } = await supabase
      .from("organization_invites")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single();

    if (inviteError || !inviteData) {
      return NextResponse.json({ error: "Invite not found or expired" }, { status: 404 });
    }

    const { error: memberError } = await supabase.from("organization_members").insert({
      org_id: inviteData.org_id,
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

    return NextResponse.json({ message: "Invite accepted", organizationId: inviteData.org_id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
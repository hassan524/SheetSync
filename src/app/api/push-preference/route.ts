import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return Response.json(
      { ok: false, error: "Missing userId" },
      { status: 400 },
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase
    .from("profiles")
    .select("push_enabled")
    .eq("id", userId)
    .single();

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, push_enabled: data?.push_enabled ?? true });
}

export async function POST(req: Request) {
  const { userId, enabled } = await req.json();

  if (!userId || typeof enabled !== "boolean") {
    return Response.json(
      { ok: false, error: "Missing userId or enabled" },
      { status: 400 },
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await supabase
    .from("profiles")
    .update({ push_enabled: enabled })
    .eq("id", userId);

  if (error) {
    console.error("Failed to update push preference:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

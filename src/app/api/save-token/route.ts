import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { userId, token } = await req.json();

  if (!userId || !token) {
    return Response.json(
      { ok: false, error: "Missing userId or token" },
      { status: 400 },
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: userId,
      token,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,token" },
  );

  if (error) {
    console.error("Failed to save push token:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

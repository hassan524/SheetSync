import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token) {
    return Response.json(
      { ok: false, error: "Missing token" },
      { status: 400 },
    );
  }

  const authClient = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: user.id,
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


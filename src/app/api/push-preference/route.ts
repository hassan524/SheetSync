import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getAuthenticatedUserId() {
  const authClient = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) return null;
  return user.id;
}

export async function GET() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
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
  const { enabled } = await req.json();
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (typeof enabled !== "boolean") {
    return Response.json(
      { ok: false, error: "Missing enabled" },
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


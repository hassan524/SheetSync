"use server";

import type { User } from "@supabase/supabase-js";

export async function ensureUserProfile(supabase: any, user: User) {
  const metadata = user.user_metadata ?? {};
  const name =
    metadata.full_name || metadata.name || user.email?.split("@")[0] || "User";

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? `${user.id}@sheetsync.local`,
      name,
      avatar_url: metadata.avatar_url ?? metadata.picture ?? null,
    },
    { onConflict: "id" },
  );

  if (error) throw new Error(error.message);
}

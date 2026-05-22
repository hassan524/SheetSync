import { getAdminMessaging } from "./firebase/firebaseAdmin";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface SendNotificationOptions {
  userId: string;
  title: string;
  body: string;
  url?: string;
  icon?: string;
  data?: Record<string, string>;
}

export async function sendNotification({
  userId,
  title,
  body,
  url,
  icon,
  data,
}: SendNotificationOptions) {
  const { data: tokenRows } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("user_id", userId);

  if (!tokenRows?.length) return;

  const tokens = tokenRows.map((t) => t.token);

  const result = await getAdminMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body, ...(icon && { imageUrl: icon }) },
    webpush: {
      fcmOptions: { link: url || "/" },
      notification: {
        icon: icon || "/icon-192.png",
        badge: "/icon-192.png",
        requireInteraction: false,
      },
    },
    data: {
      url: url || "/",
      ...data,
    },
  });

  // Clean up stale tokens that Firebase rejected
  const staleTokens: string[] = [];
  result.responses.forEach((res, idx) => {
    if (
      res.error &&
      (res.error.code === "messaging/registration-token-not-registered" ||
        res.error.code === "messaging/invalid-registration-token")
    ) {
      staleTokens.push(tokens[idx]);
    }
  });

  if (staleTokens.length > 0) {
    await supabase.from("push_tokens").delete().in("token", staleTokens);
  }

  return result;
}


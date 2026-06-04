import { sendNotification } from "@/lib/notify";
import {
  inactiveReminderTemplate,
  deadlineApproachingTemplate,
  deadlineOverdueTemplate,
} from "@/lib/notification-templates";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// QA Tracker and Project Tracker template IDs
const DEADLINE_TEMPLATE_IDS = [
  "e73711d5-aab0-4281-bc8f-486ad6c6aaac", // QA Tracker
  "c9fb4014-cccf-4394-9c3f-5eb16c00cc47", // Project Tracker
];

export async function GET(req: Request) {
  const configuredSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const requestSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!configuredSecret || requestSecret !== configuredSecret) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    inactiveChecked: 0,
    inactiveNotified: 0,
    deadlinesChecked: 0,
    deadlineNotified: 0,
    errors: [] as string[],
  };

  // ─── 1. Inactive User Reminders ───────────────────────────
  try {
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, name, last_seen_at");

    if (error) {
      results.errors.push(`Profiles query: ${error.message}`);
    } else {
      const now = Date.now();
      results.inactiveChecked = users?.length || 0;

      for (const user of users || []) {
        if (!user.last_seen_at) continue;

        const lastSeen = new Date(user.last_seen_at).getTime();
        const inactiveHours = (now - lastSeen) / (1000 * 60 * 60);

        if (inactiveHours >= 48) {
          const notification = inactiveReminderTemplate({
            userName: user.name || undefined,
          });

          await sendNotification({
            userId: user.id,
            title: notification.title,
            body: notification.body,
            url: notification.url,
          });
          results.inactiveNotified++;
        }
      }
    }
  } catch (err: any) {
    results.errors.push(`Inactive check: ${err.message}`);
  }

  // ─── 2. Deadline Notifications ────────────────────────────
  try {
    // Get all sheets using QA/Project Tracker templates
    const { data: sheets, error: sheetsError } = await supabase
      .from("sheets")
      .select("id, title, owner_id, template_id")
      .in("template_id", DEADLINE_TEMPLATE_IDS);

    if (sheetsError) {
      results.errors.push(`Sheets query: ${sheetsError.message}`);
    } else if (sheets?.length) {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      for (const sheet of sheets) {
        // Determine the deadline column key based on template
        const deadlineKey =
          sheet.template_id === "c9fb4014-cccf-4394-9c3f-5eb16c00cc47"
            ? "due" // Project Tracker uses "due"
            : "deadline"; // QA Tracker uses "deadline"

        // Determine the item name column key
        const nameKey =
          sheet.template_id === "c9fb4014-cccf-4394-9c3f-5eb16c00cc47"
            ? "task" // Project Tracker
            : "title"; // QA Tracker

        // Fetch rows for this sheet that have deadline data
        const { data: rows, error: rowsError } = await supabase
          .from("rows")
          .select("data")
          .eq("sheet_id", sheet.id);

        if (rowsError || !rows) continue;

        results.deadlinesChecked += rows.length;

        for (const row of rows) {
          const rowData = row.data;
          if (!rowData || !rowData[deadlineKey]) continue;

          const deadlineDate = new Date(rowData[deadlineKey]);
          if (isNaN(deadlineDate.getTime())) continue;

          const itemTitle = rowData[nameKey] || "Untitled item";

          // Deadline is overdue
          if (deadlineDate < now) {
            const notification = deadlineOverdueTemplate({
              itemTitle,
              sheetName: sheet.title,
              deadline: rowData[deadlineKey],
            });

            await sendNotification({
              userId: sheet.owner_id,
              title: notification.title,
              body: notification.body,
              url: notification.url,
            });
            results.deadlineNotified++;
          }
          // Deadline is within 24 hours
          else if (deadlineDate <= in24h) {
            const notification = deadlineApproachingTemplate({
              itemTitle,
              sheetName: sheet.title,
              deadline: rowData[deadlineKey],
            });

            await sendNotification({
              userId: sheet.owner_id,
              title: notification.title,
              body: notification.body,
              url: notification.url,
            });
            results.deadlineNotified++;
          }
        }
      }
    }
  } catch (err: any) {
    results.errors.push(`Deadline check: ${err.message}`);
  }

  return Response.json({
    ok: results.errors.length === 0,
    ...results,
  });
}


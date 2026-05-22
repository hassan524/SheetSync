export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export function memberJoinedTemplate({
  memberName,
  orgName,
  role,
}: {
  memberName: string;
  orgName: string;
  role: string;
}): NotificationPayload {
  return {
    title: "🎉 New team member joined!",
    body: `${memberName} just joined ${orgName} as ${formatRole(role)}.`,
    url: "/organizations",
    icon: "/icon.png",
  };
}

export function deadlineApproachingTemplate({
  itemTitle,
  sheetName,
  deadline,
}: {
  itemTitle: string;
  sheetName: string;
  deadline: string;
}): NotificationPayload {
  return {
    title: "⏰ Deadline approaching",
    body: `"${itemTitle}" in ${sheetName} is due ${formatDeadlineDistance(deadline)}.`,
    url: "/dashboard",
    icon: "/icon.png",
  };
}

export function deadlineOverdueTemplate({
  itemTitle,
  sheetName,
  deadline,
}: {
  itemTitle: string;
  sheetName: string;
  deadline: string;
}): NotificationPayload {
  return {
    title: "🚨 Deadline missed",
    body: `"${itemTitle}" in ${sheetName} was due on ${formatDate(deadline)} and is now overdue.`,
    url: "/dashboard",
    icon: "/icon.png",
  };
}

export function inactiveReminderTemplate({
  userName,
}: {
  userName?: string;
}): NotificationPayload {
  const greeting = userName ? `Hey ${userName}` : "Hey there";
  return {
    title: `${greeting} 👋`,
    body: "You haven't checked SheetSync in a while. Your team might have updates waiting for you.",
    url: "/dashboard",
    icon: "/icon.png",
  };
}

export function inviteReceivedTemplate({
  orgName,
  inviterName,
}: {
  orgName: string;
  inviterName: string;
}): NotificationPayload {
  return {
    title: "📩 You've been invited!",
    body: `${inviterName} invited you to join ${orgName} on SheetSync.`,
    url: "/dashboard",
    icon: "/icon.png",
  };
}

// ─── Helpers ─────────────────────────────────────────────────

function formatRole(role: string): string {
  const map: Record<string, string> = {
    owner: "an Owner",
    admin: "an Admin",
    editor: "an Editor",
    viewer: "a Viewer",
  };
  return map[role.toLowerCase()] || `a ${role}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDeadlineDistance(dateStr: string): string {
  try {
    const deadline = new Date(dateStr);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffHours <= 0) return "now";
    if (diffHours <= 1) return "in less than an hour";
    if (diffHours < 24) return `in ${diffHours} hours`;
    return "tomorrow";
  } catch {
    return "soon";
  }
}
import { Resend } from "resend";

export async function sendInviteEmail({
  email,
  organizationName,
  token,
  inviterName,
  role = "editor",
}: {
  email: string;
  organizationName: string;
  token: string;
  inviterName?: string;
  role?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set in environment variables.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;
  const isDev = process.env.NODE_ENV === "development";

  // In dev, Resend only delivers to your verified email account.
  // Set RESEND_DEV_TO_EMAIL=you@gmail.com in .env.local
  const toAddress = isDev
    ? (process.env.RESEND_DEV_TO_EMAIL ?? email)
    : email;

  const fromAddress = isDev
    ? "SheetSync <onboarding@resend.dev>"
    : "SheetSync <noreply@sheetsync.com>"; // requires sheetsync.com verified in Resend

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const inviterLine = inviterName
    ? `<b>${inviterName}</b> has invited you`
    : "You've been invited";

  const html = buildEmailHtml({ organizationName, inviteLink, inviterLine, roleLabel, email });

  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to: toAddress,
      subject: `You're invited to join ${organizationName} on SheetSync`,
      html,
    });

    console.log(`[Resend] Email sent →`, result);
    return result;
  } catch (err: any) {
    console.error("[Resend] Failed to send email:", err?.message ?? err);
    throw err;
  }
}

// ─── HTML Template ────────────────────────────────────────────────────────────

function buildEmailHtml({
  organizationName,
  inviteLink,
  inviterLine,
  roleLabel,
  email,
}: {
  organizationName: string;
  inviteLink: string;
  inviterLine: string;
  roleLabel: string;
  email: string;
}) {
  const firstLetter =
    organizationName?.charAt(0)?.toUpperCase() || "O";

  return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Invite</title>
</head>

<body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
<tr>
<td align="center">

<table width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">

<!-- HEADER -->
<tr>
<td style="
  background:#16a34a;
  color:#ffffff;
  padding:16px 20px;
  border-radius:12px 12px 0 0;
  font-size:14px;
  font-weight:600;
">
  SheetSync Invitation
</td>
</tr>

<!-- CARD -->
<tr>
<td style="
  background:#ffffff;
  border:1px solid #e5e7eb;
  border-top:none;
  border-radius:0 0 12px 12px;
  padding:24px 20px;
">

  <!-- Org avatar -->
  <div style="
    width:40px;height:40px;
    background:#111827;
    border-radius:10px;
    display:flex;
    align-items:center;
    justify-content:center;
    margin-bottom:16px;
  ">
    <span style="color:#fff;font-weight:700;font-size:16px;">
      ${firstLetter}
    </span>
  </div>

  <!-- Title -->
  <h2 style="
    margin:0 0 6px;
    font-size:18px;
    color:#111827;
    font-weight:600;
  ">
    Join ${organizationName}
  </h2>

  <!-- Description -->
  <p style="
    margin:0 0 18px;
    font-size:14px;
    color:#6b7280;
    line-height:1.5;
  ">
    ${inviterLine} to collaborate on <b>${organizationName}</b>.
  </p>

  <!-- Info box -->
  <div style="
    border:1px solid #e5e7eb;
    border-radius:10px;
    padding:14px;
    margin-bottom:18px;
    background:#fafafa;
  ">
    <div style="margin-bottom:10px;">
      <div style="font-size:11px;color:#9ca3af;">Organization</div>
      <div style="font-size:14px;color:#111827;font-weight:600;">
        ${organizationName}
      </div>
    </div>

    <div>
      <div style="font-size:11px;color:#9ca3af;">Your Role</div>
      <div style="
        font-size:13px;
        font-weight:600;
        color:#16a34a;
      ">
        ${roleLabel}
      </div>
    </div>
  </div>

  <!-- Button -->
  <a href="${inviteLink}" style="
    display:block;
    text-align:center;
    background:#16a34a;
    color:#ffffff;
    text-decoration:none;
    font-size:14px;
    font-weight:600;
    padding:12px;
    border-radius:8px;
  ">
    Accept Invitation
  </a>

  <!-- Expiry -->
  <p style="
    margin:16px 0 0;
    font-size:12px;
    color:#9ca3af;
  ">
    This invitation expires in 7 days.
  </p>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td align="center" style="padding-top:14px;">
  <p style="
    font-size:11px;
    color:#9ca3af;
    line-height:1.5;
    margin:0;
  ">
    Sent to ${email}<br/>
    If you didn’t expect this, you can ignore it.
  </p>
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
  `.trim();
}
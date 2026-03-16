import { Resend } from "resend";

export async function sendInviteEmail(email: string, organizationName: string, token: string) {
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

  if (!process.env.RESEND_API_KEY) {
    console.error("Resend API key missing!");
    throw new Error("Resend API key missing!");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const senderEmail =
    process.env.NODE_ENV === "development"
      ? "SheetSync <onboarding@resend.dev>"
      : "SheetSync <noreply@sheetsync.com>";

  try {
    const result = await resend.emails.send({
      from: senderEmail,
      to: email, // for now only for development later in production add the actual email which coming from prop
      subject: `You've been invited to join ${organizationName}`,
      html: `<h2>You were invited to join ${organizationName}</h2>
             <p>Click below to accept:</p>
             <a href="${inviteLink}" style="background:#000;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Accept Invite</a>
             <p>This invite expires in 7 days.</p>`,
    });

    console.log("Email sent result:", result);
    return result;
  } catch (err: any) {
    console.error("Email send failed:", err);
    throw err;
  }
}
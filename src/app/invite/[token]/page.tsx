import AcceptInviteCard from "@/components/individual/invite/Accept-invite-card";

export default function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <AcceptInviteCard token={token} />
    </div>
  );
}
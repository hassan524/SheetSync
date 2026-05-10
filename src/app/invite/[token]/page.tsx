import AcceptInviteCard from "@/components/individual/invite/Accept-invite-card";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <AcceptInviteCard token={token} />
    </div>
  );
}
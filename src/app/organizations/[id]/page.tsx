import dynamic from "next/dynamic";
import { generateSEO } from "@/lib/seo/metadata";
import { getOrganizationById } from "@/lib/querys/organization/organization";

const DashboardLayout = dynamic(
  () => import("@/components/layout/Dashboard-layout"),
);
const OrgHeader = dynamic(() =>
  import("@/components/individual/organization/id/Organization-header").then(
    (m) => m.OrgHeader,
  ),
);
const OrgTablesPanel = dynamic(() =>
  import("@/components/individual/organization/id/Organization-tables-panel").then(
    (m) => m.OrgTablesPanel,
  ),
);
const OrgActivityPanel = dynamic(() =>
  import("@/components/individual/organization/id/Organizaion-activity-panel").then(
    (m) => m.OrgActivityPanel,
  ),
);
const OrgBottomStrip = dynamic(() =>
  import("@/components/individual/organization/id/Organization-bottom-strip").then(
    (m) => m.OrgBottomStrip,
  ),
);
const StatsCard = dynamic(() => import("@/components/common/Stats-card"));
const TrackActive = dynamic(() =>
  import("@/components/individual/organization/id/Track-active").then(
    (m) => m.TrackActive,
  ),
);

import { Users, Activity, FileSpreadsheet, Star } from "lucide-react";
import type { Organization } from "@/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;

  let org: Organization | null = null;
  try {
    org = await getOrganizationById(id);
  } catch (err) {
    console.error("Error fetching organization for metadata:", err);
  }

  if (!org) {
    return generateSEO({
      title: "Organization — Dashboard",
      description:
        "View and collaborate on spreadsheets inside your organization.",
      path: `/organizations/${id}`,
    });
  }

  return generateSEO({
    title: `${org.name} — Organization`,
    description: `Collaborate with your team in ${org.name}. Manage shared spreadsheets, members, and activity in real-time.`,
    path: `/organizations/${id}`,
    ogImage: "/og/organization-detail-og.png",
  });
}

export default async function OrganizationDetailPage({ params }: PageProps) {
  const { id } = await params;

  let org: Organization | null = null;
  try {
    org = await getOrganizationById(id);
  } catch (err) {
    console.error("Error fetching organization:", err);
  }

  if (!org) {
    return <div className="p-10 text-center">Organization not found</div>;
  }

  // ── Derived stats ──────────────────────────────────────────────
  const members = org.members ?? [];
  const sheets = org.sheets ?? [];
  const online = members.filter((m) => m.status === "online");
  const starredCount = sheets.filter((s) => s.is_starred).length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name,
    url: `https://sheetsync.app/organizations/${id}`,
    description:
      "A collaborative workspace for managing spreadsheets and team data.",
    member: org.members?.map((m) => ({
      "@type": "Person",
      name: m.profiles.name,
      email: m.profiles.email,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <TrackActive organizationId={id} />

      <DashboardLayout breadcrumbItems={["Organizations", org.name]}>
        <div className="w-full space-y-10 md:space-y-12">
          <OrgHeader org={org} />

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatsCard
              title="Total Members"
              value={members.length}
              change={org.weeklyStats?.membersJoined ?? 0}
              changeLabel="joined this week"
              icon={<Users className="h-5 w-5 text-primary" />}
            />
            <StatsCard
              title="Active Now"
              value={online.length}
              change={
                members.length
                  ? Math.round((online.length / members.length) * 100)
                  : 0
              }
              changeLabel="of total members"
              icon={<Activity className="h-5 w-5 text-primary" />}
            />
            <StatsCard
              title="Total Sheets"
              value={sheets.length}
              change={org.weeklyStats?.sheetsCreated ?? 0}
              changeLabel="created this week"
              icon={<FileSpreadsheet className="h-5 w-5 text-primary" />}
            />
            <StatsCard
              title="Starred Sheets"
              value={starredCount}
              change={starredCount}
              changeLabel="sheets starred"
              icon={<Star className="h-5 w-5 text-primary" />}
            />
          </div>

          {/* Tables + activity */}
          <div className="flex flex-col xl:flex-row gap-4 items-start">
            <div className="w-full xl:flex-1 min-w-0">
              <OrgTablesPanel org={org} />
            </div>
            <div className="w-full xl:w-72 shrink-0 xl:pt-11">
              <OrgActivityPanel org={org} />
            </div>
          </div>

          <OrgBottomStrip org={org} />
        </div>
      </DashboardLayout>
    </>
  );
}

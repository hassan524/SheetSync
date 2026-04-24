import { generateSEO } from "@/lib/seo/metadata";
import { getOrganizationById } from "@/lib/querys/organization/organization";

import DashboardLayout from "@/components/layout/Dashboard-layout";
import { OrgHeader } from "@/components/individual/organization/id/Organization-header";
import { OrgTablesPanel } from "@/components/individual/organization/id/Organization-tables-panel";
import { OrgActivityPanel } from "@/components/individual/organization/id/Organizaion-activity-panel";
import { OrgBottomStrip } from "@/components/individual/organization/id/Organization-bottom-strip";
import StatsCard from "@/components/common/Stats-card";

import { Users, Activity, FileSpreadsheet, HardDrive } from "lucide-react";
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
      title: "Organization | SheetSync",
      description: "View and collaborate on spreadsheets inside your organization.",
      path: `/organizations/${id}`,
    });
  }

  return generateSEO({
    title: `${org.name} | SheetSync`,
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
  const members      = org.members ?? [];
  const sheets       = org.sheets  ?? [];
  const online       = members.filter(m => m.status === "online");
  const storageUsed  = org.storageUsed  ?? 0;
  const storageLimit = org.storageLimit ?? 0;
  const storagePct   = storageLimit
    ? Math.round((storageUsed / storageLimit) * 100)
    : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name,
    url: `https://sheetsync.app/organizations/${id}`,
    description: "A collaborative workspace for managing spreadsheets and team data.",
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

      <DashboardLayout breadcrumbItems={["Organizations", org.name]}>
        <div className="w-full py-5 space-y-5">

          <OrgHeader org={org} />

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatsCard
              title="Total Members"
              value={members.length}
              change={12}
              changeLabel="vs last month"
              icon={<Users className="h-5 w-5 text-primary" />}
            />
            <StatsCard
              title="Active Now"
              value={online.length}
              change={members.length ? Math.round((online.length / members.length) * 100) : 0}
              changeLabel="of total members"
              icon={<Activity className="h-5 w-5 text-primary" />}
            />
            <StatsCard
              title="Total Sheets"
              value={sheets.length}
              change={8}
              changeLabel="created this week"
              icon={<FileSpreadsheet className="h-5 w-5 text-primary" />}
            />
            <StatsCard
              title="Storage Used"
              value={`${storageUsed.toFixed(1)} GB`}
              change={storagePct >= 90 ? -storagePct : storagePct}
              changeLabel={`of ${storageLimit} GB limit`}
              icon={<HardDrive className="h-5 w-5 text-primary" />}
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
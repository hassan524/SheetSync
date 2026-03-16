import { generateSEO } from "@/lib/seo/metadata";
import { getOrganizationById } from "@/lib/querys/organization/organization";

import DashboardLayout from "@/components/layout/Dashboard-layout";
import { OrgHeader } from "@/components/individual/organization/id/Organization-header";
import { OrgStatCards } from "@/components/individual/organization/id/Organization-stats-card";
import { OrgTablesPanel } from "@/components/individual/organization/id/Organization-tables-panel";
import { OrgActivityPanel } from "@/components/individual/organization/id/Organizaion-activity-panel";
import { OrgBottomStrip } from "@/components/individual/organization/id/Organization-bottom-strip";

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
      description:
        "View and collaborate on spreadsheets inside your organization.",
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
  console.log('param id', id)

  let org: Organization | null = null;
  try {
    org = await getOrganizationById(id);
  } catch (err) {
    console.error("Error fetching organization:", err);
  }

  console.log('Organization', org)

  if (!org) {
    return <div className="p-10 text-center">Organization not found</div>;
  }

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

      <DashboardLayout breadcrumbItems={["Organizations", org.name]}>
        <div className="w-full px-4 md:px-6 py-5 space-y-5">
          <OrgHeader org={org} />
          <OrgStatCards org={org} />

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

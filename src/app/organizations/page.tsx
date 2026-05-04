import { generateSEO } from "@/lib/seo/metadata";
import { getAllOrganizations } from "@/lib/querys/organization/organization";
import DashboardLayout from "@/components/layout/Dashboard-layout";
import StatsRow from "@/components/individual/organization/Stats-row";
import OrganizationList from "@/components/individual/organization/Organization-list";
import { timeAgo } from "@/lib/utils";

export const metadata = generateSEO({
  title: "Organizations | SheetSync",
  description:
    "Manage your organizations, collaborate with teams, and control shared spreadsheets in real-time.",
  path: "/organizations",
  ogImage: "/og/organizations-og.png",
});

// Generate stable storage value outside render using org id as seed
function seededStorage(index: number): number {
  return parseFloat(((((index * 9301 + 49297) % 233280) / 233280) * 4 + 1).toFixed(1));
}

export default async function OrganizationsPage() {
  const organizations = await getAllOrganizations();

  const tableData = organizations.map((org: any, index: number) => ({
    id: `org-${index}`,
    name: org.name,
    role: org.role,
    members: org.membersCount ?? 0,
    sheets: org.sheetsCount ?? 0,
    activeNow: org.activeNow ?? 0,
    storageUsed: seededStorage(index),
    storageLimit: 10,
    lastModified: org.updated_at ? timeAgo(org.updated_at) : "Recently",
    createdAt: org.created_at
      ? new Date(org.created_at).toLocaleDateString()
      : "N/A",
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "SheetSync - Organizations",
    description:
      "Create, manage and collaborate inside team organizations with shared spreadsheets.",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DashboardLayout breadcrumbItems={["SheetSync", "Organizations"]}>
        <div className="max-w-7xl mx-auto space-y-0">
          <StatsRow organizations={organizations} />
          <OrganizationList
            organizations={organizations}
            tableData={tableData}
          />
        </div>
      </DashboardLayout>
    </>
  );
}
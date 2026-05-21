import dynamic from "next/dynamic";
import { generateSEO } from "@/lib/seo/metadata";
import { getAllOrganizations } from "@/lib/querys/organization/organization";
const DashboardLayout = dynamic(
  () => import("@/components/layout/Dashboard-layout"),
);
const StatsRow = dynamic(
  () => import("@/components/individual/organization/Stats-row"),
);
const OrganizationList = dynamic(
  () => import("@/components/individual/organization/Organization-list"),
);
import { timeAgo } from "@/lib/utils";

export const metadata = generateSEO({
  title: "Organizations — Manage Teams",
  description:
    "Manage your organizations, collaborate with teams, and control shared spreadsheets in real-time.",
  path: "/organizations",
  ogImage: "/og/organizations-og.png",
});

export default async function OrganizationsPage() {
  const organizations = await getAllOrganizations();

  const tableData = organizations.map((org: any) => ({
    id: org.id,
    name: org.name,
    role: org.role,
    members: org.membersCount ?? 0,
    sheets: org.sheetsCount ?? 0,
    storageUsed: org.storageUsed ?? 0,
    storageLimit: org.storageLimit ?? 10,
    activeNow: org.activeNow ?? 0,
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


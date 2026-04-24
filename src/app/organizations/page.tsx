import { generateSEO } from "@/lib/seo/metadata";
import { getAllOrganizations } from "@/lib/querys/organization/organization";
import DashboardLayout from "@/components/layout/Dashboard-layout";
import StatsRow from "@/components/individual/organization/Stats-row";
import OrganizationList from "@/components/individual/organization/Organization-list";

export const metadata = generateSEO({
  title: "Organizations | SheetSync",
  description:
    "Manage your organizations, collaborate with teams, and control shared spreadsheets in real-time.",
  path: "/organizations",
  ogImage: "/og/organizations-og.png",
});

export default async function OrganizationsPage() {
  const organizations = await getAllOrganizations();
  console.log("get all organization", organizations);

  // Convert members and sheets arrays to counts for tableData
  const tableData = organizations.map((org: any, index: number) => ({
    id: `org-${index}`,
    name: org.name,
    role: org.role,
    membersCount: org.members.length,  
    sheetsCount: org.sheets.length,     
    activeNow: Math.floor(org.members.length * 0.3),
    storageUsed: Math.random() * 4 + 1,
    storageLimit: 10,
    lastModified: org.lastModified ?? "Recently",
    createdAt: org.createdAt ?? "N/A",
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
        <div className="max-w-7xl mx-auto">
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
import { generateSEO } from "@/lib/seo/metadata";
import { getAllPeople } from "@/lib/querys/people/people";
import DashboardLayout from "@/components/layout/Dashboard-layout";
import PeopleStatsRow from "@/components/individual/people/People-stats-row";
import PeopleList from "@/components/individual/people/People-list";

export const metadata = generateSEO({
  title: "People | SheetSync",
  description:
    "View and manage collaborators across your organizations. Track team activity, invite new members, and oversee access in real-time.",
  path: "/people",
  ogImage: "/og/people-og.png",
});

export default async function PeoplePage() {
  const { people, organizations } = await getAllPeople();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "SheetSync - People",
    description:
      "View and manage collaborators across your organizations with real-time activity tracking.",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DashboardLayout breadcrumbItems={["SheetSync", "People"]}>
        <div className="max-w-7xl mx-auto">
          <PeopleStatsRow people={people} organizations={organizations} />
          <PeopleList people={people} organizations={organizations} />
        </div>
      </DashboardLayout>
    </>
  );
}

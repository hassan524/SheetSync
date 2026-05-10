import { Metadata } from "next";
import dynamic from "next/dynamic";
import GlobalLoader from "@/components/common/Global-loader";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Sheet ${id} - Collaborative Spreadsheet`,
    description: "Real-time collaborative spreadsheet editor",
  };
}

const SheetClient = dynamic(
  () => import("@/components/individual/sheet/Sheet-client"),
  { loading: () => <GlobalLoader /> },
);

export default async function SheetPage({ params }: PageProps) {
  const { id } = await params;

  return <SheetClient  />;
}
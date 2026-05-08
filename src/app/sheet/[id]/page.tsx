// app/sheet/[id]/page.tsx
import { Metadata } from "next";
import dynamic from "next/dynamic";
import GlobalLoader from "@/components/common/Global-loader";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return {
    title: "Sheet - Collaborative Spreadsheet",
    description: "Real-time collaborative spreadsheet editor",
  };
}

const SheetClient = dynamic(
  () => import("@/components/individual/sheet/Sheet-client"),
  { loading: () => <GlobalLoader /> },
);

export default function SheetPage() {
  return <SheetClient />;
}

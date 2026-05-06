// app/sheets/[id]/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import SheetClient from "@/components/individual/sheet/Sheet-client";
import { Loader2 } from "lucide-react";

// SEO metadata
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

import GlobalLoader from "@/components/common/Global-loader";

// Loading fallback component
function SheetLoading() {
  return <GlobalLoader />;
}

// Server component
export default function SheetPage() {
  return (
    <Suspense fallback={<SheetLoading />}>
      <SheetClient />
    </Suspense>
  );
}

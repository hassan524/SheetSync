// app/sheets/[id]/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import SheetClient from "@/components/individual/sheets/Sheet-client";
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

// Loading fallback component
function SheetLoading() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <p className="text-sm text-gray-600">Loading sheet...</p>
      </div>
    </div>
  );
}

// Server component
export default function SheetPage() {
  return (
    <Suspense fallback={<SheetLoading />}>
      <SheetClient />
    </Suspense>
  );
}

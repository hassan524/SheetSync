import Link from "next/link";
import { FileSpreadsheet, Home, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 – Page Not Found | SheetSync",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex flex-col items-center gap-6 max-w-md">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileSpreadsheet className="w-10 h-10 text-primary" />
          </div>
          <span className="absolute -top-2 -right-2 text-3xl font-black text-primary/20">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            This sheet seems to have gone missing. It may have been moved,
            deleted, or you might not have permission to view it.
          </p>
        </div>

        <nav className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto" aria-label="Error recovery navigation">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-background text-foreground font-semibold text-sm hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </nav>

        <p className="text-xs text-muted-foreground">
          Error code: 404 · SheetSync
        </p>
      </div>
    </main>
  );
}


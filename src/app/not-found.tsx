import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 – Page Not Found | SheetSync",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <svg
          width="150"
          height="150"
          viewBox="0 0 150 150"
          fill="none"
          className="mx-auto mb-8 text-gray-300 dark:text-gray-700"
        >
          <rect x="15" y="15" width="120" height="120" rx="12" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="45" cy="45" r="8" fill="currentColor" />
          <circle cx="105" cy="45" r="8" fill="currentColor" />
          <path d="M 45 80 Q 75 110 105 80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <h1 className="text-5xl font-bold text-foreground mb-2">404</h1>
        <p className="text-lg text-muted-foreground">Page not found</p>
      </div>
    </main>
  );
}


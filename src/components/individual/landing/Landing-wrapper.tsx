"use client";

import dynamic from "next/dynamic";

const LandingClient = dynamic(
  () => import("@/components/individual/landing/Landing-client"),
  { ssr: false }
);

export default function LandingWrapper() {
  return <LandingClient />;
}
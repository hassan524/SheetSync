"use client";

import { useEffect } from "react";
import { trackOrganizationActive } from "@/lib/querys/organization/track-active";

interface TrackActiveProps {
  organizationId: string;
}

export function TrackActive({ organizationId }: TrackActiveProps) {
  useEffect(() => {
    // Mark as online when entering
    trackOrganizationActive(organizationId);

    // Keep presence fresh while the organization page is open.
    const interval = setInterval(
      () => {
        trackOrganizationActive(organizationId);
      },
      60 * 1000,
    );

    return () => {
      clearInterval(interval);
    };
  }, [organizationId]);

  return null;
}


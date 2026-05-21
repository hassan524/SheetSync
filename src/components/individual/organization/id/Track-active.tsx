"use client";

import { useEffect } from "react";
import {
  trackOrganizationActive,
  trackOrganizationOffline,
} from "@/lib/querys/organization/track-active";

interface TrackActiveProps {
  organizationId: string;
}

export function TrackActive({ organizationId }: TrackActiveProps) {
  useEffect(() => {
    // Mark as online when entering
    trackOrganizationActive(organizationId);

    // Optional ping every 5 minutes to keep active
    const interval = setInterval(
      () => {
        trackOrganizationActive(organizationId);
      },
      5 * 60 * 1000,
    );

    // Mark as offline when unmounting/leaving
    return () => {
      clearInterval(interval);
      trackOrganizationOffline(organizationId);
    };
  }, [organizationId]);

  return null;
}


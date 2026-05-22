"use client";

import { useRouter } from "next/navigation";
import { RefObject } from "react";

export function useSheetTransition() {
  const router = useRouter();

  const openSheet = (
    id: string,
    templateId: string,
    cardRef: RefObject<HTMLElement | null>,
    isOrganization: boolean = false,
  ) => {
    const url = isOrganization
      ? `/sheet/${id}?template=${templateId}&org=true`
      : `/sheet/${id}?template=${templateId}`;

    router.push(url);
  };

  return { openSheet };
}


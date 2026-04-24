"use client";

import { useEffect, useState } from "react";

export default function SheetTransitionLoader() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // fast start — jump to 30% immediately
    setTimeout(() => setWidth(30), 50);
    // slow crawl to 85% — waits for page
    setTimeout(() => setWidth(85), 400);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        zIndex: 99999,
        background: "transparent",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          background: "#16a34a",
          transition: width === 30
            ? "width 0.2s ease-out"
            : width === 85
            ? "width 2s cubic-bezier(0.1, 0.05, 0, 1)"
            : "width 0.15s ease-out",
          boxShadow: "0 0 8px rgba(22,163,74,0.6)",
        }}
      />
    </div>
  );
}
import React from "react";

export default function GlobalLoader({
  fullScreen = true,
}: {
  fullScreen?: boolean;
}) {
  return (
    <div
      className={`${
        fullScreen
          ? "fixed inset-0 z-[100] bg-background"
          : "w-full h-full min-h-[400px]"
      } flex items-center justify-center`}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}

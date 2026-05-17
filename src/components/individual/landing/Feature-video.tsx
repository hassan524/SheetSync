"use client";

import React from "react";
import { Play } from "lucide-react";

interface FeatureVideoProps {
  title: string;
  gradientFrom: string;
  gradientTo: string;
  icon: React.ElementType;
  onPlay: () => void;
}

const FeatureVideo = ({
  title,
  gradientFrom,
  gradientTo,
  icon: Icon,
  onPlay,
}: FeatureVideoProps) => {
  return (
    <button
      onClick={onPlay}
      className="group relative w-full rounded-2xl overflow-hidden shadow-xl border border-white/10 focus:outline-none"
      style={{ aspectRatio: "16/10" }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo}`}
      />
      <div className="absolute inset-0 opacity-[0.07] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15">
        <div className="h-full w-2/5 bg-white/50 rounded-full" />
      </div>
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
        <span className="text-white/75 text-xs font-medium truncate">
          {title}
        </span>
        <span className="text-white/50 text-[11px] ml-2 shrink-0">2:30</span>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
        <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
          <Icon className="h-7 w-7 text-white/80" />
        </div>
        <div className="h-14 w-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-200 shadow-xl">
          <Play className="h-6 w-6 text-white ml-0.5" fill="white" />
        </div>
      </div>
      <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
        <span className="text-white text-[10px] font-medium">Live demo</span>
      </div>
    </button>
  );
};

export default FeatureVideo;

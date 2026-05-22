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
      className="group relative w-full rounded-3xl overflow-hidden shadow-2xl border border-gray-200 focus:outline-none transition-all hover:shadow-3xl"
      style={{ aspectRatio: "16/10" }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo}`}
      />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />

      {/* Play button area */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
        <div className="h-16 w-16 rounded-2xl bg-white/10 border-2 border-white/30 flex items-center justify-center backdrop-blur-sm">
          <Icon className="h-8 w-8 text-white/90" />
        </div>
        <div className="h-16 w-16 rounded-full bg-white/20 border-3 border-white/50 flex items-center justify-center group-hover:bg-white/30 group-hover:scale-125 transition-all duration-300 shadow-2xl cursor-pointer">
          <Play className="h-7 w-7 text-white ml-0.5" fill="white" />
        </div>
      </div>

      {/* Title badge at bottom */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
        <span className="text-white/90 text-sm font-semibold truncate">
          {title}
        </span>
        <span className="text-white/60 text-xs ml-2 flex-shrink-0">Demo</span>
      </div>

      {/* Live indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-red-400/50">
        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
        <span className="text-white text-xs font-bold">Live</span>
      </div>
    </button>
  );
};

export default FeatureVideo;


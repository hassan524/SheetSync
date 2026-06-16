"use client";

import React from "react";
import Image from "next/image";

interface FeatureImageProps {
  title: string;
  gradientFrom: string;
  gradientTo: string;
  icon: React.ElementType;
  image: string;
}

const FeatureImage = ({
  title,
  gradientFrom,
  gradientTo,
  icon: Icon,
  image,
}: FeatureImageProps) => {
  return (
    <div className="group relative w-full rounded-2xl overflow-hidden shadow-xl border border-gray-100/80 hover:shadow-2xl transition-all duration-500">
      {/* Gradient header bar */}
      <div
        className={`flex items-center gap-3 px-5 py-3 bg-gradient-to-r ${gradientFrom} ${gradientTo}`}
      >
        <div className="h-8 w-8 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center">
          <Icon className="h-4 w-4 text-white/90" />
        </div>
        <span className="text-white/90 text-sm font-semibold truncate">
          {title}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/60 text-[11px] font-medium">Live</span>
        </div>
      </div>

      {/* Image */}
      <div className="relative w-full bg-white" style={{ aspectRatio: "16/10" }}>
        <Image
          src={image}
          alt={`${title} — SheetSync feature`}
          fill
          className="object-cover object-top group-hover:scale-[1.02] transition-transform duration-700 ease-out"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {/* Subtle overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </div>
  );
};

export default FeatureImage;

interface GridBackgroundProps {
  variant?: "default" | "dots" | "lines" | "cells";
  className?: string;
}

const GridBackground = ({
  variant = "default",
  className = "",
}: GridBackgroundProps) => {
  const patterns = {
    default: (
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid-default"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-default)" />
      </svg>
    ),
    dots: (
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid-dots"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.15" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-dots)" />
      </svg>
    ),
    lines: (
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid-lines"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 0 40 L 40 0 M -10 10 L 10 -10 M 30 50 L 50 30"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.08"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-lines)" />
      </svg>
    ),
    cells: (
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid-cells"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0"
              y="0"
              width="10"
              height="10"
              fill="currentColor"
              opacity="0.03"
              rx="1"
            />
            <rect
              x="12"
              y="12"
              width="10"
              height="10"
              fill="currentColor"
              opacity="0.05"
              rx="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-cells)" />
      </svg>
    ),
  };

  return (
    <div
      className={`absolute inset-0 text-primary pointer-events-none ${className}`}
    >
      {patterns[variant]}
    </div>
  );
};

export default GridBackground;

'use client'

import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

interface BreadcrumbProps {
  items: string[];
}

const Breadcrumb = ({ items }: BreadcrumbProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center py-4">
      <nav
        className={`flex items-center space-x-1 text-sm transition-all duration-500 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        {items.map((item, index) => (
          <span key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
            )}
            <span
              className={`transition-all duration-300 ${
                index === items.length - 1
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground cursor-pointer"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {item}
            </span>
          </span>
        ))}
      </nav>
    </div>
  );
};

export default Breadcrumb;

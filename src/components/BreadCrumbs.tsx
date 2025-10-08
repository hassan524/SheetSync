import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "./ui/breadcrumb";

const BreadCrumbs = () => {
  const [active, setActive] = useState("Spreadsheet 3");

  const items = ["Workspace", "Folder 2", "Spreadsheet 3"];

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-sm text-gray-600 font-medium">
        {items.map((item, index) => (
          <div className="flex items-center gap-2" key={item}>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <span
                  onClick={() => setActive(item)}
                  className={`text-lg transition cursor-pointer ${
                    active === item
                      ? "text-gray-900"
                      : "hover:text-black opacity-[0.7]"
                  }`}
                >
                  {item}
                </span>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {index !== items.length - 1 && (
              <BreadcrumbSeparator className="text-4xl" />
            )}
          </div>
        ))}

        <BreadcrumbEllipsis className="size-6 hover:text-black transition opacity-[0.7] cursor-pointer" />
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadCrumbs;

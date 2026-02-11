'use client'

import React, { useState } from "react";

const TableFooter = () => {
  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { key: "all", label: "all orders" },
    { key: "pending", label: "pending" },
    { key: "reviewed", label: "reviewed" },
    { key: "arrived", label: "arrived" },
    { key: "add", label: <i className="bi bi-plus-lg"></i> },
  ];

  return (
    <div className="w-full h-[10vh] fixed bottom-0 left-0 pt-2 flex gap-2 items-center bg-white">
      <div className="w-[4vw] capitalize flex items-center justify-center py-3 px-2"></div>

      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <div
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`capitalize flex items-center justify-center py-3 px-4 cursor-pointer border-t 
              ${isActive ? "bg-[#E8F0E9] border-[#4B6A4F]" : "border-transparent"}
            `}
          >
            {tab.label}
          </div>
        );
      })}
    </div>
  );
};

export default TableFooter;

'use client'

import React from "react";
import Header from "@/components/Header";
import Tables from "@/components/TanStackTable";

const Spreadsheet = () => {

  React.useEffect(() => {
    
    const body = document.querySelector("body");

    if (body) {
      body.style.overflowY = "hidden";
    }

    return () => {
      if (body) {
        body.style.overflowY = "auto";
      }
    };
  }, []);

  return (
    <div>
      <Header /> 
      <Tables />
    </div>
  );
};

export default Spreadsheet;

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

import columns from "../utils/columnts";
import { data } from "../utils/table";
import SubHeader from "./SubHeader";
import { getCellStyle } from "../constants/tablestyle";
import type { ColumnWithExtras } from "@/utils/columnTypes";

type TableData = (typeof data)[number];

const Tables = () => {
  const table = useReactTable<TableData>({
    data, 
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const statusBgMap: Record<string, string> = {
    "In Process": "#FFF3D6",
    Complete: "#D3F2E3",
    Blocked: "#FFE1DE",
    "Need to Start": "#E2E8F0",
    Active: "#E1F3FF",
    Inactive: "#F2F2F2",
  };

  const statusTextColorMap: Record<string, string> = {
    "In Process": "#8C6D18",
    Complete: "#155724",
    Blocked: "#721c24",
    "Need to Start": "#2D3748",
    Active: "#004085",
    Inactive: "#6C757D",
  };

  const priorityTextColorMap: Record<string, string> = {
    High: "#EF4D44",
    Medium: "#C29210",
    Low: "#1A8CFF",
  };

  return (
    <SimpleBar className="h-[70vh] min-w-full font-sans" autoHide={true}>
      <div className="min-w-[1000px]">
        {/* <SubHeader />  */}

        {/* Table Headers */}
        <div className="w-max min-w-full">
          <div className="flex font-semibold text-sm">
            {table.getHeaderGroups().map((headerGroup) =>
              headerGroup.headers.map((header) => {
                const columnDef = header.column.columnDef as ColumnWithExtras;
                const key = columnDef.accessorKey ?? header.column.id;

                return (
                  <div
                    key={header.id}
                    className={`flex items-center ${
                      columnDef.header === "#"
                        ? "justify-center text-xl text-[#856404]"
                        : "justify-between"
                    }`}
                    style={{
                      ...getCellStyle(key),
                      background: columnDef.background || "#FFFFFF",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                      {columnDef.icon && (
                        <i className={`${columnDef.icon} text-[#A3ACA4]`} />
                      )}
                      <span className="text-[#666C66] cursor-pointer">
                        {flexRender(columnDef.header, header.getContext())}
                      </span>
                    </div>
                    {columnDef.icon2 && (
                      <i className={`${columnDef.icon2} text-[#A3ACA4]`} />
                    )}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        {/* Table Rows */}
        {table.getRowModel().rows.map((row) => (
          <div
            key={row.id}
            className="flex text-black hover:bg-gray-50 text-sm"
          >
            {row.getVisibleCells().map((cell) => {
              const columnDef = cell.column.columnDef as ColumnWithExtras;
              const key = columnDef.accessorKey ?? cell.column.id;
              const cellValue = cell.getValue();

              return (
                <div
                  key={cell.id}
                  className="flex items-center px-2"
                  style={{
                    ...getCellStyle(key),
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",

                    ...(key === "Priority" && {
                      justifyContent: "center",
                      fontWeight: "bold",
                      color: priorityTextColorMap[String(cellValue)] || "#000",
                    }),

                    ...(key === "Submitted" && {
                      justifyContent: "end",
                    }),

                    ...(key === "Due Date" && {
                      justifyContent: "end",
                    }),

                    ...(key === "Ext. Value" && {
                      justifyContent: "end",
                    }),

                    ...(key === "Status" && {
                      justifyContent: "center",
                    }),

                    ...(key === "rowIndex" && {
                      justifyContent: "center",
                      color: "#757575",
                    }),

                    ...(key === "URL" && {
                      padding: "0 5px",
                    }),
                  }}
                >
                  {key === "Status" ? (
                    <span
                      style={{
                        padding: "3px 15px",
                        borderRadius: "15px",
                        backgroundColor:
                          statusBgMap[String(cellValue)] || "#FFFFFF",
                        color: statusTextColorMap[String(cellValue)] || "#333",
                        fontWeight: 500,
                        fontSize: "13px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "100%",
                      }}
                    >
                      {String(cellValue)}
                    </span>
                  ) : key === "URL" ? (
                    <a
                      href={String(cellValue)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                      style={{
                        display: "inline-block",
                        maxWidth: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {String(cellValue)}
                    </a>
                  ) : (
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "inline-block",
                        maxWidth: "100%",
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </SimpleBar>
  );
};

export default Tables;

"use client";

import { Sheet } from "@/types";
import SheetCard from "@/components/sheets/Sheet-card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FolderOpen, Plus } from "lucide-react";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { DataTable } from "@/components/common/Data-table";
import { sheetAction, NoSheetsIcon, sheetColumns } from "@/data/tables/personalSheets/personalTableColumns";

interface Props {
  sheets: Sheet[];
  viewMode: "grid" | "table";
  searchQuery: string;
  folderName: string;
  onNewSheet: () => void;
}

const hashId = (str: string) => str.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

const getMockMeta = (id: string) => {
  const h = hashId(id);
  const rows = 50 + (h % 950);
  const cols = 4 + (h % 20);
  return {
    rows,
    cols,
    fileSizeKb: Math.round(rows * cols * 0.08),
    fillPercent: 30 + (h % 65),
  };
};

const getTag = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("budget") || t.includes("revenue") || t.includes("finance")) return "Finance";
  if (t.includes("churn") || t.includes("analytics") || t.includes("data")) return "Analytics";
  if (t.includes("marketing") || t.includes("spend") || t.includes("campaign")) return "Marketing";
  if (t.includes("headcount") || t.includes("hr") || t.includes("hiring")) return "HR";
  if (t.includes("inventory") || t.includes("stock") || t.includes("ops")) return "Ops";
  if (t.includes("sales") || t.includes("revenue") || t.includes("deal")) return "Sales";
  if (t.includes("product") || t.includes("roadmap") || t.includes("feature")) return "Product";
  return "General";
};

const SheetsGrid = ({ sheets, viewMode, searchQuery, folderName, onNewSheet }: Props) => {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between my-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium text-muted-foreground">{folderName}</h2>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {sheets.length}
          </span>
        </div>
      </div>

      {sheets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 rounded-xl border-2 border-dashed border-border bg-muted/10">
          <div className="h-14 w-14 rounded-xl bg-muted/40 flex items-center justify-center mb-4">
            <FileSpreadsheet className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="font-medium">
            {searchQuery ? "No results found" : "This folder is empty"}
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
            {searchQuery ? "Try a different search term" : "Create a new sheet"}
          </p>
          {!searchQuery && (
            <Button size="sm" onClick={onNewSheet}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Sheet
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sheets.map((sheet, index) => {
            const lastEdited = sheet.updated_at
              ? formatDistanceToNowStrict(parseISO(sheet.updated_at), { addSuffix: true })
              : "—";
            const { rows, cols, fileSizeKb, fillPercent } = getMockMeta(sheet.id);

            return (
              <div
                key={sheet.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-scale-in"
              >
                <SheetCard
                id={sheet.id}
                  title={sheet.title}
                  lastEdited={lastEdited}
                  isStarred={sheet.is_starred}
                  rows={rows}
                  cols={cols}
                  fileSizeKb={fileSizeKb}
                  fillPercent={fillPercent}
                  tag={getTag(sheet.title)}
                  templateId={sheet.template_id ?? undefined}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <DataTable
          columns={sheetColumns}
          rows={sheets}
          getKey={(s) => s.id}
          action={sheetAction}
          emptyText="No sheets yet"
          emptyDescription="Sheets in this folder will appear here."
          emptyIcon={<NoSheetsIcon />}
        />
      )}
    </div>
  );
};

export default SheetsGrid;
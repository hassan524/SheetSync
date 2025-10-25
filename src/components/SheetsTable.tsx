"use client"
import { FileSpreadsheet } from "lucide-react"
import { Empty } from "@/components/ui/empty"

interface Sheet {
  id: string
  title: string
  updatedAt: string
  orgId?: string
}

interface SeparateSheetsTableProps {
  sheets: Sheet[]
  onSheetClick?: (sheet: Sheet) => void
  emptyTitle?: string
  emptyDescription?: string
}

export default function SeparateSheetsTable({
  sheets,
  onSheetClick,
  emptyTitle = "No sheets found",
  emptyDescription = "Try adjusting your search or create a new one.",
}: SeparateSheetsTableProps) {
  if (!sheets.length) return <Empty title={emptyTitle} description={emptyDescription} />

  return (
    <div className="overflow-hidden flex flex-col gap-4">
      {sheets.map((s) => (
        <div
          key={s.id}
          className="border-b border-l-4 border-l-green-400 h-12 hover:bg-muted/40 cursor-pointer transition-colors flex items-center px-4 gap-3"
          onClick={() => onSheetClick?.(s)}
        >
          <FileSpreadsheet className="size-5 text-primary" />
          <div className="flex-1 flex items-center justify-between gap-4">
            <span className="line-clamp-1 font-medium w-[55%]">{s.title}</span>
            <span className="text-primary w-[25%]">me</span>
            <span className="text-right text-muted-foreground w-[20%]">
              {new Date(s.updatedAt).toLocaleString([], {
                hour: "numeric",
                minute: "2-digit",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

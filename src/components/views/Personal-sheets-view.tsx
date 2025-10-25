"use client"

import * as React from "react"
import {
  Search,
  ShieldPlus as SheetPlus,
  Target,
  CheckSquare,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup } from "@/components/ui/input-group"
import type { TemplateInterface } from "@/types/template"
import Template from "../Template"
import SeparateSheetsTable from "../SheetsTable"
import CreateSheet from "../CreateSheet"

interface Sheet {
  id: string
  title: string
  updatedAt: string
  orgId?: string
  description?: string
  template?: string
}

const INITIAL_SHEETS: Sheet[] = [
  { id: "1", title: "Budget Q4", updatedAt: new Date().toISOString() },
  { id: "2", title: "Roadmap 2026", updatedAt: new Date().toISOString() },
  { id: "3", title: "Hiring Plan", updatedAt: new Date().toISOString() },
  { id: "4", title: "Project Tracker", updatedAt: new Date().toISOString() },
]

export function PersonalSheetsView({ onSheetClick }) {
  const [sheets, setSheets] = React.useState<Sheet[]>(INITIAL_SHEETS)
  const [query, setQuery] = React.useState("")

  // Filter sheets by search
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sheets.filter((s) => !s.orgId)
    return sheets.filter((s) => !s.orgId && s.title.toLowerCase().includes(q))
  }, [sheets, query])


  return (
    <section className="w-full px-6 md:px-8 py-6 space-y-8">
      {/* Templates Section */}
      <div className="space-y-3">
        <div className="text-md font-medium text-muted-foreground">Start a new spreadsheet</div>
        <Template
        />
      </div>

      {/* Search + New Sheet */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <InputGroup className="h-10 flex-1">
          <Search className="ml-2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search your sheets"
            className="border-none focus-visible:ring-0"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
        <Button className="h-10">
          <SheetPlus className="mr-2 size-4" />
          New Sheet
        </Button>
      </div>

      {/* Sheets Table */}
      <div className="flex items-center justify-between">
        <h2 className="text-md font-medium text-muted-foreground">Today</h2>
        <div className="hidden md:flex items-center gap-12 pr-2 text-xs text-muted-foreground">
          <span className="text-sm">Owned by anyone</span>
          <span className="text-sm">Last opened by me</span>
        </div>
      </div>

      <SeparateSheetsTable sheets={filtered} onSheetClick={onSheetClick} />

      {/* Create Spreadsheet Dialog */}
      <CreateSheet
      />
    </section>
  )
}

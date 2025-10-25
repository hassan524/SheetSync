"use client"

import * as React from "react"
import { Building2, FolderPlus, Search, Users, ShieldPlus as SheetPlus, Target, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup } from "@/components/ui/input-group"
import { Empty } from "@/components/ui/empty"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import Template from "../Template"
import SeparateSheetsTable from "../SheetsTable"
import type { TemplateInterface } from "@/types/template"

interface Sheet {
  id: string
  title: string
  updatedAt: string
  orgId?: string
}

const INITIAL_ORGS = [
  { id: "1", name: "Engineering", updatedAt: new Date().toISOString() },
  { id: "2", name: "Growth Team", updatedAt: new Date().toISOString() },
  { id: "3", name: "Design", updatedAt: new Date().toISOString() },
]

const INITIAL_SHEETS = [
  { id: "1", title: "OKRs", updatedAt: new Date().toISOString(), orgId: "1" },
  { id: "2", title: "Sprint Board", updatedAt: new Date().toISOString(), orgId: "1" },
  { id: "3", title: "Campaign Calendar", updatedAt: new Date().toISOString(), orgId: "2" },
  { id: "4", title: "Marketing Plan", updatedAt: new Date().toISOString(), orgId: "2" },
]

export function OrganizationsView({ onSheetClick }: { onSheetClick?: (sheet: Sheet) => void }) {
  const [organizations, setOrganizations] = React.useState(INITIAL_ORGS)
  const [sheets, setSheets] = React.useState(INITIAL_SHEETS)
  const [orgQuery, setOrgQuery] = React.useState("")
  const [selectedOrgId, setSelectedOrgId] = React.useState<string | null>(INITIAL_ORGS[0]?.id ?? null)
  const [newOrgOpen, setNewOrgOpen] = React.useState(false)
  const [newOrgName, setNewOrgName] = React.useState("")

  const orgs = organizations.filter((o) => o.name.toLowerCase().includes(orgQuery.toLowerCase()))
  const selectedOrg = organizations.find((o) => o.id === selectedOrgId) || null
  const orgSheets = selectedOrg ? sheets.filter((s) => s.orgId === selectedOrg.id) : []

  const Templates: TemplateInterface[] = [
    { title: "Project Tracker", description: "Track tasks & milestones", icon: Target, bgColor: "bg-blue-100" },
    { title: "To-Do List", description: "Track tasks and deadlines", icon: CheckSquare, bgColor: "bg-yellow-100" },
     { title: "Team Directory", description: "Contact information", icon: Users, bgColor: "bg-purple-100" },
  ]

  return (
    <section className="w-full px-6 md:px-8 py-6 space-y-4">
      {/* Search + New Org */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <InputGroup className="h-10 flex-1">
          <Search className="ml-2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations"
            className="border-none focus-visible:ring-0"
            value={orgQuery}
            onChange={(e) => setOrgQuery(e.target.value)}
          />
        </InputGroup>

        <Dialog open={newOrgOpen} onOpenChange={setNewOrgOpen}>
          <DialogTrigger asChild>
            <Button className="h-10">
              <FolderPlus className="mr-2 size-4" />
              New Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create organization</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Organization name"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && newOrgName && setNewOrgOpen(false)}
            />
            <DialogFooter>
              <Button variant="secondary" onClick={() => setNewOrgOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setNewOrgOpen(false)}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organization Cards - Added fixed height container with scrolling to show 3 cards at a time */}
      {orgs.length === 0 ? (
        <Empty title="No organizations" description="Create an organization to group sheets with your team." />
      ) : (
        <div className=" pr-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((org) => {
              const isSelected = org.id === selectedOrgId
              return (
                <div
                  key={org.id}
                  onClick={() => setSelectedOrgId(org.id)}
                  className={`cursor-pointer rounded-lg border transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${isSelected ? "bg-emerald-50/50 border-emerald-200" : "bg-card border-border hover:bg-emerald-50/30"
                    }`}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`rounded-lg p-2.5 ${isSelected ? "bg-emerald-100" : "bg-muted/50"}`}>
                        <Building2 className={`w-5 h-5 ${isSelected ? "text-emerald-600" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{org.name}</h3>
                        <div
                          className={`flex items-center gap-1 text-xs ${isSelected ? "text-emerald-600" : "text-muted-foreground"}`}
                        >
                          <Users className="w-3 h-3" />
                          <span>{Math.floor(Math.random() * 20) + 5} members</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 text-xs pt-3 border-t border-border/50 ${isSelected ? "text-emerald-600" : "text-muted-foreground"}`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>
                        Updated{" "}
                        {new Date(org.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sheets Section */}
      {selectedOrg && (
        <>
          <div className="space-y-3">
            <div className="text-md font-medium text-muted-foreground">
              Start a new spreadsheet in {selectedOrg.name}
            </div>
            <Template templates={Templates} />
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <InputGroup className="h-10">
              <Search className="ml-2 size-4 text-muted-foreground" />
              <Input placeholder="Search your sheets" className="border-none focus-visible:ring-0" />
            </InputGroup>
            <Button className="h-10">
              <SheetPlus className="mr-2 size-4" />
              New Sheet
            </Button>
          </div>

          <SeparateSheetsTable
            sheets={orgSheets}
            onSheetClick={onSheetClick}
            emptyTitle="No sheets yet"
            emptyDescription="Create your first sheet in this organization."
          />
        </>
      )}
    </section>
  )
}

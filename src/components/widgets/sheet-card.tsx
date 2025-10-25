"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useSheetsStore } from "@/lib/sheets-store"
import useSWR from "swr"
import type { Sheet } from "../widgets/types"

export function SheetCard({ sheet }: { sheet: Sheet }) {
  const { toast } = useToast()
  const store = useSheetsStore()
  const { data, mutate } = useSWR("sheetsync-data", store.fetcher, {
    fallbackData: store.initial,
    revalidateOnFocus: false,
  })

  const [renameOpen, setRenameOpen] = React.useState(false)
  const [name, setName] = React.useState(sheet.title)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  function onOpen() {
    toast({
      title: "Opening sheet",
      description: "This is a demo. Wire this to your sheet route.",
    })
  }

  function onRename() {
    if (!name.trim()) return
    mutate(store.renameSheet(sheet.id, name.trim()), {
      optimisticData: store.optimistic(data, (d) => ({
        ...d,
        sheets: d.sheets.map((s) =>
          s.id === sheet.id ? { ...s, title: name.trim(), updatedAt: new Date().toISOString() } : s,
        ),
      })),
    })
    setRenameOpen(false)
    toast({ title: "Sheet renamed" })
  }

  function onDelete() {
    mutate(store.deleteSheet(sheet.id), {
      optimisticData: store.optimistic(data, (d) => ({
        ...d,
        sheets: d.sheets.filter((s) => s.id !== sheet.id),
      })),
    })
    setConfirmOpen(false)
    toast({ title: "Sheet deleted" })
  }

  return (
    <Card className="group relative overflow-hidden border transition-colors hover:bg-muted/50 animate-in fade-in-50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base leading-tight text-pretty">
            <span className="line-clamp-2">{sheet.title}</span>
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <MoreVertical className="size-4" />
                <span className="sr-only">Sheet actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                <Pencil className="mr-2 size-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirmOpen(true)}>
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
        <div>Modified {new Date(sheet.updatedAt).toLocaleDateString()}</div>
        <Button variant="outline" size="sm" onClick={onOpen} className="transition-all bg-transparent">
          <ExternalLink className="mr-2 size-4" />
          Open
        </Button>
      </CardContent>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename sheet</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this sheet?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

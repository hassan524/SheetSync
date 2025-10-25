"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSheetContext } from "@/context/SheetContext"
import { Templates } from "@/data/templates"
import type { TemplateInterface } from "@/types/template"

const CreateSheet = () => {
  const [showTemplateDropdown, setShowTemplateDropdown] = React.useState(false)

  const {
    isSheetDialogOpen,
    setIsSheetDialogOpen,
    selectedTemplate,
    setSelectedTemplate,
    title,
    setTitle,
    description,
    setDescription,
  } = useSheetContext()

  const isBlank = selectedTemplate?.title === "Blank Sheet"

  const onTemplateSelect = (template: TemplateInterface) => {
    setSelectedTemplate(template)
    setShowTemplateDropdown(false)
  }

  const onCreate = () => {
    console.log("Creating new sheet:", {
      title,
      description,
      template: selectedTemplate?.title,
    })
    setIsSheetDialogOpen(false)
  }

  return (
    <Dialog open={isSheetDialogOpen} onOpenChange={setIsSheetDialogOpen}>
      <DialogContent className="max-w-md rounded-lg border border-gray-200 bg-white shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">Create Sheet</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title input (always editable) */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Sheet Title</label>
            <Input
              placeholder="Enter sheet title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white border-gray-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
            />
          </div>

          {/* Template selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Template</label>

            {isBlank ? (
              <div className="relative">
                <button
                  onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                  className="w-full px-3 py-2 text-left bg-white border border-gray-200 rounded-md flex items-center justify-between hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <span className={selectedTemplate ? "text-gray-900" : "text-gray-500"}>
                    {selectedTemplate?.title || "Select a template"}
                  </span>
                  <ChevronDown className="size-4 text-gray-400" />
                </button>

                {showTemplateDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    {Templates.map((template) => (
                      <button
                        key={template.title}
                        onClick={() => onTemplateSelect(template)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-md last:rounded-b-md ${
                          selectedTemplate?.title === template.title
                            ? "bg-emerald-50 text-emerald-700 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {template.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Input
                value={selectedTemplate?.title || ""}
                disabled
                className="bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Description</label>
            <Textarea
              placeholder="Brief description (max 200 characters)"
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-[120px] resize-none bg-white border-gray-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 whitespace-pre-wrap break-words overflow-y-auto overflow-x-hidden"
              style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
            />
            <div className="text-xs text-muted-foreground text-right mt-1">{description.length}/200</div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="mt-6">
          <Button
            variant="secondary"
            onClick={() => setIsSheetDialogOpen(false)}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={onCreate}
            disabled={!title.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Sheet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateSheet

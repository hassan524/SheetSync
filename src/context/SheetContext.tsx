"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface SheetContextType {
  isSheetDialogOpen: boolean
  setIsSheetDialogOpen: (open: boolean) => void

  selectedTemplate: string | null
  setSelectedTemplate: (template: string | null) => void

  title: string
  setTitle: (title: string) => void

  description: string
  setDescription: (desc: string) => void

  handleTemplateClick: (templateTitle: string) => void
}

const SheetContext = createContext<SheetContextType | undefined>(undefined)

export function SheetProvider({ children }: { children: ReactNode }) {
  const [isSheetDialogOpen, setIsSheetDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const handleTemplateClick = (templateTitle: string) => {
    setSelectedTemplate(templateTitle)
    setIsSheetDialogOpen(true)
    setTitle("")
    setDescription("")
  }

  const value: SheetContextType = {
    isSheetDialogOpen,
    setIsSheetDialogOpen,
    selectedTemplate,
    setSelectedTemplate,
    title,
    setTitle,
    description,
    setDescription,
    handleTemplateClick,
  }

  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>
}

export function useSheetContext() {
  const context = useContext(SheetContext)
  if (!context) throw new Error("useSheetContext must be used within a SheetProvider")
  return context
}

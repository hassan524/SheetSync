import type React from "react"
import { Plus } from "lucide-react"
import { Templates } from "@/data/templates"
import { useSheetContext } from "@/context/SheetContext"
import {
  ShieldPlus as SheetPlus,
} from "lucide-react"

const Template = () => {

      const {
          // isSheetDialogOpen,
          // setIsSheetDialogOpen,
          // setSelectedTemplate,
          // selectedTemplate,
          // title,
          // setTitle,
          // description,
          // setDescription,
          handleTemplateClick
      } = useSheetContext()
  
    const handleBlankClick = () => {
      handleTemplateClick({ title: "Blank Sheet", description: "Start from scratch", icon: SheetPlus, bgColor: "bg-gray-100" })
    }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {/* Blank Sheet */}
      <button
        onClick={handleBlankClick}
        className="group cursor-pointer relative isolate flex flex-col overflow-hidden rounded-lg border-2 border-dashed bg-card transition hover:bg-muted/60"
      >
        <div className="flex aspect-[16/10] items-center justify-center">
          <div className="size-12 rounded-md grid place-items-center bg-primary/10 group-hover:bg-primary/20 transition">
            <Plus className="size-7 text-foreground" />
          </div>
        </div>
        <div className="px-2 py-2">
          <div className="font-semibold text-[13px]">Blank Sheet</div>
          <div className="text-muted-foreground text-sm tracking-wide">Start from scratch</div>
        </div>
      </button>

      {/* Template Cards */}
      {Templates.map((t) => {
        const Icon = t.icon
        return (
          <button
            key={t.title}
            onClick={() => handleTemplateClick?.(t)}
            className="group cursor-pointer relative isolate flex flex-col overflow-hidden rounded-lg border bg-card transition hover:-translate-y-0.5 hover:shadow-md hover:bg-muted/60"
          >
            <div className="flex aspect-[16/10] items-center justify-center">
              <div
                className={`size-12 rounded-md grid place-items-center ${t.bgColor} group-hover:scale-105 transition-transform`}
              >
                <Icon className="size-7 text-gray-700" />
              </div>
            </div>
            <div className="px-2 py-2 text-left">
              <div className="font-semibold text-[13px]">{t.title}</div>
              <div className="text-muted-foreground text-sm tracking-wide line-clamp-1">
                {t.description}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default Template

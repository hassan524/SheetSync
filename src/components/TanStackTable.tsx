"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { AgGridReact } from "ag-grid-react"
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community"
import type { ColDef } from "ag-grid-community"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Eye, ArrowDownUp, Filter } from "lucide-react"
import { useSheetContext } from "@/context/SheetContext"

// Register all AG Grid community modules
ModuleRegistry.registerModules([AllCommunityModule])

// Type for cell formatting
interface CellFormatting {
  bold?: boolean
  italic?: boolean
  fontSize?: number
  textColor?: string
  backgroundColor?: string
}

// Type for spreadsheet data
interface SpreadsheetData {
  cellData: Record<string, string>
  cellFormatting: Record<string, CellFormatting>
  gridConfig: {
    rows: number
    cols: number
  }
}

// Props type for dynamic sheet page
interface SheetPageProps {
  params: { id: string } // id from the route
}

const Spreadsheet = ({ params }: SheetPageProps) => {
  // Sheet ID from the URL params
  const sheetId = params.id

  // Fetch functions from your context (Supabase/Backend)
  const { fetchSingleSheet } = useSheetContext()

  // State for storing the spreadsheet data
  const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetData>({
    cellData: {},
    cellFormatting: {},
    gridConfig: { rows: 50, cols: 26 },
  })

  // State for selected cell and its formatting
  const [selectedCell, setSelectedCell] = useState<string | null>(null)
  const [currentFormatting, setCurrentFormatting] = useState<CellFormatting>({
    bold: false,
    italic: false,
    fontSize: 14,
    textColor: "#000000",
    backgroundColor: "#ffffff",
  })

  // Grid API from AG Grid
  const [gridApi, setGridApi] = useState<any>(null)

  // Track column widths for auto-resize
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})

  // Fetch sheet data when component mounts or sheetId changes
  useEffect(() => {
    const data = fetchSingleSheet(sheetId) // Fetch user's saved sheet data

    // Set the spreadsheet data (use default if empty)
    setSpreadsheetData({
      cellData: data.cell_data || {},
      cellFormatting: data.cell_formatting || {},
      gridConfig: data.grid_config || { rows: 50, cols: 26 },
    })
  }, [sheetId])

  // Helper: calculate width of text for auto column resizing
  const calculateTextWidth = (text: string, fontSize = 14): number => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return text.length * 8
    ctx.font = `${fontSize}px Inter, Arial, sans-serif`
    return Math.ceil(ctx.measureText(text).width) + 32 // add padding
  }

  // Automatically expand column width if text overflows
  const autoExpandColumn = useCallback(
    (colId: string, cellValue: string, fontSize = 14) => {
      const requiredWidth = calculateTextWidth(cellValue, fontSize)
      const currentWidth = columnWidths[colId] || 120

      if (requiredWidth > currentWidth) {
        setColumnWidths((prev) => ({
          ...prev,
          [colId]: requiredWidth,
        }))

        if (gridApi) gridApi.setColumnWidth(colId, requiredWidth)
      }
    },
    [columnWidths, gridApi]
  )

  // Get formatting for a specific cell
  const getCellFormatting = useCallback(
    (cellKey: string): CellFormatting => {
      return spreadsheetData.cellFormatting[cellKey] || {}
    },
    [spreadsheetData.cellFormatting]
  )

  // Update cell data
  const updateCellData = useCallback((cellKey: string, value: string) => {
    setSpreadsheetData((prev) => ({
      ...prev,
      cellData: { ...prev.cellData, [cellKey]: value },
    }))
  }, [])

  // Update cell formatting
  const updateCellFormatting = useCallback(
    (cellKey: string, formatting: Partial<CellFormatting>) => {
      setSpreadsheetData((prev) => ({
        ...prev,
        cellFormatting: {
          ...prev.cellFormatting,
          [cellKey]: {
            ...prev.cellFormatting[cellKey],
            ...formatting,
          },
        },
      }))
    },
    []
  )

  const { rows, cols } = spreadsheetData.gridConfig

  // Prepare column definitions for AG Grid
  const columns: ColDef[] = useMemo(() => {
    return [
      // Row number column (pinned left)
      {
        field: "rowNumber",
        headerName: "",
        width: 50,
        pinned: "left",
        editable: false,
        resizable: false,
        suppressMovable: true,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "500",
          backgroundColor: "#f9fafb",
          color: "#6b7280",
          fontSize: "12px",
          borderRight: "1px solid #e5e7eb",
        },
      },
      // Spreadsheet columns (A-Z)
      ...Array.from({ length: cols }, (_, i) => {
        const colLetter = String.fromCharCode(65 + i)
        return {
          field: colLetter,
          headerName: colLetter,
          width: columnWidths[colLetter] || 120,
          minWidth: 80,
          maxWidth: 500,
          editable: true,
          resizable: true,
          suppressMovable: true,
          cellStyle: (params: any) => {
            const cellKey = `${colLetter}${params.node.rowIndex + 1}`
            const formatting = getCellFormatting(cellKey)
            return {
              display: "flex",
              alignItems: "center",
              fontSize: `${formatting.fontSize || 14}px`,
              fontWeight: formatting.bold ? "600" : "400",
              fontStyle: formatting.italic ? "italic" : "normal",
              color: formatting.textColor || "#111827",
              backgroundColor: formatting.backgroundColor || "#ffffff",
              paddingLeft: "8px",
              paddingRight: "8px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }
          },
          cellClass: (params: any) => {
            const cellKey = `${colLetter}${params.node.rowIndex + 1}`
            return selectedCell === cellKey ? "selected-cell" : ""
          },
        } as ColDef
      }),
    ]
  }, [cols, getCellFormatting, selectedCell, columnWidths])

  // Prepare row data
  const rowData = useMemo(() => {
    return Array.from({ length: rows }, (_, rowIndex) => {
      const row: Record<string, any> = { rowNumber: rowIndex + 1 }
      for (let i = 0; i < cols; i++) {
        const colLetter = String.fromCharCode(65 + i)
        const cellKey = `${colLetter}${rowIndex + 1}`
        row[colLetter] = spreadsheetData.cellData[cellKey] || ""
      }
      return row
    })
  }, [rows, cols, spreadsheetData.cellData])

  // Default column definitions
  const defaultColDef: ColDef = {
    resizable: true,
    sortable: false,
    filter: false,
    singleClickEdit: false,
  }

  // Grid ready callback to store API reference
  const handleGridReady = useCallback((params: any) => {
    setGridApi(params.api)
  }, [])

  // When a cell is clicked
  const handleCellClicked = useCallback(
    (event: any) => {
      if (event.colDef.field === "rowNumber") return

      const colId = event.colDef.field
      const rowIndex = event.node.rowIndex
      const cellKey = `${colId}${rowIndex + 1}`

      if (gridApi) gridApi.stopEditing(false)

      setSelectedCell(cellKey)
      setCurrentFormatting(getCellFormatting(cellKey))
    },
    [gridApi, getCellFormatting]
  )

  // When a cell value changes
  const handleCellValueChanged = useCallback(
    (event: any) => {
      if (event.oldValue === event.newValue) return

      const colId = event.colDef.field
      const rowIndex = event.node.rowIndex
      const cellKey = `${colId}${rowIndex + 1}`

      updateCellData(cellKey, event.newValue || "")

      const fontSize = getCellFormatting(cellKey).fontSize || 14
      autoExpandColumn(colId, event.newValue || "", fontSize)

      if (gridApi) {
        setTimeout(() => {
          gridApi.stopEditing(true)
        }, 0)
      }
    },
    [updateCellData, gridApi, getCellFormatting, autoExpandColumn]
  )

  // Double click starts editing
  const handleCellDoubleClicked = useCallback((event: any) => {
    if (event.colDef.field !== "rowNumber") {
      event.api.startEditingCell({
        rowIndex: event.node.rowIndex,
        colKey: event.colDef.field,
      })
    }
  }, [])

  // Apply formatting (bold, italic, color, font size)
  const applyFormatting = useCallback(
    (newFormatting: Partial<CellFormatting>) => {
      if (!selectedCell) return
      const updatedFormatting = { ...currentFormatting, ...newFormatting }
      setCurrentFormatting(updatedFormatting)
      updateCellFormatting(selectedCell, updatedFormatting)
    },
    [selectedCell, currentFormatting, updateCellFormatting]
  )

  return (
    <div className="w-full h-screen flex flex-col bg-background">
      {/* Header with formatting buttons */}
      <header className="h-14 px-4 flex items-center justify-between gap-4 bg-background border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-sm"
            onClick={() => console.log("Hide fields clicked")}
          >
            <Eye className="w-4 h-4" />
            <span>Hide</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-sm"
            onClick={() => console.log("Sort clicked")}
          >
            <ArrowDownUp className="w-4 h-4" />
            <span>Sort</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-sm"
            onClick={() => console.log("Filter clicked")}
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </Button>
        </div>

        {/* Formatting controls */}
        <div className="flex items-center gap-1">
          <select
            value={currentFormatting.fontSize || 14}
            onChange={(e) =>
              applyFormatting({ fontSize: Number.parseInt(e.target.value) })
            }
            disabled={!selectedCell}
            className="h-8 px-2 text-xs border border-border rounded-md bg-background hover-elevate disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {[10, 12, 14, 16, 18, 20, 24].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>

          <Button
            variant={currentFormatting.bold ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => applyFormatting({ bold: !currentFormatting.bold })}
            disabled={!selectedCell}
          >
            <Bold className="w-4 h-4" />
          </Button>

          <Button
            variant={currentFormatting.italic ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => applyFormatting({ italic: !currentFormatting.italic })}
            disabled={!selectedCell}
          >
            <Italic className="w-4 h-4" />
          </Button>

          <input
            type="color"
            value={currentFormatting.textColor || "#000000"}
            onChange={(e) => applyFormatting({ textColor: e.target.value })}
            disabled={!selectedCell}
            title="Text Color"
            className="w-8 h-8 rounded-md border border-border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed p-1"
          />

          <input
            type="color"
            value={currentFormatting.backgroundColor || "#ffffff"}
            onChange={(e) => applyFormatting({ backgroundColor: e.target.value })}
            disabled={!selectedCell}
            title="Background Color"
            className="w-8 h-8 rounded-md border border-border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed p-1"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => console.log("Share clicked")}
          >
            Share
          </Button>
        </div>
      </header>

      {/* Spreadsheet grid */}
      <div className="h-[calc(100vh-120px)] relative overflow-hidden">
        <div className="absolute inset-0 ag-theme-quartz spreadsheet-container" style={{ overflow: "auto" }}>
          <AgGridReact
            columnDefs={columns}
            rowData={rowData}
            defaultColDef={defaultColDef}
            onGridReady={handleGridReady}
            onCellClicked={handleCellClicked}
            onCellDoubleClicked={handleCellDoubleClicked}
            onCellValueChanged={handleCellValueChanged}
            rowHeight={32}
            headerHeight={40}
            suppressHorizontalScroll={false}
            alwaysShowHorizontalScroll={false}
            alwaysShowVerticalScroll={false}
            domLayout="normal"
          />
        </div>
      </div>

      {/* Scrollbar and AG Grid styling */}
      <style>{`
        .spreadsheet-container {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }

        .spreadsheet-container::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }

        .spreadsheet-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-left: 1px solid #e5e7eb;
          border-top: 1px solid #e5e7eb;
        }

        .spreadsheet-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 0;
          border: 3px solid #f1f5f9;
        }

        .spreadsheet-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .spreadsheet-container::-webkit-scrollbar-corner {
          background: #f1f5f9;
        }

        .ag-theme-quartz .ag-header-cell {
          background-color: #f9fafb;
          border-right: 1px solid #e5e7eb;
          font-weight: 500;
          font-size: 12px;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ag-theme-quartz .ag-cell {
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          line-height: 32px;
        }

        .ag-theme-quartz .selected-cell {
          outline: 2px solid #3b82f6 !important;
          outline-offset: -2px;
          z-index: 1;
        }

        .ag-theme-quartz .ag-cell-inline-editing {
          padding: 0 !important;
          background: white;
          border: 2px solid #3b82f6 !important;
          z-index: 2;
        }

        .ag-theme-quartz .ag-cell-inline-editing input {
          width: 100% !important;
          padding: 6px 8px !important;
          height: 100% !important;
          border: none !important;
          font-size: 14px !important;
          box-sizing: border-box !important;
        }

        .ag-theme-quartz .ag-cell-inline-editing input:focus {
          outline: none;
        }

        .ag-theme-quartz .ag-row-selected {
          background-color: transparent !important;
        }

        .ag-theme-quartz .ag-root-wrapper {
          border: none;
        }

        .ag-theme-quartz {
          --ag-borders: none;
        }
      `}</style>
    </div>
  )
}

export default Spreadsheet

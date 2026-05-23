"use client"

import React from 'react'
import ActivityLogPanel from './ActivityLogPanel'

export default function RowExpandView({ rowId, rowData }: { rowId: string; rowData: Record<string, any> }) {
  return (
    <div className="p-4 space-y-4 bg-white border rounded shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">Row {rowId}</h3>
          <div className="text-sm text-gray-600">Detailed view of the row</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          <div className="p-3 border rounded">
            <h4 className="text-sm font-medium mb-2">Cells</h4>
            <pre className="text-xs text-gray-700">{JSON.stringify(rowData, null, 2)}</pre>
          </div>

        </div>

        <div className="space-y-3">
          <ActivityLogPanel />
        </div>
      </div>
    </div>
  )
}

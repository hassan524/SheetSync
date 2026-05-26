"use client"

import React, { useState } from 'react'
import RowStatusBadge from './RowStatusBadge'
import PinButton from './PinButton'
import RowExpandView from './RowExpandView'
import { RowFeatureMeta } from '../../types/rowFeatures'

export default function RowCard({
  rowId,
  cells,
  meta,
}: {
  rowId: string
  cells: Record<string, any>
  meta?: RowFeatureMeta
}) {
  const [expanded, setExpanded] = useState(false)
  const [pinned, setPinned] = useState(!!meta?.pinned)

  return (
    <div className={`p-3 border-b hover:bg-gray-50 ${meta?.conditionalFormatting?.overdue ? 'bg-red-50' : 'bg-white'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PinButton pinned={pinned} onToggle={() => setPinned((s) => !s)} />
          <div className="flex flex-col">
            <div className="text-sm font-medium">Row {rowId}</div>
            <div className="text-xs text-gray-500">{Object.values(cells).slice(0, 3).join(' • ')}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RowStatusBadge status={meta?.status} />
          <button onClick={() => setExpanded(true)} className="text-sm text-blue-600">Details</button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3">
          <RowExpandView rowId={rowId} rowData={cells} />
          <div className="mt-2 text-right">
            <button onClick={() => setExpanded(false)} className="text-sm text-gray-600">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

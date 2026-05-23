"use client"

import React from 'react'

export default function ConditionalFormatting({ previewOverdue }: { previewOverdue?: boolean }) {
  return (
    <div className="p-3 border rounded">
      <h4 className="text-sm font-medium mb-2">Conditional Formatting (UI)</h4>
      <div className="text-sm text-gray-600 mb-2">Rule: If due date passed → mark row overdue (red)</div>
      <div className="p-3 rounded ${previewOverdue ? 'bg-red-50' : 'bg-white'}">
        <div className={`p-2 rounded ${previewOverdue ? 'bg-red-100 text-red-800' : 'bg-gray-50 text-gray-700'}`}>
          {previewOverdue ? 'Preview: Overdue row (red)' : 'Preview: Normal row'}
        </div>
      </div>
    </div>
  )
}

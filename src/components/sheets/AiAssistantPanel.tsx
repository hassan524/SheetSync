"use client"

import React from 'react'

export default function AiAssistantPanel() {
  const actions = [
    'Create sheet from prompt',
    'Analyze data',
    'Suggest columns',
    'Find duplicates',
    'Summarize table',
    'Generate formulas',
  ]

  return (
    <div className="p-3 border rounded">
      <h4 className="text-sm font-medium mb-2">AI Assistant (Coming Soon)</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {actions.map((a) => (
          <button key={a} className="p-2 border rounded text-sm text-gray-700 text-left bg-gray-50" disabled>
            {a}
          </button>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-500">UI-only for now. Will be wired to an AI backend later.</div>
    </div>
  )
}

"use client"

import React, { useState } from 'react'

export default function FormulaEnginePanel() {
  const [formula, setFormula] = useState('')
  const [result, setResult] = useState<string | number | null>(null)

  function runDummy() {
    // UI-only: provide a fake preview based on keyword
    if (formula.toLowerCase().includes('sum')) setResult(123)
    else if (formula.toLowerCase().includes('avg') || formula.toLowerCase().includes('average')) setResult(12.3)
    else if (formula.toLowerCase().includes('countif')) setResult(4)
    else setResult('—')
  }

  return (
    <div className="p-3 border rounded">
      <h4 className="text-sm font-medium mb-2">Formula & Automation (UI)</h4>
      <div className="flex gap-2">
        <input value={formula} onChange={(e) => setFormula(e.target.value)} placeholder="e.g. =SUM(A:A) or =COUNTIF(...)" className="flex-1 p-2 border rounded text-sm" />
        <button onClick={runDummy} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Run</button>
      </div>

      <div className="mt-3 text-sm">
        <div className="text-xs text-gray-500">Preview result (UI-only):</div>
        <div className="font-mono mt-1">{String(result)}</div>
      </div>
    </div>
  )
}

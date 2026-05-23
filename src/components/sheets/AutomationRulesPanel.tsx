"use client"

import React, { useState } from 'react'

export default function AutomationRulesPanel() {
  const [rules, setRules] = useState([
    { id: 'r1', name: 'Move to archive when date passed', enabled: true },
    { id: 'r2', name: 'Send reminder before due date', enabled: false },
  ])

  return (
    <div className="p-3 border rounded">
      <h4 className="text-sm font-medium mb-2">Automation Rules (UI)</h4>
      <ul className="space-y-2 text-sm">
        {rules.map((r) => (
          <li key={r.id} className="flex items-center justify-between">
            <div>{r.name}</div>
            <div>
              <label className="inline-flex items-center gap-2 text-xs">
                <input type="checkbox" checked={r.enabled} readOnly />
                Enabled
              </label>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 text-xs text-gray-500">Examples: when date passed → move to archive; send reminder X days before.</div>
    </div>
  )
}

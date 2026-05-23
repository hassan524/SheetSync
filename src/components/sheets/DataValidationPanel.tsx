"use client"

import React from 'react'

export default function DataValidationPanel() {
  return (
    <div className="p-3 border rounded">
      <h4 className="text-sm font-medium mb-2">Data Validation (UI)</h4>
      <ul className="text-sm space-y-2">
        <li>Required fields: show visual indicator when empty</li>
        <li>Type checks: text / number / date / email / currency / checkbox</li>
        <li>Min / Max: numeric range checks</li>
        <li>Unique: enforce uniqueness across column (UI hint)</li>
        <li>Dropdown: select allowed values</li>
      </ul>

      <div className="mt-3 text-xs text-gray-500">This panel is UI-only: you can attach rules per column and preview validation states.</div>
    </div>
  )
}

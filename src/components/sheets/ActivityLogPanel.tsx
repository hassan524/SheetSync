"use client"

import React from 'react'

export default function ActivityLogPanel({ entries = [] }: { entries?: { time: string; text: string }[] }) {
  return (
    <div className="p-3 border rounded bg-white shadow-sm max-h-64 overflow-auto">
      <h3 className="text-sm font-semibold mb-2">Activity</h3>
      {entries.length === 0 ? (
        <div className="text-xs text-gray-500">No activity yet.</div>
      ) : (
        <ul className="space-y-2">
          {entries.map((e, i) => (
            <li key={i} className="text-xs">
              <div className="text-gray-600">{e.text}</div>
              <div className="text-[11px] text-gray-400">{e.time}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

"use client"

import React from 'react'

export default function PinButton({ pinned, onToggle }: { pinned?: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`p-1 rounded ${pinned ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}
      aria-pressed={!!pinned}
      title={pinned ? 'Unpin row' : 'Pin row'}
    >
      {pinned ? '📌' : '📍'}
    </button>
  )
}

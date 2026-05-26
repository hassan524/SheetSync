"use client"

import React from 'react'
import { RowStatus } from '../../types/rowFeatures'

export default function RowStatusBadge({ status }: { status?: RowStatus }) {
  const color = status === 'archived' ? 'bg-gray-200 text-gray-700' : status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {status ?? 'active'}
    </span>
  )
}

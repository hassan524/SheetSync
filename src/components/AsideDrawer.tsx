"use client"

import * as React from "react"
import { Info, Clock, User, Lock, Share2, ChevronRight, FileText, Calendar, X } from "lucide-react"

interface Sheet {
  id: string
  title: string
  updatedAt: string
  orgId?: string
}

interface AsideDrawerProps {
  sheet?: Sheet | null
  onClose?: () => void
}

const AsideDrawer = ({ sheet, onClose }: AsideDrawerProps) => {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const createdDate = sheet ? new Date(sheet.updatedAt) : new Date()
  const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div
      className={`w-full h-screen bg-white transition-all duration-700 ease-out overflow-y-auto scrollbar-hide flex flex-col ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
      }`}
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >

      <div className="p-6 space-y-8 flex-1">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500 uppercase tracking-wider">
            <Info className="h-4 w-4" />
            <span>Sheet Info</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{sheet?.title || "No sheet selected"}</h3>
        </div>

        {/* Info Cards */}
        <div className="space-y-3">
          {/* Created */}
          <div
            className="group p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all duration-300 cursor-pointer border border-blue-100/50"
            style={{
              animation: isVisible ? "slideIn 0.5s ease-out 0.1s backwards" : "none",
            }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-blue-700">
                  <Calendar className="h-3.5 w-3.5" />
                  CREATED
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {createdDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
                <div className="text-xs text-gray-500">{daysAgo} days ago</div>
              </div>
              <ChevronRight className="h-4 w-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Last Modified */}
          <div
            className="group p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-all duration-300 cursor-pointer border border-emerald-100/50"
            style={{
              animation: isVisible ? "slideIn 0.5s ease-out 0.2s backwards" : "none",
            }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                  <Clock className="h-3.5 w-3.5" />
                  LAST MODIFIED
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {createdDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </div>
                <div className="text-xs text-gray-500">by you</div>
              </div>
              <ChevronRight className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Owner */}
          <div
            className="group p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 cursor-pointer border border-purple-100/50"
            style={{
              animation: isVisible ? "slideIn 0.5s ease-out 0.3s backwards" : "none",
            }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-purple-700">
                  <User className="h-3.5 w-3.5" />
                  OWNER
                </div>
                <div className="text-sm font-semibold text-gray-900">You</div>
                <div className="text-xs text-gray-500">john@example.com</div>
              </div>
              <ChevronRight className="h-4 w-4 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Sharing Status */}
          <div
            className="group p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-all duration-300 cursor-pointer border border-amber-100/50"
            style={{
              animation: isVisible ? "slideIn 0.5s ease-out 0.4s backwards" : "none",
            }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-amber-700">
                  <Lock className="h-3.5 w-3.5" />
                  SHARING
                </div>
                <div className="text-sm font-semibold text-gray-900">Private</div>
                <div className="text-xs text-gray-500">Only you can access</div>
              </div>
              <ChevronRight className="h-4 w-4 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="space-y-2 pt-4 border-t"
          style={{
            animation: isVisible ? "slideIn 0.5s ease-out 0.5s backwards" : "none",
          }}
        >
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
            <Share2 className="h-4 w-4" />
            Share Sheet
          </button>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-200">
            <FileText className="h-4 w-4" />
            View History
          </button>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-2 gap-3 pt-4"
          style={{
            animation: isVisible ? "slideIn 0.5s ease-out 0.6s backwards" : "none",
          }}
        >
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">24</div>
            <div className="text-xs text-gray-500 mt-0.5">Rows</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">8</div>
            <div className="text-xs text-gray-500 mt-0.5">Columns</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        /* Hide scrollbar for Chrome, Safari and Opera */
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

export default AsideDrawer

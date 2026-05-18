"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface DemoModalProps {
  open: boolean;
  onClose: () => void;
}

const DemoModal = ({ open, onClose }: DemoModalProps) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl bg-black rounded-2xl overflow-hidden shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="aspect-video w-full bg-gray-900">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
            title="SheetSync Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="bg-gray-900 px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-semibold">
              SheetSync — Product Demo
            </p>
            <p className="text-gray-400 text-xs">
              Collaboration · Formulas · Templates · Organizations
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DemoModal;

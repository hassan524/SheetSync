// hooks/useHistory.ts
import { useState, useCallback } from "react";
import { HistoryEntry } from "@/types/sheet.types";

export function useHistory<T>(initialState: T) {
  const [currentState, setCurrentState] = useState<T>(initialState);
  const [history, setHistory] = useState<T[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Add new state to history
  const pushState = useCallback(
    (newState: T) => {
      setHistory((prev) => {
        // Remove any future states if we're not at the end
        const newHistory = prev.slice(0, historyIndex + 1);
        return [...newHistory, newState];
      });
      setHistoryIndex((prev) => prev + 1);
      setCurrentState(newState);
    },
    [historyIndex],
  );

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentState(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentState(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Can undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Reset history
  const resetHistory = useCallback((newState: T) => {
    setHistory([newState]);
    setHistoryIndex(0);
    setCurrentState(newState);
  }, []);

  return {
    currentState,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  };
}

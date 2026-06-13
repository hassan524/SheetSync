import { useState, useCallback, useRef } from "react";
// types are imported from @/types when needed

export function useHistory<T>(initialState: T) {
  const [currentState, setCurrentState] = useState<T>(initialState);
  const [history, setHistory] = useState<T[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const stateRef = useRef<T>(initialState);

  // Add new state to history
  const pushState = useCallback(
    (newState: T) => {
      stateRef.current = newState;
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
      stateRef.current = history[newIndex];
      setHistoryIndex(newIndex);
      setCurrentState(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      stateRef.current = history[newIndex];
      setHistoryIndex(newIndex);
      setCurrentState(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Can undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Reset history
  const resetHistory = useCallback((newState: T) => {
    stateRef.current = newState;
    setHistory([newState]);
    setHistoryIndex(0);
    setCurrentState(newState);
  }, []);

  return {
    currentState,
    stateRef,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  };
}



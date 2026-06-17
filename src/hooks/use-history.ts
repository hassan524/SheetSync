import { useState, useCallback, useRef } from "react";

export function useHistory<T>(initialState: T) {
  const [currentState, setCurrentState] = useState<T>(initialState);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [historyLength, setHistoryLength] = useState(1); // ✅ track length in state

  const stateRef = useRef<T>(initialState);
  const historyIndexRef = useRef(0);
  const historyRef = useRef<T[]>([initialState]);

  const pushState = useCallback((newState: T) => {
    stateRef.current = newState;

    // Cut off redo history
    const newHistory = historyRef.current.slice(
      0,
      historyIndexRef.current + 1
    );

    newHistory.push(newState);

    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;

    setHistoryIndex(historyIndexRef.current);
    setHistoryLength(newHistory.length); // ✅ update length safely
    setCurrentState(newState);
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      const newIndex = historyIndexRef.current - 1;

      historyIndexRef.current = newIndex;
      const prevState = historyRef.current[newIndex];

      stateRef.current = prevState;

      setHistoryIndex(newIndex);
      setCurrentState(prevState);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      const newIndex = historyIndexRef.current + 1;

      historyIndexRef.current = newIndex;
      const nextState = historyRef.current[newIndex];

      stateRef.current = nextState;

      setHistoryIndex(newIndex);
      setCurrentState(nextState);
    }
  }, []);

  const resetHistory = useCallback((newState: T) => {
    stateRef.current = newState;
    historyRef.current = [newState];
    historyIndexRef.current = 0;

    setHistoryIndex(0);
    setHistoryLength(1);
    setCurrentState(newState);
  }, []);

  // ✅ SAFE: only using state, no refs in render
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLength - 1;

  return {
    currentState,
    stateRef, // useful for avoiding stale closures
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  };
}
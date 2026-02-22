"use client";

import { useState, useCallback, useRef } from "react";

interface UseGameTimerOptions {
  answerTimeMs: number;
  onTimeUp: () => void;
}

export function useGameTimer({ answerTimeMs, onTimeUp }: UseGameTimerOptions) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    if (answerTimeMs > 0) {
      setTimeLeft(answerTimeMs / 1000);

      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            onTimeUp();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      timerRef.current = timer;
    }
  }, [answerTimeMs, onTimeUp]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeLeft(null);
  }, []);

  return { timeLeft, startTimer, stopTimer };
}

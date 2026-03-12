"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const GUEST_DAILY_LIMIT = 20;
const FREE_DAILY_LIMIT = 50;
const STORAGE_KEY = 'langdrill_daily_usage';

interface LocalUsage {
  date: string;
  count: number;
}

function getLocalUsage(): LocalUsage {
  if (typeof window === 'undefined') return { date: '', count: 0 };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as LocalUsage;
      const today = new Date().toISOString().split('T')[0];
      if (parsed.date === today) return parsed;
    }
  } catch { /* ignore */ }
  return { date: new Date().toISOString().split('T')[0], count: 0 };
}

function setLocalUsage(usage: LocalUsage) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

export function useUsage() {
  const { user, isPro, isLoading: authLoading } = useAuth();
  const [remaining, setRemaining] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial usage after auth is ready
  useEffect(() => {
    if (authLoading) return;

    if (isPro) {
      setRemaining(-1);
      return;
    }

    if (user) {
      // Logged-in free user: fetch from server
      fetch('/api/usage')
        .then(res => res.json())
        .then(data => setRemaining(data.remaining))
        .catch(() => {});
    } else {
      // Not logged in: use localStorage
      const local = getLocalUsage();
      setRemaining(Math.max(0, GUEST_DAILY_LIMIT - local.count));
    }
  }, [user, isPro, authLoading]);

  const incrementUsage = useCallback(async (): Promise<boolean> => {
    if (isPro) return true;

    setIsLoading(true);
    try {
      if (user) {
        // Server-side tracking
        const res = await fetch('/api/usage', { method: 'POST' });
        const data = await res.json();
        setRemaining(data.remaining);
        return data.canProceed;
      } else {
        // Local tracking
        const local = getLocalUsage();
        if (local.count >= GUEST_DAILY_LIMIT) {
          setRemaining(0);
          return false;
        }
        const updated = { date: local.date, count: local.count + 1 };
        setLocalUsage(updated);
        setRemaining(Math.max(0, GUEST_DAILY_LIMIT - updated.count));
        return true;
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, isPro]);

  return { remaining, isLoading, incrementUsage, limit: FREE_DAILY_LIMIT };
}

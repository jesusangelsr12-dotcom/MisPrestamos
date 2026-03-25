"use client";

import { useState, useCallback, useEffect, useRef } from "react";

const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 30;

interface UsePinReturn {
  setupPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  verifyPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  hasPin: () => Promise<boolean>;
  attempts: number;
  isLocked: boolean;
  lockoutSeconds: number;
}

export function usePin(): UsePinReturn {
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isLocked && lockoutSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setAttempts(0);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLocked, lockoutSeconds]);

  const setupPin = useCallback(
    async (pin: string): Promise<{ success: boolean; error?: string }> => {
      const res = await fetch("/api/pin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        const data = await res.json();
        return { success: false, error: data.error };
      }

      return { success: true };
    },
    []
  );

  const verifyPin = useCallback(
    async (pin: string): Promise<{ success: boolean; error?: string }> => {
      if (isLocked) {
        return { success: false, error: `Bloqueado por ${lockoutSeconds}s` };
      }

      const res = await fetch("/api/pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setLockoutSeconds(LOCKOUT_SECONDS);
        }

        const data = await res.json();
        return { success: false, error: data.error };
      }

      setAttempts(0);
      return { success: true };
    },
    [isLocked, lockoutSeconds, attempts]
  );

  const hasPin = useCallback(async (): Promise<boolean> => {
    const res = await fetch("/api/pin/check");
    if (!res.ok) return false;
    const data = await res.json();
    return data.hasPin;
  }, []);

  return {
    setupPin,
    verifyPin,
    hasPin,
    attempts,
    isLocked,
    lockoutSeconds,
  };
}

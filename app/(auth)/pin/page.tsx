"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PinKeypad } from "@/components/features/PinKeypad";
import { usePin } from "@/lib/hooks/usePin";

export default function PinPage() {
  const router = useRouter();
  const { verifyPin, hasPin, attempts, isLocked, lockoutSeconds } = usePin();
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hasPin().then((exists) => {
      if (!exists) {
        router.replace("/setup-pin");
      } else {
        setReady(true);
      }
    });
  }, [hasPin, router]);

  if (!ready) return null;

  async function handleComplete(pin: string) {
    if (isLocked || loading) return;

    setLoading(true);
    setError("");

    const result = await verifyPin(pin);

    if (result.success) {
      router.push("/dashboard");
      return;
    }

    setError(result.error ?? "PIN incorrecto");
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 pb-safe pt-safe">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center"
      >
        <div className="mb-12 flex flex-col items-center gap-2">
          <h1
            className="font-display text-[36px] font-bold text-[#1A1A1A]"
            style={{ letterSpacing: "-1px" }}
          >
            Cuotas
          </h1>
          <p className="text-[14px] text-[#6B6B6B]">
            Ingresa tu PIN para continuar
          </p>
        </div>

        <PinKeypad
          onComplete={handleComplete}
          shake={shake}
          disabled={isLocked || loading}
        />

        {error && !isLocked && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-[14px] font-medium text-[#EF4444]"
          >
            {error}
          </motion.p>
        )}

        {!isLocked && attempts > 0 && attempts < 3 && (
          <p className="mt-2 text-[13px] text-[#A8A8A8]">
            {3 - attempts} intento{3 - attempts !== 1 ? "s" : ""} restante
            {3 - attempts !== 1 ? "s" : ""}
          </p>
        )}

        {isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex flex-col items-center gap-1"
          >
            <p className="text-[13px] font-medium text-[#EF4444]">
              Demasiados intentos
            </p>
            <p className="font-mono text-2xl font-medium text-[#EF4444]">
              {lockoutSeconds}s
            </p>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}

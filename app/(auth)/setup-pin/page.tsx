"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PinKeypad } from "@/components/features/PinKeypad";
import { usePin } from "@/lib/hooks/usePin";

type Step = "enter" | "confirm";

export default function SetupPinPage() {
  const router = useRouter();
  const { setupPin } = usePin();
  const [step, setStep] = useState<Step>("enter");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleComplete(pin: string) {
    if (step === "enter") {
      setFirstPin(pin);
      setStep("confirm");
      setError("");
      return;
    }

    if (pin !== firstPin) {
      setError("Los PINs no coinciden");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setLoading(true);
    const result = await setupPin(pin);

    if (!result.success) {
      setError(result.error ?? "Error al configurar PIN");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
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
            Configura tu PIN de acceso
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-6"
          >
            <p className="text-[14px] font-medium text-[#1A1A1A]">
              {step === "enter"
                ? "Ingresa un PIN de 6 dígitos"
                : "Confirma tu PIN"}
            </p>

            <PinKeypad
              onComplete={handleComplete}
              shake={shake}
              disabled={loading}
            />
          </motion.div>
        </AnimatePresence>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-[14px] font-medium text-[#EF4444]"
          >
            {error}
          </motion.p>
        )}

        {step === "confirm" && (
          <button
            type="button"
            onClick={() => {
              setStep("enter");
              setFirstPin("");
              setError("");
            }}
            className="mt-4 text-[14px] text-[#6B6B6B] underline"
          >
            Volver a ingresar
          </button>
        )}
      </motion.div>
    </main>
  );
}

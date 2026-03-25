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

    // Confirm step
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
      <div className="flex flex-col items-center gap-2 mb-10">
        <h1 className="text-[32px] font-bold font-display text-foreground">
          Cuotas
        </h1>
        <p className="text-sm text-muted-foreground">
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
          className="flex flex-col items-center gap-4"
        >
          <p className="text-sm text-foreground font-medium">
            {step === "enter" ? "Ingresa un PIN de 6 dígitos" : "Confirma tu PIN"}
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
          className="mt-6 text-sm text-red-500 font-medium"
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
          className="mt-4 text-sm text-muted-foreground underline"
        >
          Volver a ingresar
        </button>
      )}
    </main>
  );
}

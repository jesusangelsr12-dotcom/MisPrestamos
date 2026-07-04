import type { MSIExpense } from "@/types";

// Módulo canónico del "schedule" de un gasto MSI. Todos los consumidores
// (cards, dashboard, proyección) deben derivar meses/montos de aquí para no
// re-implementar la regla del mes balloon en cada archivo.

/** Total de meses de pago, incluyendo el mes balloon (pago final) si aplica. */
export function getMSITotalMonths(e: Pick<MSIExpense, "has_final_payment" | "months">): number {
  return e.has_final_payment ? e.months + 1 : e.months;
}

/** ¿Sigue activo? (quedan meses por pagar, balloon incluido) */
export function isMSIActive(
  e: Pick<MSIExpense, "has_final_payment" | "months" | "months_paid">
): boolean {
  return e.months_paid < getMSITotalMonths(e);
}

/**
 * Estimación del monto restante: meses regulares pendientes × mensualidad,
 * más el pago final si aún no se ha pagado el mes balloon.
 */
export function getMSIEstimatedRemaining(
  e: Pick<
    MSIExpense,
    "has_final_payment" | "months" | "months_paid" | "monthly_amount" | "final_payment_amount"
  >
): number {
  if (e.months_paid < e.months) {
    const regular = e.monthly_amount * (e.months - e.months_paid);
    const balloon = e.has_final_payment && e.final_payment_amount ? e.final_payment_amount : 0;
    return regular + balloon;
  }
  // Solo queda (o no) el mes balloon.
  if (e.months_paid === e.months && e.has_final_payment && e.final_payment_amount) {
    return e.final_payment_amount;
  }
  return 0;
}

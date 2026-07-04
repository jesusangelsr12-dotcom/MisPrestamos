// Formateadores compartidos. Antes formatCurrency estaba copiado en 10 archivos
// y getProgressColor en 3; centralizarlos evita que las cifras (p. ej. el total
// del dashboard vs. las cards) se muestren con formatos distintos.

export function formatCurrency(n: number): string {
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// Color de la barra de progreso según el porcentaje pagado.
export function getProgressColor(pct: number): string {
  if (pct <= 40) return "#2C6CFF";
  if (pct <= 75) return "#F59E0B";
  return "#00A878";
}

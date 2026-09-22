"use client";

import { mutate } from "swr";

export const swrKeys = {
  accounts: "accounts",
  homeAccounts: "home-accounts",
  budget: "budget",
  categories: "categories",
  people: "people",
  accountDetail: (id: string, offset: number) => ["account-detail", id, offset] as const,
  // El filtro de persona en "Gastos a MSI" se aplica en cliente sobre datos
  // ya cargados — no cambia la consulta, así que no forma parte de la llave.
  msiExpensesData: "msi-expenses-data",
};

// Un gasto/pago/transferencia o una cuenta creada/editada/borrada afecta
// datos derivados en varias pantallas a la vez (Home, detalle de cuenta,
// Gastos MSI, Presupuesto). Se llama después de cualquier escritura para
// que, al navegar a otra pantalla, no se vea información vieja en caché.
export async function revalidateFinanceData(): Promise<void> {
  await Promise.all([
    mutate(swrKeys.accounts),
    mutate(swrKeys.homeAccounts),
    mutate(swrKeys.budget),
    mutate(swrKeys.msiExpensesData),
    mutate((key) => Array.isArray(key) && key[0] === "account-detail"),
  ]);
}

import { Wallet, CreditCard, PiggyBank, TrendingUp, MoreHorizontal, type LucideIcon } from "lucide-react";
import type { AccountType } from "@/types";

const ICONS: Record<AccountType, LucideIcon> = {
  cash: Wallet,
  credit_card: CreditCard,
  savings: PiggyBank,
  investment: TrendingUp,
  other: MoreHorizontal,
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: "Efectivo",
  credit_card: "Tarjeta de crédito",
  savings: "Ahorro",
  investment: "Inversión",
  other: "Otro",
};

interface AccountTypeIconProps {
  type: AccountType;
  size?: number;
  color?: string;
}

export function AccountTypeIcon({ type, size = 18, color = "#2C6CFF" }: AccountTypeIconProps) {
  const Icon = ICONS[type];
  return <Icon size={size} strokeWidth={2} color={color} />;
}

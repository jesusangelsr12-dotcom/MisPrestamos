"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, PieChart, Handshake } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Inicio", Icon: Home, exact: true },
  { href: "/msi-expenses", label: "Gastos MSI", Icon: BarChart2, exact: false },
  { href: "/budget", label: "Presupuesto", Icon: PieChart, exact: false },
  { href: "/dashboard", label: "Préstamos", Icon: Handshake, exact: false },
] as const;

export function FinanceBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[#EBEBEB] bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-[68px] items-start justify-around px-1 pt-3">
        {NAV_ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex min-w-0 flex-1 flex-col items-center gap-1"
            >
              <item.Icon size={22} strokeWidth={active ? 2.2 : 1.8} color={active ? "#2C6CFF" : "#A8A8A8"} />
              <span className={`text-[10px] font-medium ${active ? "text-[#2C6CFF]" : "text-[#A8A8A8]"}`}>
                {item.label}
              </span>
              {active && <span className="mt-0.5 h-1 w-1 rounded-full bg-[#2C6CFF]" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

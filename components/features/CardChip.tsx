interface CardChipProps {
  name: string;
  bank: string;
  lastFour: string;
  color: string;
}

export function CardChip({ name, bank, lastFour, color }: CardChipProps) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl p-5"
      style={{
        backgroundColor: color,
        aspectRatio: "1.586",
      }}
    >
      {/* Grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative flex h-full flex-col justify-between">
        <p className="text-sm font-medium text-white/80">{bank}</p>
        <div>
          <p className="font-mono text-lg tracking-widest text-white">
            •••• {lastFour}
          </p>
          <p className="mt-1 text-sm font-medium text-white">{name}</p>
        </div>
      </div>
    </div>
  );
}

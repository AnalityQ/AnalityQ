type PremiumLockCardProps = {
  title: string;
  text: string;
};

export function PremiumLockCard({ title, text }: PremiumLockCardProps) {
  return (
    <div className="premium-lock-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-amber-100">Premium insight</p>
          <h3 className="mt-2 text-xl font-black text-white">{title}</h3>
        </div>
        <span className="lock-mark" aria-hidden="true">
          L
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">{text}</p>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-amber-200/30 via-cyan-200/50 to-transparent blur-[1px]" />
      </div>
    </div>
  );
}

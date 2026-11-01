interface StatusBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export function StatusBadge({
  active,
  activeLabel = 'Ativo',
  inactiveLabel = 'Inativo',
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        active ? 'bg-emerald-100 text-[#175a3a]' : 'bg-slate-200 text-slate-600'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`}
        aria-hidden="true"
      />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}


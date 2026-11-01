interface TableSkeletonProps {
  rows?: number;
  columns: number;
}

/** Skeleton de carregamento para tabelas administrativas. */
export function TableSkeleton({ rows = 5, columns }: TableSkeletonProps) {
  return (
    <div className="animate-pulse divide-y divide-slate-100" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando registros...</span>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-6 px-6 py-4">
          {Array.from({ length: columns }, (_, columnIndex) => (
            <div
              key={columnIndex}
              className={`h-3.5 rounded-full bg-slate-200 ${
                columnIndex === 0 ? 'w-1/4' : 'flex-1'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}


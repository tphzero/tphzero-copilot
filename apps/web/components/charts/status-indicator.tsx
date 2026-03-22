import { cn } from '@/lib/utils';
import type { SystemState } from '@tphzero/domain';

const STATE_CONFIG: Record<
  SystemState,
  { label: string; textColor: string; bgColor: string; dotColor: string }
> = {
  optimo: {
    label: 'Optimo',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    dotColor: 'bg-emerald-400',
  },
  suboptimo: {
    label: 'Suboptimo',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    dotColor: 'bg-amber-400',
  },
  critico: {
    label: 'Critico',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/20',
    dotColor: 'bg-red-400',
  },
};

export function StatusIndicator({
  state,
  size = 'md',
}: {
  state: SystemState;
  size?: 'sm' | 'md' | 'lg';
}) {
  const config = STATE_CONFIG[state];
  const dotSize = { sm: 'h-2 w-2', md: 'h-3 w-3', lg: 'h-4 w-4' }[size];
  const textSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }[size];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1',
        config.bgColor
      )}
    >
      <span className={cn('rounded-full', dotSize, config.dotColor)} />
      <span className={cn('font-medium', textSize, config.textColor)}>
        {config.label}
      </span>
    </div>
  );
}

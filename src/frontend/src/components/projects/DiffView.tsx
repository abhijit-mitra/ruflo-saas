import { clsx } from 'clsx';
import type { ChangeOrderItem } from '@/types/domain';

interface DiffViewProps {
  items: ChangeOrderItem[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

const changeStyles = {
  added: {
    row: 'bg-green-500/10 border-l-2 border-green-500',
    badge: 'bg-green-500/20 text-green-400',
    label: 'Added',
  },
  removed: {
    row: 'bg-red-500/10 border-l-2 border-red-500',
    badge: 'bg-red-500/20 text-red-400',
    label: 'Removed',
  },
  modified: {
    row: 'bg-amber-500/10 border-l-2 border-amber-500',
    badge: 'bg-amber-500/20 text-amber-400',
    label: 'Modified',
  },
};

export default function DiffView({ items }: DiffViewProps) {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-text-muted text-sm">
        No changes in this order.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const style = changeStyles[item.changeType];
        return (
          <div
            key={item.id}
            className={clsx(
              'rounded-lg p-4 transition-colors',
              style.row,
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={clsx(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      style.badge,
                    )}
                  >
                    {style.label}
                  </span>
                  <span className="text-sm font-medium text-text-primary truncate">
                    {item.description}
                  </span>
                </div>

                {item.changeType === 'modified' && (
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-text-muted text-xs mb-1">Original</p>
                      {item.originalQuantity != null && (
                        <p className="text-text-secondary">
                          Qty: {item.originalQuantity}
                        </p>
                      )}
                      {item.originalUnitPrice != null && (
                        <p className="text-text-secondary">
                          Price: {formatCurrency(item.originalUnitPrice)}
                        </p>
                      )}
                      {item.originalTotal != null && (
                        <p className="text-text-primary font-medium">
                          Total: {formatCurrency(item.originalTotal)}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-text-muted text-xs mb-1">Revised</p>
                      {item.newQuantity != null && (
                        <p className="text-text-secondary">
                          Qty: {item.newQuantity}
                        </p>
                      )}
                      {item.newUnitPrice != null && (
                        <p className="text-text-secondary">
                          Price: {formatCurrency(item.newUnitPrice)}
                        </p>
                      )}
                      {item.newTotal != null && (
                        <p className="text-white font-medium">
                          Total: {formatCurrency(item.newTotal)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {item.changeType === 'added' && item.newTotal != null && (
                  <p className="mt-1 text-sm text-green-400">
                    +{formatCurrency(item.newTotal)}
                  </p>
                )}

                {item.changeType === 'removed' && item.originalTotal != null && (
                  <p className="mt-1 text-sm text-red-400">
                    -{formatCurrency(item.originalTotal)}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

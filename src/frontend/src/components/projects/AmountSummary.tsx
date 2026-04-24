interface AmountSummaryProps {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate?: number;
  discountAmount?: number;
  total: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export default function AmountSummary({
  subtotal,
  taxRate,
  taxAmount,
  discountRate = 0,
  discountAmount = 0,
  total,
}: AmountSummaryProps) {
  return (
    <div className="rounded-lg bg-surface-card border border-border/50 p-4 space-y-3">
      <div className="flex justify-between text-sm text-text-secondary">
        <span>Subtotal</span>
        <span className="text-text-primary font-medium">{formatCurrency(subtotal)}</span>
      </div>
      {discountRate > 0 && (
        <div className="flex justify-between text-sm text-text-secondary">
          <span>Discount ({discountRate}%)</span>
          <span className="text-red-400">-{formatCurrency(discountAmount)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm text-text-secondary">
        <span>Tax ({taxRate}%)</span>
        <span className="text-text-primary">{formatCurrency(taxAmount)}</span>
      </div>
      <div className="border-t border-border/50 pt-3 flex justify-between text-base font-semibold">
        <span className="text-text-primary">Total</span>
        <span className="text-white">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

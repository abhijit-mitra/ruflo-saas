import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/projects/StatusBadge';
import LineItemTable from '@/components/projects/LineItemTable';
import AmountSummary from '@/components/projects/AmountSummary';
import type { LineItem, InvoiceStatus } from '@/types/domain';

function generateId(): string {
  return `li_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export default function Invoice() {
  const { id: projectId, invoiceId } = useParams<{
    id: string;
    invoiceId: string;
  }>();
  const navigate = useNavigate();
  const isNew = !invoiceId || invoiceId === 'new';

  const [status, setStatus] = useState<InvoiceStatus>('draft');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: generateId(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      unit: 'ea',
      total: 0,
    },
  ]);
  const [taxRate, setTaxRate] = useState(8.25);
  const [discountRate, setDiscountRate] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [showPayment, setShowPayment] = useState(false);

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.total, 0),
    [lineItems],
  );
  const discountAmount = subtotal * (discountRate / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;
  const amountDue = total - amountPaid;

  const handleSend = () => setStatus('sent');

  const handleRecordPayment = () => {
    const newPaid = amountPaid + paymentAmount;
    setAmountPaid(newPaid);
    if (newPaid >= total) setStatus('paid');
    setShowPayment(false);
    setPaymentAmount(0);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Project
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">
              {isNew ? 'New Invoice' : `Invoice #${invoiceId}`}
            </h1>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Payment Summary */}
        {status !== 'draft' && (
          <div className="grid grid-cols-3 gap-4">
            <Card padding="md">
              <p className="text-xs text-text-muted">Total</p>
              <p className="text-lg font-semibold text-text-primary mt-1">
                {formatCurrency(total)}
              </p>
            </Card>
            <Card padding="md">
              <p className="text-xs text-text-muted">Paid</p>
              <p className="text-lg font-semibold text-green-400 mt-1">
                {formatCurrency(amountPaid)}
              </p>
            </Card>
            <Card padding="md">
              <p className="text-xs text-text-muted">Amount Due</p>
              <p
                className={`text-lg font-semibold mt-1 ${
                  amountDue > 0 ? 'text-amber-400' : 'text-green-400'
                }`}
              >
                {formatCurrency(amountDue)}
              </p>
            </Card>
          </div>
        )}

        {/* Due Date */}
        <Card padding="lg">
          <label className="block text-sm text-text-secondary mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={status !== 'draft'}
            className="rounded-md border border-border bg-surface-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
          />
        </Card>

        {/* Line Items */}
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Line Items</h2>
          <LineItemTable
            items={lineItems}
            editable={status === 'draft'}
            onChange={setLineItems}
          />
        </Card>

        {/* Rates (draft only) */}
        {status === 'draft' && (
          <Card padding="lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-border bg-surface-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-border bg-surface-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Notes */}
        <Card padding="lg">
          <label className="block text-sm text-text-secondary mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            disabled={status !== 'draft'}
            className="w-full rounded-md border border-border bg-surface-card px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 resize-none"
            placeholder="Payment terms, notes..."
          />
        </Card>

        {/* Amount Summary */}
        <AmountSummary
          subtotal={subtotal}
          taxRate={taxRate}
          taxAmount={taxAmount}
          discountRate={discountRate}
          discountAmount={discountAmount}
          total={total}
        />

        {/* Record Payment Modal */}
        {showPayment && (
          <Card padding="lg" className="border-primary/30">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              Record Payment
            </h3>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm text-text-secondary mb-1">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-border bg-surface-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <Button size="sm" onClick={handleRecordPayment}>
                Record
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowPayment(false)}
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          {status === 'draft' && (
            <>
              <Button variant="secondary">Save Draft</Button>
              <Button onClick={handleSend}>Send Invoice</Button>
            </>
          )}
          {status === 'sent' && (
            <Button onClick={() => setShowPayment(true)}>Record Payment</Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

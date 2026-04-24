import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/projects/StatusBadge';
import LineItemTable from '@/components/projects/LineItemTable';
import AmountSummary from '@/components/projects/AmountSummary';
import type { LineItem, SalesOrderStatus } from '@/types/domain';

function generateId(): string {
  return `li_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function SalesOrder() {
  const { id: projectId, soId } = useParams<{ id: string; soId: string }>();
  const navigate = useNavigate();
  const isNew = !soId || soId === 'new';

  const [status, setStatus] = useState<SalesOrderStatus>('draft');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
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
  const [notes, setNotes] = useState('');

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.total, 0),
    [lineItems],
  );
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

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
              {isNew ? 'New Sales Order' : `SO #${soId}`}
            </h1>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Customer Details */}
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Customer Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={status !== 'draft'}
                className="w-full rounded-md border border-border bg-surface-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                placeholder="Customer name"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                disabled={status !== 'draft'}
                className="w-full rounded-md border border-border bg-surface-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Phone</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                disabled={status !== 'draft'}
                className="w-full rounded-md border border-border bg-surface-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
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

        {/* Tax */}
        {status === 'draft' && (
          <Card padding="lg">
            <div className="w-48">
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
            placeholder="Order notes, delivery instructions..."
          />
        </Card>

        {/* Summary */}
        <AmountSummary
          subtotal={subtotal}
          taxRate={taxRate}
          taxAmount={taxAmount}
          total={total}
        />

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          {status === 'draft' && (
            <>
              <Button variant="secondary">Save Draft</Button>
              <Button onClick={() => setStatus('confirmed')}>Confirm Order</Button>
            </>
          )}
          {status === 'confirmed' && (
            <Button onClick={() => setStatus('shipped')}>Mark Shipped</Button>
          )}
          {status === 'shipped' && (
            <Button onClick={() => setStatus('delivered')}>Mark Delivered</Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ClockIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LineItemTable from '@/components/projects/LineItemTable';
import AmountSummary from '@/components/projects/AmountSummary';
import StatusBadge from '@/components/projects/StatusBadge';
import type { LineItem, QuoteStatus } from '@/types/domain';

function generateId(): string {
  return `li_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface QuoteVersion {
  version: number;
  status: QuoteStatus;
  total: number;
  createdAt: string;
}

export default function QuoteBuilder() {
  const { id: projectId, quoteId } = useParams<{ id: string; quoteId: string }>();
  const navigate = useNavigate();
  const isNew = !quoteId || quoteId === 'new';

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
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<QuoteStatus>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Mock version history
  const [versions] = useState<QuoteVersion[]>(
    isNew
      ? []
      : [
          {
            version: 1,
            status: 'revised',
            total: 45000,
            createdAt: '2026-04-15T10:00:00Z',
          },
        ],
  );

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.total, 0),
    [lineItems],
  );
  const discountAmount = useMemo(
    () => subtotal * (discountRate / 100),
    [subtotal, discountRate],
  );
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = useMemo(
    () => taxableAmount * (taxRate / 100),
    [taxableAmount, taxRate],
  );
  const total = taxableAmount + taxAmount;

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // API call would go here
      await new Promise((r) => setTimeout(r, 500));
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleAction = useCallback(
    async (action: 'submit' | 'win' | 'lose' | 'revise') => {
      const statusMap: Record<string, QuoteStatus> = {
        submit: 'submitted',
        win: 'won',
        lose: 'lost',
        revise: 'draft',
      };
      setStatus(statusMap[action]);
      // API call would go here
    },
    [],
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Project
          </button>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-text-primary">
                  {isNew ? 'New Quote' : `Quote #${quoteId}`}
                </h1>
                <StatusBadge status={status} />
              </div>
              {!isNew && versions.length > 0 && (
                <p className="text-text-muted text-sm mt-1">
                  Version {versions.length + 1}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isNew && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <ClockIcon className="h-4 w-4 mr-1" />
                  History
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Line Items */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Line Items
              </h2>
              <LineItemTable
                items={lineItems}
                editable={status === 'draft'}
                onChange={setLineItems}
              />
            </Card>

            {/* Rates */}
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
                placeholder="Add any notes or terms..."
              />
            </Card>

            {/* Summary */}
            <AmountSummary
              subtotal={subtotal}
              taxRate={taxRate}
              taxAmount={taxAmount}
              discountRate={discountRate}
              discountAmount={discountAmount}
              total={total}
            />

            {/* Actions */}
            <div className="flex items-center gap-3 justify-end">
              {status === 'draft' && (
                <>
                  <Button variant="secondary" onClick={handleSave} isLoading={isSaving}>
                    Save Draft
                  </Button>
                  <Button onClick={() => handleAction('submit')}>Submit Quote</Button>
                </>
              )}
              {status === 'submitted' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleAction('lose')}
                    className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                  >
                    Mark as Lost
                  </Button>
                  <Button onClick={() => handleAction('win')}>Mark as Won</Button>
                </>
              )}
              {(status === 'won' || status === 'lost' || status === 'submitted') && (
                <Button variant="secondary" onClick={() => handleAction('revise')}>
                  Revise Quote
                </Button>
              )}
            </div>
          </div>

          {/* Version History Sidebar */}
          {showHistory && versions.length > 0 && (
            <div className="w-72 flex-shrink-0">
              <Card padding="lg" className="sticky top-6">
                <h3 className="text-sm font-semibold text-text-primary mb-3">
                  Version History
                </h3>
                <div className="space-y-3">
                  {versions.map((v) => (
                    <div
                      key={v.version}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-surface-hover/50 cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="text-sm text-text-primary">v{v.version}</p>
                        <p className="text-xs text-text-muted">
                          {new Date(v.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={v.status} />
                        <p className="text-xs text-text-muted mt-1">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            maximumFractionDigits: 0,
                          }).format(v.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

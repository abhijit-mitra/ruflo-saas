import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/projects/StatusBadge';
import DiffView from '@/components/projects/DiffView';
import type { ChangeOrder as ChangeOrderType } from '@/types/domain';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export default function ChangeOrder() {
  const { id: projectId, coId } = useParams<{ id: string; coId: string }>();
  const navigate = useNavigate();

  // Mock data - would come from API
  const [changeOrder] = useState<ChangeOrderType>({
    id: coId ?? '',
    projectId: projectId ?? '',
    quoteId: 'q1',
    type: 'customer',
    status: 'pending',
    items: [
      {
        id: 'ci1',
        description: '4" Copper Pipe - 20ft',
        changeType: 'added',
        newQuantity: 50,
        newUnitPrice: 45,
        newTotal: 2250,
      },
      {
        id: 'ci2',
        description: '2" PVC Elbow Fitting',
        changeType: 'removed',
        originalQuantity: 100,
        originalUnitPrice: 3.5,
        originalTotal: 350,
      },
      {
        id: 'ci3',
        description: 'Stainless Steel Valve 3"',
        changeType: 'modified',
        originalQuantity: 10,
        newQuantity: 15,
        originalUnitPrice: 120,
        newUnitPrice: 115,
        originalTotal: 1200,
        newTotal: 1725,
      },
    ],
    originalAmount: 48500,
    revisedAmount: 51125,
    reason: 'Customer requested additional piping and upgraded valve quantities.',
    createdAt: '2026-04-20T14:30:00Z',
    updatedAt: '2026-04-20T14:30:00Z',
  });

  const difference = useMemo(
    () => changeOrder.revisedAmount - changeOrder.originalAmount,
    [changeOrder],
  );

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
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-text-primary">
                  Change Order #{coId}
                </h1>
                <StatusBadge status={changeOrder.status} />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    changeOrder.type === 'customer'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                  }`}
                >
                  {changeOrder.type === 'customer'
                    ? 'Customer Change Order'
                    : 'Vendor Change Order'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Amount Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card padding="md">
            <p className="text-xs text-text-muted">Original Amount</p>
            <p className="text-lg font-semibold text-text-primary mt-1">
              {formatCurrency(changeOrder.originalAmount)}
            </p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-text-muted">Revised Amount</p>
            <p className="text-lg font-semibold text-white mt-1">
              {formatCurrency(changeOrder.revisedAmount)}
            </p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-text-muted">Difference</p>
            <p
              className={`text-lg font-semibold mt-1 ${
                difference >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {difference >= 0 ? '+' : ''}
              {formatCurrency(difference)}
            </p>
          </Card>
        </div>

        {/* Reason */}
        {changeOrder.reason && (
          <Card padding="lg">
            <h2 className="text-sm font-semibold text-text-primary mb-2">Reason</h2>
            <p className="text-sm text-text-secondary">{changeOrder.reason}</p>
          </Card>
        )}

        {/* Changes Diff */}
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Changes</h2>
          <DiffView items={changeOrder.items} />
        </Card>

        {/* Actions */}
        {changeOrder.status === 'pending' && (
          <div className="flex items-center gap-3 justify-end">
            <Button
              variant="outline"
              className="text-red-400 border-red-500/30 hover:bg-red-500/10"
            >
              Reject
            </Button>
            <Button>Approve</Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

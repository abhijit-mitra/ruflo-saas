import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ContentGrid from '@/components/dashboard/ContentGrid';

const sampleRows = [
  {
    title: 'Recent Projects',
    items: [
      { id: '1', title: 'Downtown Office Tower', subtitle: 'ABC Construction', metric: '$2.4M', color: '#3b82f6' },
      { id: '2', title: 'Riverside Apartments', subtitle: 'Horizon Builders', metric: '$1.8M', color: '#22c55e' },
      { id: '3', title: 'Highway Overpass Repair', subtitle: 'Metro Infrastructure', metric: '$890K', color: '#8b5cf6' },
      { id: '4', title: 'School Gymnasium', subtitle: 'Unified School District', metric: '$650K', color: '#E50914' },
      { id: '5', title: 'Warehouse Expansion', subtitle: 'Pacific Logistics', metric: '$1.1M', color: '#f59e0b' },
      { id: '6', title: 'Hospital Wing Addition', subtitle: 'Regional Medical Center', metric: '$3.2M', color: '#06b6d4' },
    ],
  },
  {
    title: 'Pending Quotes',
    items: [
      { id: '7', title: 'HVAC System Upgrade', subtitle: 'Submitted 2 days ago', metric: '$145K', color: '#f59e0b' },
      { id: '8', title: 'Electrical Panel Replacement', subtitle: 'Submitted today', metric: '$32K', color: '#3b82f6' },
      { id: '9', title: 'Plumbing Reroute - Phase 2', subtitle: 'Revised 1 week ago', metric: '$78K', color: '#8b5cf6' },
      { id: '10', title: 'Fire Suppression Install', subtitle: 'Awaiting approval', metric: '$210K', color: '#E50914' },
      { id: '11', title: 'Concrete Foundation', subtitle: 'Submitted 3 days ago', metric: '$95K', color: '#22c55e' },
    ],
  },
  {
    title: 'Overdue Invoices',
    items: [
      { id: '12', title: 'INV-2024-0089', subtitle: 'Due Apr 1 - ABC Construction', metric: '$45,200', color: '#ef4444' },
      { id: '13', title: 'INV-2024-0076', subtitle: 'Due Mar 15 - Horizon Builders', metric: '$12,800', color: '#ef4444' },
      { id: '14', title: 'INV-2024-0092', subtitle: 'Due Apr 10 - Metro Infra', metric: '$67,500', color: '#f59e0b' },
    ],
  },
  {
    title: 'Active Purchase Orders',
    items: [
      { id: '15', title: 'PO-4521 Structural Steel', subtitle: 'US Steel Supply', metric: '$128K', color: '#3b82f6' },
      { id: '16', title: 'PO-4518 Copper Piping', subtitle: 'National Plumbing Dist.', metric: '$34K', color: '#22c55e' },
      { id: '17', title: 'PO-4525 Electrical Wire', subtitle: 'ElectroPro Wholesale', metric: '$18K', color: '#8b5cf6' },
      { id: '18', title: 'PO-4530 Concrete Mix', subtitle: 'ReadyMix Co.', metric: '$56K', color: '#f59e0b' },
      { id: '19', title: 'PO-4532 Insulation', subtitle: 'BuildRight Materials', metric: '$22K', color: '#06b6d4' },
    ],
  },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-2 mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary">
          Overview of your projects, quotes, invoices, and purchase orders.
        </p>
      </div>
      <ContentGrid rows={sampleRows} />
    </DashboardLayout>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/projects/StatusBadge';
import FileManager from '@/components/projects/FileManager';
import CreateBOMModal from '@/components/projects/CreateBOMModal';
import { useProjectStore, type ProjectTab } from '@/store/projectStore';
import * as projectsApi from '@/services/projects';
import * as bomApi from '@/services/bom';
import type {
  Project,
  Quote,
  RFQDocument,
  ChangeOrder,
  Invoice,
  PurchaseOrder,
  SalesOrder,
  BillOfMaterials,
  CreateBOMRequest,
} from '@/types/domain';

const tabs: { key: ProjectTab; label: string }[] = [
  { key: 'quotes', label: 'Quotes' },
  { key: 'documents', label: 'Documents' },
  { key: 'files', label: 'Files' },
  { key: 'bom', label: 'Bill of Materials' },
  { key: 'change-orders', label: 'Change Orders' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'purchase-orders', label: 'Purchase Orders' },
  { key: 'sales-orders', label: 'Sales Orders' },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const bomStatusColors: Record<string, string> = {
  draft: 'bg-gray-600 text-gray-200',
  active: 'bg-green-900/50 text-green-400',
  finalized: 'bg-blue-900/50 text-blue-400',
};

// BOM List sub-component
function BOMListContent({
  projectId,
  projectName,
  navigate,
}: {
  projectId: string;
  projectName: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [boms, setBoms] = useState<BillOfMaterials[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadBoms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bomApi.getBOMs(projectId);
      setBoms(data);
    } catch {
      setBoms([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadBoms();
  }, [loadBoms]);

  const handleCreateBOM = async (requests: CreateBOMRequest[], file?: File) => {
    for (const req of requests) {
      const created = await bomApi.createBOM(projectId, req);
      if (file) {
        await bomApi.importFile(projectId, created.id, file);
      }
    }
    loadBoms();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">{boms.length} BOM{boms.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="h-4 w-4 mr-1" /> Create BOM
        </Button>
      </div>

      {boms.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-text-muted text-sm mb-4">No bills of materials yet.</p>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="h-4 w-4 mr-1" /> Create BOM
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boms.map((bom) => (
            <div
              key={bom.id}
              onClick={() => navigate(`/projects/${projectId}/boms/${bom.id}`)}
              className="rounded-lg border border-gray-700 bg-[#0f0f0f] p-4 hover:border-gray-500 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-white truncate flex-1 mr-2">{bom.name}</h4>
                {bom.isPrimary && <StarIcon className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-gray-800 text-gray-400">
                  {bom.bomNumber}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium capitalize ${bomStatusColors[bom.status] ?? ''}`}>
                  {bom.status}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {bom.productCount ?? 0} product{(bom.productCount ?? 0) !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      )}

      <CreateBOMModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateBOM}
        projectName={projectName}
      />
    </>
  );
}

// Placeholder tab content - data will come from API
function TabContent({
  tab,
  projectId,
  projectName,
  navigate,
}: {
  tab: ProjectTab;
  projectId: string;
  projectName: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [_quotes] = useState<Quote[]>([]);
  const [_docs] = useState<RFQDocument[]>([]);
  const [_changeOrders] = useState<ChangeOrder[]>([]);
  const [_invoices] = useState<Invoice[]>([]);
  const [_purchaseOrders] = useState<PurchaseOrder[]>([]);
  const [_salesOrders] = useState<SalesOrder[]>([]);

  const emptyState = (label: string, createPath?: string) => (
    <div className="py-12 text-center">
      <p className="text-text-muted text-sm mb-4">No {label} yet.</p>
      {createPath && (
        <Button size="sm" onClick={() => navigate(createPath)}>
          <PlusIcon className="h-4 w-4 mr-1" />
          Create {label.replace(/s$/, '')}
        </Button>
      )}
    </div>
  );

  switch (tab) {
    case 'quotes':
      return emptyState('quotes', `/projects/${projectId}/quotes/new`);
    case 'documents':
      return emptyState('documents');
    case 'files':
      return <FileManager projectId={projectId} />;
    case 'bom':
      return <BOMListContent projectId={projectId} projectName={projectName} navigate={navigate} />;
    case 'change-orders':
      return emptyState('change orders');
    case 'invoices':
      return emptyState('invoices');
    case 'purchase-orders':
      return emptyState('purchase orders');
    case 'sales-orders':
      return emptyState('sales orders');
  }
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, setCurrentProject, activeTab, setActiveTab, setLoading } =
    useProjectStore();
  const [project, setProject] = useState<Project | null>(currentProject);

  const loadProject = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await projectsApi.getProject(id);
      setProject(data);
      setCurrentProject(data);
    } catch {
      // API not available
    } finally {
      setLoading(false);
    }
  }, [id, setCurrentProject, setLoading]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-text-muted">Loading project...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back + Header */}
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Projects
          </button>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-text-primary">
                  {project.name}
                </h1>
                <StatusBadge status={project.status} />
              </div>
              {project.address && (
                <p className="text-text-secondary mt-1">{project.address}</p>
              )}
              {project.customerName && (
                <p className="text-text-muted text-sm mt-0.5">
                  {project.customerName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Estimated Value',
              value: formatCurrency(project.estimatedValue),
              color: '#3b82f6',
            },
            { label: 'Quotes', value: String(project.quoteCount), color: '#8b5cf6' },
            {
              label: 'Created',
              value: formatDate(project.createdAt),
              color: '#22c55e',
            },
            {
              label: 'Updated',
              value: formatDate(project.updatedAt),
              color: '#f59e0b',
            },
          ].map((stat) => (
            <Card key={stat.label} padding="none" className="overflow-hidden">
              <div className="h-1" style={{ backgroundColor: stat.color }} />
              <div className="p-4">
                <p className="text-xs text-text-muted">{stat.label}</p>
                <p className="text-lg font-semibold text-text-primary mt-1">
                  {stat.value}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-border/50">
          <nav className="flex gap-1 -mb-px overflow-x-auto" aria-label="Project tabs">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === t.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <Card padding="lg">
          <TabContent tab={activeTab} projectId={id!} projectName={project.name} navigate={navigate} />
        </Card>
      </div>
    </DashboardLayout>
  );
}

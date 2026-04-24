import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Button from '@/components/ui/Button';
import ProjectCard from '@/components/projects/ProjectCard';
import CreateProjectWizard from '@/components/projects/CreateProjectWizard';
import type { WizardData } from '@/components/projects/CreateProjectWizard';
import { useProjectStore } from '@/store/projectStore';
import * as projectsApi from '@/services/projects';
import type { ProjectStatus } from '@/types/domain';

const statusFilters: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'Completed', value: 'completed' },
];

export default function Projects() {
  const navigate = useNavigate();
  const { projects, setProjects, isLoading, setLoading } = useProjectStore();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);

  const handleCreateProject = async (data: WizardData) => {
    const address = [data.addressLine1, data.addressLine2, data.city, data.state, data.zip, data.country]
      .filter(Boolean)
      .join(', ');
    const totalValue = data.opportunities.reduce(
      (sum, o) => sum + (parseFloat(o.estimatedValue) || 0),
      0,
    );
    await projectsApi.createProject({
      name: data.projectName,
      address: address || undefined,
      description: data.details || undefined,
      estimatedValue: totalValue || undefined,
    });
    loadProjects();
  };

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const data = await projectsApi.getProjects(params);
      setProjects(data);
    } catch {
      // API not available yet; use empty list
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, setProjects, setLoading]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filtered = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
            <p className="text-text-secondary mt-1">
              Manage your construction projects, quotes, and orders.
            </p>
          </div>
          <Button onClick={() => setWizardOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-1.5" />
            New Project
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="search"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-surface-card pl-9 pr-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === f.value
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-text-secondary hover:bg-surface-hover border border-transparent'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-40 rounded-lg bg-surface-card border border-border/50 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-text-muted mb-4">
              {search || statusFilter !== 'all'
                ? 'No projects match your filters.'
                : 'No projects yet. Create your first project to get started.'}
            </p>
            {!search && statusFilter === 'all' && (
              <Button onClick={() => setWizardOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-1.5" />
                New Project
              </Button>
            )}
          </div>
        )}
      </div>
      <CreateProjectWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSubmit={handleCreateProject}
      />
    </DashboardLayout>
  );
}

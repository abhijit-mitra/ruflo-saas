import Card from '@/components/ui/Card';
import StatusBadge from './StatusBadge';
import type { Project } from '@/types/domain';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

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

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <Card
      hoverable
      padding="none"
      className="overflow-hidden group cursor-pointer"
      onClick={onClick}
    >
      <div className="h-1.5 bg-primary" />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-text-primary group-hover:text-white transition-colors truncate">
            {project.name}
          </h3>
          <StatusBadge status={project.status} />
        </div>
        {project.customerName && (
          <p className="text-sm text-text-muted truncate">{project.customerName}</p>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">
            {formatCurrency(project.estimatedValue)}
          </span>
          <span className="text-text-muted">
            {project.quoteCount} quote{project.quoteCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Created {formatDate(project.createdAt)}</span>
          <span>Updated {formatDate(project.updatedAt)}</span>
        </div>
      </div>
    </Card>
  );
}

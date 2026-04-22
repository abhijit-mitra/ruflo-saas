import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ContentGrid from '@/components/dashboard/ContentGrid';

const sampleRows = [
  {
    title: 'Active Workflows',
    items: [
      { id: '1', title: 'CI/CD Pipeline', subtitle: 'Production deploy', metric: '98.2%', color: '#22c55e' },
      { id: '2', title: 'Data Processing', subtitle: 'ETL batch job', metric: '4.2k/s', color: '#3b82f6' },
      { id: '3', title: 'API Gateway', subtitle: 'Request routing', metric: '12ms', color: '#8b5cf6' },
      { id: '4', title: 'Auth Service', subtitle: 'Token management', metric: '99.9%', color: '#E50914' },
      { id: '5', title: 'Notification Hub', subtitle: 'Email & push', metric: '1.2M', color: '#f59e0b' },
      { id: '6', title: 'Cache Layer', subtitle: 'Redis cluster', metric: '0.8ms', color: '#06b6d4' },
    ],
  },
  {
    title: 'Recent Deployments',
    items: [
      { id: '7', title: 'v2.4.1 Release', subtitle: 'Deployed 2 hours ago', metric: 'Live', color: '#22c55e' },
      { id: '8', title: 'v2.4.0 Release', subtitle: 'Deployed yesterday', metric: 'Stable', color: '#3b82f6' },
      { id: '9', title: 'v2.3.9 Hotfix', subtitle: 'Deployed 3 days ago', metric: 'Stable', color: '#3b82f6' },
      { id: '10', title: 'v2.3.8 Release', subtitle: 'Deployed last week', metric: 'Archived', color: '#6b7280' },
      { id: '11', title: 'v2.3.7 Release', subtitle: 'Deployed 2 weeks ago', metric: 'Archived', color: '#6b7280' },
    ],
  },
  {
    title: 'Team Activity',
    items: [
      { id: '12', title: 'Pull Requests', subtitle: '12 open, 3 in review', metric: '15', color: '#E50914' },
      { id: '13', title: 'Code Reviews', subtitle: '5 pending approval', metric: '5', color: '#f59e0b' },
      { id: '14', title: 'Issues', subtitle: '8 assigned to you', metric: '23', color: '#8b5cf6' },
      { id: '15', title: 'Merged Today', subtitle: 'Across all repos', metric: '7', color: '#22c55e' },
      { id: '16', title: 'Build Failures', subtitle: 'Last 24 hours', metric: '2', color: '#ef4444' },
    ],
  },
  {
    title: 'Infrastructure Health',
    items: [
      { id: '17', title: 'CPU Utilization', subtitle: 'avg across cluster', metric: '42%', color: '#22c55e' },
      { id: '18', title: 'Memory Usage', subtitle: 'avg across cluster', metric: '68%', color: '#f59e0b' },
      { id: '19', title: 'Network I/O', subtitle: 'ingress + egress', metric: '2.4 GB/s', color: '#3b82f6' },
      { id: '20', title: 'Disk Usage', subtitle: 'primary volumes', metric: '54%', color: '#22c55e' },
      { id: '21', title: 'Error Rate', subtitle: '5xx responses', metric: '0.02%', color: '#22c55e' },
      { id: '22', title: 'Latency P99', subtitle: 'API gateway', metric: '145ms', color: '#8b5cf6' },
    ],
  },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-2 mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary">
          Overview of your workflows, deployments, and infrastructure.
        </p>
      </div>
      <ContentGrid rows={sampleRows} />
    </DashboardLayout>
  );
}

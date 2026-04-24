import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import type { RFQDocument } from '@/types/domain';

interface DocumentListProps {
  documents: RFQDocument[];
  onDownload?: (doc: RFQDocument) => void;
  onDelete?: (doc: RFQDocument) => void;
}

const typeColors: Record<string, string> = {
  rfq: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  engineering_design: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  specification: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTypeLabel(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DocumentList({
  documents,
  onDownload,
  onDelete,
}: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="py-8 text-center text-text-muted text-sm">
        No documents uploaded yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 rounded-lg border border-border/50 bg-surface-card p-3 hover:bg-surface-hover/50 transition-colors group"
        >
          <DocumentTextIcon className="h-8 w-8 text-text-muted flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {doc.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  typeColors[doc.type] ?? typeColors.other
                }`}
              >
                {formatTypeLabel(doc.type)}
              </span>
              <span className="text-xs text-text-muted">
                {formatFileSize(doc.size)}
              </span>
              <span className="text-xs text-text-muted">
                {formatDate(doc.uploadedAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onDownload && (
              <button
                onClick={() => onDownload(doc)}
                className="rounded-md p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                aria-label={`Download ${doc.name}`}
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(doc)}
                className="rounded-md p-1.5 text-text-muted hover:text-red-400 hover:bg-surface-hover transition-colors"
                aria-label={`Delete ${doc.name}`}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

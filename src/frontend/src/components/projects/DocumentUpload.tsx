import { useState, useCallback, useRef } from 'react';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import type { DocumentType } from '@/types/domain';

interface DocumentUploadProps {
  onUpload: (file: File, type: DocumentType) => void;
  isUploading?: boolean;
}

const docTypes: { value: DocumentType; label: string }[] = [
  { value: 'rfq', label: 'RFQ' },
  { value: 'engineering_design', label: 'Engineering Design' },
  { value: 'specification', label: 'Specification' },
  { value: 'other', label: 'Other' },
];

export default function DocumentUpload({
  onUpload,
  isUploading = false,
}: DocumentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>('rfq');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onUpload(file, selectedType);
    },
    [onUpload, selectedType],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onUpload(file, selectedType);
      if (inputRef.current) inputRef.current.value = '';
    },
    [onUpload, selectedType],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-text-secondary">Document Type:</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as DocumentType)}
          className="rounded-md border border-border bg-surface-card px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
        >
          {docTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border/50 hover:border-border hover:bg-surface-hover/30'
        }`}
      >
        <CloudArrowUpIcon className="h-10 w-10 text-text-muted mb-3" />
        {isUploading ? (
          <p className="text-sm text-text-secondary">Uploading...</p>
        ) : (
          <>
            <p className="text-sm text-text-secondary">
              Drag and drop a file here, or click to browse
            </p>
            <p className="text-xs text-text-muted mt-1">
              PDF, DOCX, DWG, DXF, XLSX up to 50MB
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.docx,.dwg,.dxf,.xlsx,.png,.jpg"
        />
      </div>
    </div>
  );
}

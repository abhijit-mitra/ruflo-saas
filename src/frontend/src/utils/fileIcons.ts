export interface FileIconInfo {
  color: string;
  label: string;
}

export function getFileIcon(mimeType: string): FileIconInfo {
  if (mimeType === 'application/pdf') {
    return { color: '#ef4444', label: 'PDF' };
  }
  if (
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return { color: '#22c55e', label: 'XLS' };
  }
  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return { color: '#3b82f6', label: 'DOC' };
  }
  if (mimeType.startsWith('image/')) {
    return { color: '#a855f7', label: 'IMG' };
  }
  if (
    mimeType === 'application/vnd.ms-powerpoint' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    return { color: '#f97316', label: 'PPT' };
  }
  if (mimeType === 'text/csv') {
    return { color: '#22c55e', label: 'CSV' };
  }
  return { color: '#6b7280', label: 'FILE' };
}

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  FolderIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilIcon,
  ArrowRightIcon,
  PlusIcon,
  CloudArrowUpIcon,
  ListBulletIcon,
  Squares2X2Icon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getFileIcon } from '@/utils/fileIcons';
import * as fileApi from '@/services/file-management';
import type { ProjectFile, ProjectFolder } from '@/types/domain';

interface FileManagerProps {
  projectId: string;
}

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function FileManager({ projectId }: FileManagerProps) {
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: 'Root' }]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [dragOver, setDragOver] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'folder' | 'file';
    item: ProjectFolder | ProjectFile;
  } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fileApi.getFiles(projectId, currentFolderId);
      setFolders(data.folders);
      setFiles(data.files);
    } catch {
      // API not available yet
      setFolders([]);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, currentFolderId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const navigateToFolder = (folder: ProjectFolder) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const navigateToBreadcrumb = (index: number) => {
    const crumb = breadcrumbs[index];
    setCurrentFolderId(crumb.id);
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await fileApi.createFolder(projectId, { name: newFolderName.trim(), parentId: currentFolderId });
      setNewFolderName('');
      setShowNewFolder(false);
      loadFiles();
    } catch {
      // handle error
    }
  };

  const handleUpload = async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    for (const file of arr) {
      try {
        await fileApi.uploadFile(projectId, file, currentFolderId);
      } catch {
        // handle error
      }
    }
    loadFiles();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files);
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await fileApi.deleteFolder(projectId, folderId);
      loadFiles();
    } catch {
      // handle error
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await fileApi.deleteFile(projectId, fileId);
      loadFiles();
    } catch {
      // handle error
    }
  };

  const handleRenameFolder = async (folderId: string) => {
    if (!renameValue.trim()) return;
    try {
      await fileApi.renameFolder(projectId, folderId, renameValue.trim());
      setRenamingId(null);
      setRenameValue('');
      loadFiles();
    } catch {
      // handle error
    }
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    type: 'folder' | 'file',
    item: ProjectFolder | ProjectFile,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type, item });
  };

  const getIconBadge = (mimeType: string) => {
    const info = getFileIcon(mimeType);
    return (
      <span
        className="inline-flex items-center justify-center w-8 h-8 rounded text-xs font-bold"
        style={{ backgroundColor: `${info.color}20`, color: info.color }}
      >
        {info.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.id ?? 'root'} className="flex items-center gap-1">
              {i > 0 && <ChevronRightIcon className="h-3 w-3 text-gray-500" />}
              <button
                onClick={() => navigateToBreadcrumb(i)}
                className={`hover:text-white transition-colors ${
                  i === breadcrumbs.length - 1 ? 'text-white font-medium' : 'text-gray-400'
                }`}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            aria-label="Toggle view"
          >
            {viewMode === 'list' ? (
              <Squares2X2Icon className="h-5 w-5" />
            ) : (
              <ListBulletIcon className="h-5 w-5" />
            )}
          </button>
          <Button size="sm" variant="secondary" onClick={() => setShowNewFolder(true)}>
            <PlusIcon className="h-4 w-4 mr-1" /> New Folder
          </Button>
          <Button size="sm" onClick={() => uploadRef.current?.click()}>
            <CloudArrowUpIcon className="h-4 w-4 mr-1" /> Upload
          </Button>
          <input
            ref={uploadRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
        </div>
      </div>

      {/* New folder inline */}
      {showNewFolder && (
        <div className="flex items-center gap-2 bg-[#1a1a2e] rounded-md p-3 border border-gray-700">
          <FolderIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <Button size="sm" onClick={handleCreateFolder}>
            Create
          </Button>
          <button
            onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
            className="text-gray-400 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Drop zone overlay */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative min-h-[200px] rounded-lg transition-colors ${
          dragOver ? 'ring-2 ring-primary ring-dashed bg-primary/5' : ''
        }`}
      >
        {dragOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#141414]/80 rounded-lg z-10 pointer-events-none">
            <CloudArrowUpIcon className="h-12 w-12 text-primary mb-2" />
            <p className="text-white font-medium">Drop files to upload</p>
          </div>
        )}

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <DocumentIcon className="h-12 w-12 text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm mb-1">No files yet.</p>
            <p className="text-gray-500 text-xs">Upload files or create a folder.</p>
          </div>
        ) : viewMode === 'list' ? (
          /* List view */
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left py-2 px-3 font-medium">Name</th>
                <th className="text-left py-2 px-3 font-medium w-24">Size</th>
                <th className="text-left py-2 px-3 font-medium w-32">Modified</th>
                <th className="text-left py-2 px-3 font-medium w-32">Uploaded By</th>
                <th className="text-right py-2 px-3 font-medium w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {folders.map((folder) => (
                <tr
                  key={folder.id}
                  className="border-b border-gray-800 hover:bg-[#1a1a2e] cursor-pointer transition-colors group"
                  onClick={() => navigateToFolder(folder)}
                  onContextMenu={(e) => handleContextMenu(e, 'folder', folder)}
                >
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <FolderIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                      {renamingId === folder.id ? (
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameFolder(folder.id);
                            if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
                          }}
                          onBlur={() => handleRenameFolder(folder.id)}
                          autoFocus
                          className="bg-transparent border border-gray-600 rounded px-1 py-0.5 text-white text-sm focus:outline-none focus:border-primary"
                        />
                      ) : (
                        <span className="text-white">{folder.name}</span>
                      )}
                      {folder.fileCount !== undefined && (
                        <span className="text-gray-500 text-xs">({folder.fileCount})</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-gray-500">--</td>
                  <td className="py-2.5 px-3 text-gray-400">{formatDate(folder.createdAt)}</td>
                  <td className="py-2.5 px-3 text-gray-500">--</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleContextMenu(e, 'folder', folder); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
                    >
                      <EllipsisVerticalIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {files.map((file) => (
                <tr
                  key={file.id}
                  className="border-b border-gray-800 hover:bg-[#1a1a2e] transition-colors group"
                  onContextMenu={(e) => handleContextMenu(e, 'file', file)}
                >
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      {getIconBadge(file.mimeType)}
                      <span className="text-white">{file.fileName}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-gray-400">{formatFileSize(file.fileSize)}</td>
                  <td className="py-2.5 px-3 text-gray-400">{formatDate(file.uploadedAt)}</td>
                  <td className="py-2.5 px-3 text-gray-400">{file.uploadedBy?.name ?? '--'}</td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end gap-1 transition-all">
                      <a
                        href={file.fileUrl}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
                        aria-label="Download"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </a>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                        className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400"
                        aria-label="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          /* Grid view */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => navigateToFolder(folder)}
                onContextMenu={(e) => handleContextMenu(e, 'folder', folder)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-[#1a1a2e] border border-gray-800 hover:border-gray-600 cursor-pointer transition-colors"
              >
                <FolderIcon className="h-10 w-10 text-yellow-500" />
                <span className="text-sm text-white text-center truncate w-full">{folder.name}</span>
              </div>
            ))}
            {files.map((file) => (
              <div
                key={file.id}
                onContextMenu={(e) => handleContextMenu(e, 'file', file)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-[#1a1a2e] border border-gray-800 hover:border-gray-600 transition-colors"
              >
                {getIconBadge(file.mimeType)}
                <span className="text-sm text-white text-center truncate w-full">{file.fileName}</span>
                <span className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed bg-[#1a1a2e] border border-gray-700 rounded-lg shadow-xl py-1 z-50 min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'folder' ? (
            <>
              <button
                onClick={() => {
                  const f = contextMenu.item as ProjectFolder;
                  setRenamingId(f.id);
                  setRenameValue(f.name);
                  setContextMenu(null);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <PencilIcon className="h-4 w-4" /> Rename
              </button>
              <button
                onClick={() => {
                  handleDeleteFolder((contextMenu.item as ProjectFolder).id);
                  setContextMenu(null);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-700"
              >
                <TrashIcon className="h-4 w-4" /> Delete
              </button>
            </>
          ) : (
            <>
              <a
                href={(contextMenu.item as ProjectFile).fileUrl}
                download
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={() => setContextMenu(null)}
              >
                <ArrowDownTrayIcon className="h-4 w-4" /> Download
              </a>
              <button
                onClick={() => setContextMenu(null)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <ArrowRightIcon className="h-4 w-4" /> Move
              </button>
              <button
                onClick={() => {
                  handleDeleteFile((contextMenu.item as ProjectFile).id);
                  setContextMenu(null);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-700"
              >
                <TrashIcon className="h-4 w-4" /> Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

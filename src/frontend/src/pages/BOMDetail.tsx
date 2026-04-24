import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PlusIcon,
  CloudArrowUpIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Button from '@/components/ui/Button';
import * as bomApi from '@/services/bom';
import type { BillOfMaterials, BOMProduct } from '@/types/domain';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function calcExtendedPrice(product: BOMProduct): number {
  return product.cost * product.quantity * (1 - product.discount / 100) * (1 + product.margin / 100);
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-600 text-gray-200',
  active: 'bg-green-900/50 text-green-400 border border-green-700',
  finalized: 'bg-blue-900/50 text-blue-400 border border-blue-700',
};

const PRODUCT_TYPES = ['Luminaire', 'Control', 'Ballast', 'Driver', 'Accessory', 'Sensor', 'Other'];

interface EditingCell {
  productId: string;
  field: 'quantity' | 'cost' | 'discount' | 'margin';
}

function emptyProduct(): Omit<BOMProduct, 'id' | 'bomId'> {
  return {
    type: 'Luminaire',
    manufacturer: '',
    modelNumber: '',
    quantity: 1,
    description: '',
    cost: 0,
    discount: 0,
    margin: 0,
    sortOrder: 0,
  };
}

export default function BOMDetail() {
  const { id: projectId, bomId } = useParams<{ id: string; bomId: string }>();
  const navigate = useNavigate();
  const [bom, setBom] = useState<BillOfMaterials | null>(null);
  const [products, setProducts] = useState<BOMProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddRow, setShowAddRow] = useState(false);
  const [newProduct, setNewProduct] = useState(emptyProduct());
  const importRef = useRef<HTMLInputElement>(null);

  const loadBOM = useCallback(async () => {
    if (!projectId || !bomId) return;
    setLoading(true);
    try {
      const data = await bomApi.getBOM(projectId, bomId);
      setBom(data);
      setProducts(data.products ?? []);
    } catch {
      // API not available
    } finally {
      setLoading(false);
    }
  }, [projectId, bomId]);

  useEffect(() => {
    loadBOM();
  }, [loadBOM]);

  const handleImport = async (file: File) => {
    if (!projectId || !bomId) return;
    setImporting(true);
    try {
      const imported = await bomApi.importFile(projectId, bomId, file);
      const newIds = new Set(imported.map((p) => p.id));
      setImportedIds(newIds);
      setProducts((prev) => [...prev, ...imported]);
      setTimeout(() => setImportedIds(new Set()), 3000);
    } catch {
      // handle error
    } finally {
      setImporting(false);
    }
  };

  const handleAddProduct = async () => {
    if (!projectId || !bomId) return;
    try {
      const created = await bomApi.addProduct(projectId, bomId, {
        ...newProduct,
        sortOrder: products.length,
      });
      setProducts((prev) => [...prev, created]);
      setNewProduct(emptyProduct());
      setShowAddRow(false);
    } catch {
      // handle error
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!projectId || !bomId) return;
    try {
      await bomApi.deleteProduct(projectId, bomId, productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch {
      // handle error
    }
  };

  const startEditing = (productId: string, field: EditingCell['field'], currentValue: number) => {
    setEditingCell({ productId, field });
    setEditValue(String(currentValue));
  };

  const commitEdit = async () => {
    if (!editingCell || !projectId || !bomId) return;
    const numVal = parseFloat(editValue) || 0;
    try {
      await bomApi.updateProduct(projectId, bomId, editingCell.productId, {
        [editingCell.field]: numVal,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingCell.productId ? { ...p, [editingCell.field]: numVal } : p,
        ),
      );
    } catch {
      // handle error
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleFinalize = async () => {
    if (!projectId || !bomId) return;
    try {
      const updated = await bomApi.updateBOM(projectId, bomId, { status: 'finalized' });
      setBom(updated);
    } catch {
      // handle error
    }
  };

  const totalExtended = products.reduce((sum, p) => sum + calcExtendedPrice(p), 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!bom) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-text-muted">BOM not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Project
        </button>

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{bom.name}</h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-gray-700 text-gray-300">
              {bom.bomNumber}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[bom.status] ?? ''}`}>
              {bom.status}
            </span>
            {bom.isPrimary && (
              <span className="flex items-center gap-1 text-yellow-500 text-xs font-medium">
                <StarIcon className="h-4 w-4" /> Primary
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => importRef.current?.click()}
              isLoading={importing}
            >
              <CloudArrowUpIcon className="h-4 w-4 mr-1" />
              {importing ? 'Importing...' : 'Import File'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowAddRow(true)}>
              <PlusIcon className="h-4 w-4 mr-1" /> Add Product
            </Button>
            {bom.status !== 'finalized' && (
              <Button size="sm" onClick={handleFinalize}>
                <CheckIcon className="h-4 w-4 mr-1" /> Finalize
              </Button>
            )}
            <input
              ref={importRef}
              type="file"
              accept=".xls,.xlsx,.csv,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = '';
              }}
            />
          </div>
        </div>

        {/* Import loading */}
        {importing && (
          <div className="flex items-center gap-3 bg-[#1a1a2e] border border-gray-700 rounded-lg p-4">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
            <p className="text-sm text-gray-300">Extracting products from file...</p>
          </div>
        )}

        {/* Products table */}
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1a1a2e] border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-3 font-medium">Type</th>
                <th className="text-left py-3 px-3 font-medium">Manufacturer</th>
                <th className="text-left py-3 px-3 font-medium">Model Number</th>
                <th className="text-right py-3 px-3 font-medium">Qty</th>
                <th className="text-left py-3 px-3 font-medium">Description</th>
                <th className="text-right py-3 px-3 font-medium">Cost ($)</th>
                <th className="text-right py-3 px-3 font-medium">Disc (%)</th>
                <th className="text-right py-3 px-3 font-medium">Margin (%)</th>
                <th className="text-right py-3 px-3 font-medium">Ext. Price</th>
                <th className="text-right py-3 px-3 font-medium w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className={`border-b border-gray-800 hover:bg-[#1a1a2e]/50 transition-colors ${
                    importedIds.has(product.id) ? 'bg-green-900/10' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 text-gray-300">{product.type}</td>
                  <td className="py-2.5 px-3 text-white">{product.manufacturer}</td>
                  <td className="py-2.5 px-3 text-white font-mono text-xs">{product.modelNumber}</td>
                  <td className="py-2.5 px-3 text-right">
                    <EditableCell
                      value={product.quantity}
                      isEditing={editingCell?.productId === product.id && editingCell.field === 'quantity'}
                      editValue={editValue}
                      onStart={() => startEditing(product.id, 'quantity', product.quantity)}
                      onChange={setEditValue}
                      onCommit={commitEdit}
                      onCancel={() => setEditingCell(null)}
                    />
                  </td>
                  <td className="py-2.5 px-3 text-gray-300 max-w-[200px] truncate">{product.description}</td>
                  <td className="py-2.5 px-3 text-right">
                    <EditableCell
                      value={product.cost}
                      isEditing={editingCell?.productId === product.id && editingCell.field === 'cost'}
                      editValue={editValue}
                      onStart={() => startEditing(product.id, 'cost', product.cost)}
                      onChange={setEditValue}
                      onCommit={commitEdit}
                      onCancel={() => setEditingCell(null)}
                      prefix="$"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <EditableCell
                      value={product.discount}
                      isEditing={editingCell?.productId === product.id && editingCell.field === 'discount'}
                      editValue={editValue}
                      onStart={() => startEditing(product.id, 'discount', product.discount)}
                      onChange={setEditValue}
                      onCommit={commitEdit}
                      onCancel={() => setEditingCell(null)}
                      suffix="%"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <EditableCell
                      value={product.margin}
                      isEditing={editingCell?.productId === product.id && editingCell.field === 'margin'}
                      editValue={editValue}
                      onStart={() => startEditing(product.id, 'margin', product.margin)}
                      onChange={setEditValue}
                      onCommit={commitEdit}
                      onCancel={() => setEditingCell(null)}
                      suffix="%"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right text-white font-medium">
                    {formatCurrency(calcExtendedPrice(product))}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {importedIds.has(product.id) && (
                        <span className="text-xs text-green-400 font-medium mr-1">Imported</span>
                      )}
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400"
                        aria-label="Delete product"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Add product row */}
              {showAddRow && (
                <tr className="border-b border-gray-800 bg-[#1a1a2e]/30">
                  <td className="py-2 px-3">
                    <select
                      value={newProduct.type}
                      onChange={(e) => setNewProduct((p) => ({ ...p, type: e.target.value }))}
                      className="w-full bg-transparent border border-gray-600 rounded px-1 py-1 text-sm text-white focus:outline-none focus:border-primary"
                    >
                      {PRODUCT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      value={newProduct.manufacturer}
                      onChange={(e) => setNewProduct((p) => ({ ...p, manufacturer: e.target.value }))}
                      placeholder="Manufacturer"
                      className="w-full bg-transparent border border-gray-600 rounded px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      value={newProduct.modelNumber}
                      onChange={(e) => setNewProduct((p) => ({ ...p, modelNumber: e.target.value }))}
                      placeholder="Model #"
                      className="w-full bg-transparent border border-gray-600 rounded px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary font-mono"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct((p) => ({ ...p, quantity: parseInt(e.target.value) || 0 }))}
                      className="w-16 bg-transparent border border-gray-600 rounded px-2 py-1 text-sm text-white text-right focus:outline-none focus:border-primary"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      value={newProduct.description}
                      onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Description"
                      className="w-full bg-transparent border border-gray-600 rounded px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={newProduct.cost}
                      onChange={(e) => setNewProduct((p) => ({ ...p, cost: parseFloat(e.target.value) || 0 }))}
                      className="w-20 bg-transparent border border-gray-600 rounded px-2 py-1 text-sm text-white text-right focus:outline-none focus:border-primary"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={newProduct.discount}
                      onChange={(e) => setNewProduct((p) => ({ ...p, discount: parseFloat(e.target.value) || 0 }))}
                      className="w-16 bg-transparent border border-gray-600 rounded px-2 py-1 text-sm text-white text-right focus:outline-none focus:border-primary"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={newProduct.margin}
                      onChange={(e) => setNewProduct((p) => ({ ...p, margin: parseFloat(e.target.value) || 0 }))}
                      className="w-16 bg-transparent border border-gray-600 rounded px-2 py-1 text-sm text-white text-right focus:outline-none focus:border-primary"
                    />
                  </td>
                  <td className="py-2 px-3 text-right text-gray-500">--</td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={handleAddProduct}
                        className="p-1 rounded hover:bg-gray-700 text-green-400 hover:text-green-300"
                        aria-label="Save product"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setShowAddRow(false); setNewProduct(emptyProduct()); }}
                        className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
                        aria-label="Cancel"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty state */}
              {products.length === 0 && !showAddRow && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-500 text-sm">
                    No products yet. Add products manually or import from a file.
                  </td>
                </tr>
              )}
            </tbody>

            {/* Totals footer */}
            {products.length > 0 && (
              <tfoot>
                <tr className="bg-[#1a1a2e] border-t border-gray-700">
                  <td colSpan={8} className="py-3 px-3 text-right text-sm font-semibold text-gray-300">
                    Total
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-bold text-white">
                    {formatCurrency(totalExtended)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* Inline editable cell */
function EditableCell({
  value,
  isEditing,
  editValue,
  onStart,
  onChange,
  onCommit,
  onCancel,
  prefix,
  suffix,
}: {
  value: number;
  isEditing: boolean;
  editValue: string;
  onStart: () => void;
  onChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  prefix?: string;
  suffix?: string;
}) {
  if (isEditing) {
    return (
      <input
        type="number"
        value={editValue}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); onCommit(); }
          if (e.key === 'Escape') onCancel();
        }}
        autoFocus
        className="w-20 bg-transparent border border-primary rounded px-1 py-0.5 text-sm text-white text-right focus:outline-none"
      />
    );
  }

  return (
    <button
      onClick={onStart}
      className="text-white hover:text-primary cursor-pointer transition-colors group"
      title="Click to edit"
    >
      {prefix}{value}{suffix}
      <PencilIcon className="h-3 w-3 ml-1 inline opacity-0 group-hover:opacity-100 text-gray-500" />
    </button>
  );
}

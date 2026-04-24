import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import type { LineItem } from '@/types/domain';

interface LineItemTableProps {
  items: LineItem[];
  editable?: boolean;
  showManufacturer?: boolean;
  onChange?: (items: LineItem[]) => void;
}

function generateId(): string {
  return `li_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export default function LineItemTable({
  items,
  editable = false,
  showManufacturer = false,
  onChange,
}: LineItemTableProps) {
  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    if (!onChange) return;
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    item.total = item.quantity * item.unitPrice;
    updated[index] = item;
    onChange(updated);
  };

  const addItem = () => {
    if (!onChange) return;
    const newItem: LineItem = {
      id: generateId(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      unit: 'ea',
      total: 0,
    };
    onChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (!onChange) return;
    onChange(items.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (!onChange) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    const updated = [...items];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 text-left text-text-muted">
            {editable && <th className="pb-3 pr-2 w-10" />}
            <th className="pb-3 pr-4 font-medium">Description</th>
            {showManufacturer && (
              <>
                <th className="pb-3 pr-4 font-medium w-32">Manufacturer</th>
                <th className="pb-3 pr-4 font-medium w-32">Part #</th>
              </>
            )}
            <th className="pb-3 pr-4 font-medium w-20 text-right">Qty</th>
            <th className="pb-3 pr-4 font-medium w-16">Unit</th>
            <th className="pb-3 pr-4 font-medium w-28 text-right">Unit Price</th>
            <th className="pb-3 font-medium w-28 text-right">Total</th>
            {editable && <th className="pb-3 w-10" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {items.map((item, idx) => (
            <tr
              key={item.id}
              className="group hover:bg-surface-hover/50 transition-colors"
            >
              {editable && (
                <td className="py-2 pr-2">
                  <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveItem(idx, 'up')}
                      disabled={idx === 0}
                      className="text-text-muted hover:text-text-primary disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ChevronUpIcon className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => moveItem(idx, 'down')}
                      disabled={idx === items.length - 1}
                      className="text-text-muted hover:text-text-primary disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ChevronDownIcon className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              )}
              <td className="py-2 pr-4">
                {editable ? (
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    className="w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none text-text-primary py-1"
                    placeholder="Item description"
                  />
                ) : (
                  <span className="text-text-primary">{item.description}</span>
                )}
              </td>
              {showManufacturer && (
                <>
                  <td className="py-2 pr-4">
                    {editable ? (
                      <input
                        type="text"
                        value={item.manufacturer ?? ''}
                        onChange={(e) => updateItem(idx, 'manufacturer', e.target.value)}
                        className="w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none text-text-primary py-1"
                        placeholder="Manufacturer"
                      />
                    ) : (
                      <span className="text-text-secondary">{item.manufacturer}</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {editable ? (
                      <input
                        type="text"
                        value={item.partNumber ?? ''}
                        onChange={(e) => updateItem(idx, 'partNumber', e.target.value)}
                        className="w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none text-text-primary py-1"
                        placeholder="Part #"
                      />
                    ) : (
                      <span className="text-text-secondary">{item.partNumber}</span>
                    )}
                  </td>
                </>
              )}
              <td className="py-2 pr-4 text-right">
                {editable ? (
                  <input
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)
                    }
                    className="w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none text-text-primary text-right py-1"
                  />
                ) : (
                  <span className="text-text-primary">{item.quantity}</span>
                )}
              </td>
              <td className="py-2 pr-4">
                {editable ? (
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                    className="w-16 bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none text-text-secondary py-1"
                  />
                ) : (
                  <span className="text-text-secondary">{item.unit}</span>
                )}
              </td>
              <td className="py-2 pr-4 text-right">
                {editable ? (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                    }
                    className="w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none text-text-primary text-right py-1"
                  />
                ) : (
                  <span className="text-text-primary">
                    {formatCurrency(item.unitPrice)}
                  </span>
                )}
              </td>
              <td className="py-2 text-right font-medium text-text-primary">
                {formatCurrency(item.total)}
              </td>
              {editable && (
                <td className="py-2 pl-2">
                  <button
                    onClick={() => removeItem(idx)}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all"
                    aria-label="Remove item"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {editable && (
        <button
          onClick={addItem}
          className="mt-3 flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add line item
        </button>
      )}

      {items.length === 0 && (
        <div className="py-8 text-center text-text-muted text-sm">
          No line items yet.{editable ? ' Click "Add line item" to start.' : ''}
        </div>
      )}
    </div>
  );
}

import { Fragment, useState, useRef } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  StarIcon as StarOutline,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { CreateBOMRequest } from '@/types/domain';

interface BOMEntry {
  name: string;
  isPrimary: boolean;
  priority: 'primary' | 'secondary';
  primaryCompany: string;
  primaryContact: string;
  outsideSales: string;
  secondaryCustomers: { company: string; contact: string }[];
}

interface CreateBOMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (boms: CreateBOMRequest[], file?: File) => Promise<void>;
  projectName: string;
}

function emptyBOM(): BOMEntry {
  return {
    name: '',
    isPrimary: false,
    priority: 'primary',
    primaryCompany: '',
    primaryContact: '',
    outsideSales: '',
    secondaryCustomers: [],
  };
}

export default function CreateBOMModal({
  isOpen,
  onClose,
  onSubmit,
  projectName,
}: CreateBOMModalProps) {
  const [branchLocation, setBranchLocation] = useState('');
  const [boms, setBoms] = useState<BOMEntry[]>([{ ...emptyBOM(), isPrimary: true }]);
  const [selectedBomIndex, setSelectedBomIndex] = useState(0);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedBom = boms[selectedBomIndex];

  const updateBom = (index: number, partial: Partial<BOMEntry>) => {
    setBoms((prev) => prev.map((b, i) => (i === index ? { ...b, ...partial } : b)));
  };

  const togglePrimary = (index: number) => {
    setBoms((prev) =>
      prev.map((b, i) => ({ ...b, isPrimary: i === index })),
    );
  };

  const addBom = () => {
    setBoms((prev) => [...prev, emptyBOM()]);
    setSelectedBomIndex(boms.length);
  };

  const removeBom = (index: number) => {
    if (boms.length <= 1) return;
    const updated = boms.filter((_, i) => i !== index);
    if (updated.every((b) => !b.isPrimary)) updated[0].isPrimary = true;
    setBoms(updated);
    setSelectedBomIndex(Math.min(selectedBomIndex, updated.length - 1));
  };

  const addSecondaryCustomer = () => {
    updateBom(selectedBomIndex, {
      secondaryCustomers: [...selectedBom.secondaryCustomers, { company: '', contact: '' }],
    });
  };

  const updateSecondaryCustomer = (scIndex: number, field: 'company' | 'contact', value: string) => {
    const updated = [...selectedBom.secondaryCustomers];
    updated[scIndex] = { ...updated[scIndex], [field]: value };
    updateBom(selectedBomIndex, { secondaryCustomers: updated });
  };

  const removeSecondaryCustomer = (scIndex: number) => {
    updateBom(selectedBomIndex, {
      secondaryCustomers: selectedBom.secondaryCustomers.filter((_, i) => i !== scIndex),
    });
  };

  const validate = (): boolean => {
    const errs: string[] = [];
    boms.forEach((b, i) => {
      if (!b.name.trim()) errs.push(`BOM ${i + 1} requires a name`);
    });
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const requests: CreateBOMRequest[] = boms.map((b) => ({
        name: b.name,
        branchLocation: branchLocation || undefined,
        isPrimary: b.isPrimary,
        priority: b.priority,
        primaryCompany: b.primaryCompany || undefined,
        primaryContact: b.primaryContact || undefined,
        outsideSales: b.outsideSales || undefined,
        secondaryCustomers: b.secondaryCustomers.filter((sc) => sc.company.trim()),
      }));
      await onSubmit(requests, importFile ?? undefined);
      handleClose();
    } catch {
      setErrors(['Failed to create BOM. Please try again.']);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setBranchLocation('');
    setBoms([{ ...emptyBOM(), isPrimary: true }]);
    setSelectedBomIndex(0);
    setImportFile(null);
    setErrors([]);
    onClose();
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-[#1a1a2e] border border-gray-700 shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
                  <DialogTitle className="text-lg font-semibold text-white">
                    Create Bill of Materials
                  </DialogTitle>
                  <button
                    onClick={handleClose}
                    className="rounded-md p-1 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    aria-label="Close"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                  {errors.length > 0 && (
                    <div className="rounded-md bg-red-900/30 border border-red-800 px-4 py-2">
                      {errors.map((e, i) => (
                        <p key={i} className="text-sm text-red-300">{e}</p>
                      ))}
                    </div>
                  )}

                  {/* Top fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Branch Location"
                      value={branchLocation}
                      onChange={(e) => setBranchLocation(e.target.value)}
                      placeholder="e.g. Dallas, TX"
                    />
                    <Input
                      label="Project Name"
                      value={projectName}
                      readOnly
                      className="opacity-60 cursor-not-allowed"
                    />
                  </div>

                  {/* BOM list */}
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">BOMs</p>
                    <div className="space-y-2">
                      {boms.map((b, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedBomIndex(i)}
                          className={`flex items-center gap-2 rounded-md p-2 cursor-pointer border transition-colors ${
                            i === selectedBomIndex
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-700 bg-[#0f0f0f] hover:border-gray-600'
                          }`}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); togglePrimary(i); }}
                            className="flex-shrink-0"
                            aria-label={b.isPrimary ? 'Primary BOM' : 'Set as primary'}
                          >
                            {b.isPrimary ? (
                              <StarSolid className="h-5 w-5 text-yellow-500" />
                            ) : (
                              <StarOutline className="h-5 w-5 text-gray-500 hover:text-yellow-500" />
                            )}
                          </button>
                          <input
                            value={b.name}
                            onChange={(e) => updateBom(i, { name: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={`BOM ${i + 1} name`}
                            className="flex-1 bg-transparent border-none text-sm text-white placeholder-gray-500 focus:outline-none"
                          />
                          {boms.length > 1 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); removeBom(i); }}
                              className="text-gray-500 hover:text-red-400"
                              aria-label="Remove BOM"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addBom}
                      className="mt-2 flex items-center gap-1 text-sm text-[#E50914] hover:text-red-400"
                    >
                      <PlusIcon className="h-3.5 w-3.5" /> Add BOM
                    </button>
                  </div>

                  {/* Details for selected BOM */}
                  {selectedBom && (
                    <div className="rounded-lg border border-gray-700 bg-[#0f0f0f] p-4 space-y-4">
                      <h4 className="text-sm font-semibold text-gray-300">
                        Details: {selectedBom.name || `BOM ${selectedBomIndex + 1}`}
                      </h4>

                      {/* Priority toggle */}
                      <div>
                        <p className="text-sm font-medium text-gray-400 mb-1.5">Priority</p>
                        <div className="flex gap-2">
                          {(['primary', 'secondary'] as const).map((p) => (
                            <button
                              key={p}
                              onClick={() => updateBom(selectedBomIndex, { priority: p })}
                              className={`px-3 py-1.5 rounded text-sm font-medium capitalize transition-colors ${
                                selectedBom.priority === p
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Input
                        label="BOM Name"
                        value={selectedBom.name}
                        onChange={(e) => updateBom(selectedBomIndex, { name: e.target.value })}
                        placeholder="BOM name"
                      />

                      {/* Primary Customer */}
                      <div>
                        <p className="text-sm font-medium text-gray-400 mb-2">Primary Customer</p>
                        <div className="space-y-3">
                          <Input
                            label="Company"
                            value={selectedBom.primaryCompany}
                            onChange={(e) => updateBom(selectedBomIndex, { primaryCompany: e.target.value })}
                            placeholder="Company name"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              label="Contact"
                              value={selectedBom.primaryContact}
                              onChange={(e) => updateBom(selectedBomIndex, { primaryContact: e.target.value })}
                              placeholder="Contact name"
                            />
                            <Input
                              label="Outside Sales"
                              value={selectedBom.outsideSales}
                              onChange={(e) => updateBom(selectedBomIndex, { outsideSales: e.target.value })}
                              placeholder="Sales rep"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Secondary Customers */}
                      <div>
                        <p className="text-sm font-medium text-gray-400 mb-2">Secondary Customers</p>
                        {selectedBom.secondaryCustomers.length > 0 && (
                          <div className="space-y-2">
                            {selectedBom.secondaryCustomers.map((sc, i) => (
                              <div key={i} className="flex gap-2 items-start">
                                <Input
                                  value={sc.company}
                                  onChange={(e) => updateSecondaryCustomer(i, 'company', e.target.value)}
                                  placeholder="Company"
                                />
                                <Input
                                  value={sc.contact}
                                  onChange={(e) => updateSecondaryCustomer(i, 'contact', e.target.value)}
                                  placeholder="Contact"
                                />
                                <button
                                  onClick={() => removeSecondaryCustomer(i)}
                                  className="text-gray-500 hover:text-red-400 mt-2 flex-shrink-0"
                                  aria-label="Remove"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={addSecondaryCustomer}
                          className="mt-2 flex items-center gap-1 text-sm text-[#E50914] hover:text-red-400"
                        >
                          <PlusIcon className="h-3.5 w-3.5" /> Add Secondary Customer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* File Import */}
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">Import File</p>
                    {importFile ? (
                      <div className="flex items-center gap-3 rounded-md bg-[#0f0f0f] border border-gray-700 p-3">
                        <CloudArrowUpIcon className="h-6 w-6 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{importFile.name}</p>
                          <p className="text-xs text-gray-500">
                            This file will be imported and products will be extracted automatically
                          </p>
                        </div>
                        <button
                          onClick={() => setImportFile(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-2 rounded-md border border-dashed border-gray-600 p-3 w-full text-left hover:border-gray-400 transition-colors"
                      >
                        <CloudArrowUpIcon className="h-6 w-6 text-gray-500" />
                        <span className="text-sm text-gray-400">Click to import a file (XLS, CSV, PDF)</span>
                      </button>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".xls,.xlsx,.csv,.pdf"
                      className="hidden"
                      onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-gray-700 px-6 py-4">
                  <Button variant="secondary" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} isLoading={submitting}>
                    Confirm
                  </Button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

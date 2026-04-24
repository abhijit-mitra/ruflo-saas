import { Fragment, useState, useCallback, useRef } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import {
  XMarkIcon,
  CloudArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

// ---------- Types ----------

interface Stakeholder {
  company: string;
  contact: string;
}

interface Opportunity {
  title: string;
  scopes: string[];
  quoter: string;
  projectManager: string;
  quoteDueDate: string;
  submittalDueDate: string;
  stage: string;
  priority: string;
  estimatedValue: string;
}

interface WizardData {
  // Step 1
  files: File[];
  // Step 2
  projectName: string;
  addressLine1: string;
  addressLine2: string;
  country: string;
  state: string;
  city: string;
  zip: string;
  details: string;
  stakeholders: Stakeholder[];
  projectImage: File | null;
  // Step 3
  opportunities: Opportunity[];
}

const ACCEPTED_FILE_TYPES = [
  '.xls', '.xlsx', '.xlsm', '.pdf', '.jpg', '.jpeg', '.png', '.txt',
  '.doc', '.docx', '.ppt', '.pptx', '.eml', '.msg', '.csv', '.xml', '.o2o',
];

const STAGES = [
  'Specification', 'Submittal', 'Closed-Won', 'Closed-Lost',
  'Negotiation', 'Proposal', 'Qualification',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const emptyOpportunity = (): Opportunity => ({
  title: '',
  scopes: [],
  quoter: '',
  projectManager: '',
  quoteDueDate: '',
  submittalDueDate: '',
  stage: 'Specification',
  priority: 'Medium',
  estimatedValue: '',
});

const initialData: WizardData = {
  files: [],
  projectName: '',
  addressLine1: '',
  addressLine2: '',
  country: 'US',
  state: '',
  city: '',
  zip: '',
  details: '',
  stakeholders: [{ company: '', contact: '' }],
  projectImage: null,
  opportunities: [emptyOpportunity()],
};

// ---------- Step indicators ----------

function StepIndicator({ current }: { current: number }) {
  const steps = ['Upload Files', 'Project Details', 'Opportunities'];
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((label, i) => (
        <Fragment key={label}>
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                i < current
                  ? 'bg-green-600 text-white'
                  : i === current
                  ? 'bg-[#E50914] text-white'
                  : 'bg-[#2a2a2a] text-gray-500'
              }`}
            >
              {i < current ? '✓' : i + 1}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                i === current ? 'text-white font-medium' : 'text-gray-500'
              }`}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px ${i < current ? 'bg-green-600' : 'bg-[#2a2a2a]'}`} />
          )}
        </Fragment>
      ))}
    </div>
  );
}

// ---------- Step 1: Upload Files ----------

function StepUpload({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const arr = Array.from(newFiles);
      onChange({ files: [...data.files, ...arr] });
    },
    [data.files, onChange],
  );

  const removeFile = (index: number) => {
    onChange({ files: data.files.filter((_, i) => i !== index) });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Upload RFQ documents, engineering designs, or specifications. Supported formats: XLS, XLSX, PDF, JPG, PNG, DOC, DOCX, PPT, CSV, XML, and more.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
          dragOver
            ? 'border-[#E50914] bg-[#E50914]/5'
            : 'border-gray-600 hover:border-gray-400'
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <CloudArrowUpIcon className="h-10 w-10 text-gray-500 mb-3" />
        <p className="text-sm text-gray-300 mb-1">
          Drag & drop files here
        </p>
        <p className="text-xs text-gray-500">or</p>
        <button
          type="button"
          className="mt-2 text-sm font-medium text-[#E50914] hover:text-red-400 transition-colors"
        >
          Browse your computer
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES.join(',')}
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {data.files.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {data.files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center justify-between rounded-md bg-[#1a1a2e] px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-block rounded bg-[#E50914]/20 px-1.5 py-0.5 text-xs font-mono text-[#E50914] uppercase">
                  {file.name.split('.').pop()}
                </span>
                <span className="truncate text-gray-300">{file.name}</span>
                <span className="text-gray-500 text-xs flex-shrink-0">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="text-gray-500 hover:text-red-400 ml-2"
                aria-label={`Remove ${file.name}`}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Step 2: Project Details ----------

function StepDetails({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
}) {
  const imageRef = useRef<HTMLInputElement>(null);

  const updateStakeholder = (index: number, field: keyof Stakeholder, value: string) => {
    const updated = [...data.stakeholders];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ stakeholders: updated });
  };

  const addStakeholder = () => {
    onChange({ stakeholders: [...data.stakeholders, { company: '', contact: '' }] });
  };

  const removeStakeholder = (index: number) => {
    if (data.stakeholders.length <= 1) return;
    onChange({ stakeholders: data.stakeholders.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
      <Input
        label="Project Name *"
        value={data.projectName}
        onChange={(e) => onChange({ projectName: e.target.value })}
        placeholder="e.g. Downtown Office Tower — Phase 2"
      />

      {/* Address */}
      <div>
        <p className="text-sm font-medium text-gray-300 mb-2">Address</p>
        <div className="grid grid-cols-1 gap-3">
          <Input
            label="Address Line 1"
            value={data.addressLine1}
            onChange={(e) => onChange({ addressLine1: e.target.value })}
            placeholder="Street address"
          />
          <Input
            label="Address Line 2"
            value={data.addressLine2}
            onChange={(e) => onChange({ addressLine2: e.target.value })}
            placeholder="Suite, unit, floor"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Country"
              value={data.country}
              onChange={(e) => onChange({ country: e.target.value })}
            />
            <Input
              label="State"
              value={data.state}
              onChange={(e) => onChange({ state: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={data.city}
              onChange={(e) => onChange({ city: e.target.value })}
            />
            <Input
              label="Zip Code"
              value={data.zip}
              onChange={(e) => onChange({ zip: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Details */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Details</label>
        <textarea
          value={data.details}
          onChange={(e) => onChange({ details: e.target.value })}
          rows={3}
          className="w-full rounded-md border border-gray-600 bg-[#1a1a2e] px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#E50914]/50 focus:border-[#E50914]"
          placeholder="Project description, notes..."
        />
      </div>

      {/* Stakeholders */}
      <div>
        <p className="text-sm font-medium text-gray-300 mb-2">Stakeholders</p>
        <div className="space-y-2">
          {data.stakeholders.map((s, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Input
                label={i === 0 ? 'Company' : undefined}
                value={s.company}
                onChange={(e) => updateStakeholder(i, 'company', e.target.value)}
                placeholder="Company name"
              />
              <Input
                label={i === 0 ? 'Contact' : undefined}
                value={s.contact}
                onChange={(e) => updateStakeholder(i, 'contact', e.target.value)}
                placeholder="Contact name / email"
              />
              {data.stakeholders.length > 1 && (
                <button
                  onClick={() => removeStakeholder(i)}
                  className={`text-gray-500 hover:text-red-400 flex-shrink-0 ${i === 0 ? 'mt-7' : 'mt-1'}`}
                  aria-label="Remove stakeholder"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addStakeholder}
          className="mt-2 flex items-center gap-1 text-sm text-[#E50914] hover:text-red-400"
        >
          <PlusIcon className="h-3.5 w-3.5" /> Add Another
        </button>
      </div>

      {/* Project Image */}
      <div>
        <p className="text-sm font-medium text-gray-300 mb-2">Project Image</p>
        <div
          onClick={() => imageRef.current?.click()}
          className="flex items-center gap-3 rounded-md border border-dashed border-gray-600 p-3 cursor-pointer hover:border-gray-400 transition-colors"
        >
          {data.projectImage ? (
            <img
              src={URL.createObjectURL(data.projectImage)}
              alt="Preview"
              className="h-12 w-12 rounded object-cover"
            />
          ) : (
            <PhotoIcon className="h-10 w-10 text-gray-500" />
          )}
          <div>
            <p className="text-sm text-gray-300">
              {data.projectImage ? data.projectImage.name : 'Click to upload (PNG, JPG)'}
            </p>
          </div>
        </div>
        <input
          ref={imageRef}
          type="file"
          accept=".png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => onChange({ projectImage: e.target.files?.[0] ?? null })}
        />
      </div>
    </div>
  );
}

// ---------- Step 3: Opportunities ----------

function StepOpportunities({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
}) {
  const update = (index: number, field: keyof Opportunity, value: string | string[]) => {
    const updated = [...data.opportunities];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ opportunities: updated });
  };

  const addOpportunity = () => {
    onChange({ opportunities: [...data.opportunities, emptyOpportunity()] });
  };

  const removeOpportunity = (index: number) => {
    if (data.opportunities.length <= 1) return;
    onChange({ opportunities: data.opportunities.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      {data.opportunities.map((opp, i) => (
        <div key={i} className="rounded-lg border border-gray-700 bg-[#0f0f0f] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-300">Opportunity {i + 1}</h4>
            {data.opportunities.length > 1 && (
              <button
                onClick={() => removeOpportunity(i)}
                className="text-gray-500 hover:text-red-400"
                aria-label="Remove opportunity"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          <Input
            label="Title *"
            value={opp.title}
            onChange={(e) => update(i, 'title', e.target.value)}
            placeholder="Opportunity title"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Scope(s)</label>
            <input
              value={opp.scopes.join(', ')}
              onChange={(e) =>
                update(i, 'scopes', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))
              }
              className="w-full rounded-md border border-gray-600 bg-[#1a1a2e] px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#E50914]/50"
              placeholder="Comma-separated: Lighting, HVAC, Electrical"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quoter"
              value={opp.quoter}
              onChange={(e) => update(i, 'quoter', e.target.value)}
              placeholder="Quoter name"
            />
            <Input
              label="Project Manager"
              value={opp.projectManager}
              onChange={(e) => update(i, 'projectManager', e.target.value)}
              placeholder="PM name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Quote Due Date</label>
              <input
                type="date"
                value={opp.quoteDueDate}
                onChange={(e) => update(i, 'quoteDueDate', e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-[#1a1a2e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#E50914]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Submittal Due Date</label>
              <input
                type="date"
                value={opp.submittalDueDate}
                onChange={(e) => update(i, 'submittalDueDate', e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-[#1a1a2e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#E50914]/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Stage</label>
              <select
                value={opp.stage}
                onChange={(e) => update(i, 'stage', e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-[#1a1a2e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#E50914]/50"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
              <select
                value={opp.priority}
                onChange={(e) => update(i, 'priority', e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-[#1a1a2e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#E50914]/50"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <Input
              label="Est. Value ($)"
              value={opp.estimatedValue}
              onChange={(e) => update(i, 'estimatedValue', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
      ))}

      <button
        onClick={addOpportunity}
        className="flex items-center gap-1 text-sm text-[#E50914] hover:text-red-400 font-medium"
      >
        <PlusIcon className="h-3.5 w-3.5" /> Add Another Opportunity
      </button>
    </div>
  );
}

// ---------- Main Wizard ----------

interface CreateProjectWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WizardData) => Promise<void>;
}

export type { WizardData };

export default function CreateProjectWizard({ isOpen, onClose, onSubmit }: CreateProjectWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({ ...initialData });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const updateData = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
    setErrors([]);
  }, []);

  const validateStep = (): boolean => {
    const errs: string[] = [];
    if (step === 1) {
      if (!data.projectName.trim()) errs.push('Project name is required');
    }
    if (step === 2) {
      if (data.opportunities.some((o) => !o.title.trim())) {
        errs.push('All opportunities must have a title');
      }
    }
    setErrors(errs);
    return errs.length === 0;
  };

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, 2));
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      await onSubmit(data);
      setData({ ...initialData });
      setStep(0);
      onClose();
    } catch {
      setErrors(['Failed to create project. Please try again.']);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setData({ ...initialData });
    setStep(0);
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
                    Create New Project
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
                <div className="px-6 py-5">
                  <StepIndicator current={step} />

                  {errors.length > 0 && (
                    <div className="mb-4 rounded-md bg-red-900/30 border border-red-800 px-4 py-2">
                      {errors.map((e, i) => (
                        <p key={i} className="text-sm text-red-300">{e}</p>
                      ))}
                    </div>
                  )}

                  {step === 0 && <StepUpload data={data} onChange={updateData} />}
                  {step === 1 && <StepDetails data={data} onChange={updateData} />}
                  {step === 2 && <StepOpportunities data={data} onChange={updateData} />}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-700 px-6 py-4">
                  <div>
                    {step > 0 && (
                      <Button variant="secondary" onClick={prev}>
                        <ChevronLeftIcon className="h-4 w-4 mr-1" /> Back
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleClose}>
                      Cancel
                    </Button>
                    {step < 2 ? (
                      <Button onClick={next}>
                        Next <ChevronRightIcon className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Button onClick={handleSubmit} isLoading={submitting}>
                        Create Project
                      </Button>
                    )}
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

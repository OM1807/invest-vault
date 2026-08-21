import { FormEvent, useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { TextInput, TextArea, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { fieldError, getFieldErrors, getGenericError } from '@/lib/api';
import type { FieldErrors, Startup, StartupPayload, StartupStatus } from '@/lib/types';

const SECTORS = ['SaaS', 'Fintech', 'Healthtech', 'AI/ML', 'Climate', 'Consumer', 'Web3', 'DevTools', 'Marketplace', 'Hardware', 'EdTech', 'Other'];

interface StartupFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: StartupPayload) => Promise<void>;
  startup?: Startup | null;
}

const empty: StartupPayload = {
  name: '', tagline: '', description: '', sector: 'SaaS', website_url: '', pitch_deck_url: '', target_amount: '', equity_offered: '', status: 'draft',
};

export default function StartupFormModal({ open, onClose, onSubmit, startup }: StartupFormModalProps) {
  const [form, setForm] = useState<StartupPayload>(empty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (startup) {
      setForm({
        name: startup.name, tagline: startup.tagline, description: startup.description, sector: startup.sector,
        website_url: startup.website_url, pitch_deck_url: startup.pitch_deck_url, target_amount: startup.target_amount,
        equity_offered: startup.equity_offered, status: startup.status,
      });
    } else {
      setForm(empty);
    }
    setErrors({});
    setGenericError(null);
  }, [startup, open]);

  const set = <K extends keyof StartupPayload>(key: K, value: StartupPayload[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGenericError(null);
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setErrors(getFieldErrors(err));
      setGenericError(getGenericError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={startup ? 'Edit startup' : 'Create startup'} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-3">
        {genericError && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{genericError}</div>}
        <TextInput label="Name" placeholder="Acme Inc." value={form.name} onChange={(e) => set('name', e.target.value)} error={fieldError(errors, 'name')} />
        <TextInput label="Tagline" placeholder="Building the future of..." value={form.tagline} onChange={(e) => set('tagline', e.target.value)} error={fieldError(errors, 'tagline')} />
        <TextArea label="Description" placeholder="Tell investors what you're building..." rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} error={fieldError(errors, 'description')} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Sector" value={form.sector} onChange={(e) => set('sector', e.target.value)} error={fieldError(errors, 'sector')}>
            {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={(e) => set('status', e.target.value as StartupStatus)} error={fieldError(errors, 'status')}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Target amount ($)" type="number" placeholder="500000" value={form.target_amount} onChange={(e) => set('target_amount', e.target.value)} error={fieldError(errors, 'target_amount')} />
          <TextInput label="Equity offered (%)" type="number" placeholder="10" value={form.equity_offered} onChange={(e) => set('equity_offered', e.target.value)} error={fieldError(errors, 'equity_offered')} />
        </div>
        <TextInput label="Website URL" placeholder="https://acme.com" value={form.website_url} onChange={(e) => set('website_url', e.target.value)} error={fieldError(errors, 'website_url')} />
        <TextInput label="Pitch deck URL" placeholder="https://docs.google.com/..." value={form.pitch_deck_url} onChange={(e) => set('pitch_deck_url', e.target.value)} error={fieldError(errors, 'pitch_deck_url')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{startup ? 'Save changes' : 'Create startup'}</Button>
        </div>
      </form>
    </Modal>
  );
}

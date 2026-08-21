import { FormEvent, useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { TextInput, TextArea, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { fieldError, getFieldErrors, getGenericError } from '@/lib/api';
import type { FieldErrors, FundingRound, FundingRoundPayload, RoundStatus } from '@/lib/types';

interface RoundFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: FundingRoundPayload) => Promise<void>;
  startupId: number;
  round?: FundingRound | null;
}

const empty = (startupId: number): FundingRoundPayload => ({
  startup: startupId, name: '', description: '', target_amount: '', minimum_ticket_size: '', maximum_ticket_size: '', status: 'open',
});

export default function RoundFormModal({ open, onClose, onSubmit, startupId, round }: RoundFormModalProps) {
  const [form, setForm] = useState<FundingRoundPayload>(empty(startupId));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (round) {
      setForm({ startup: round.startup, name: round.name, description: round.description, target_amount: round.target_amount, minimum_ticket_size: round.minimum_ticket_size, maximum_ticket_size: round.maximum_ticket_size, status: round.status });
    } else {
      setForm(empty(startupId));
    }
    setErrors({});
    setGenericError(null);
  }, [round, startupId, open]);

  const set = <K extends keyof FundingRoundPayload>(key: K, value: FundingRoundPayload[K]) => setForm((f) => ({ ...f, [key]: value }));

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
    <Modal open={open} onClose={onClose} title={round ? 'Edit funding round' : 'Open funding round'} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-3">
        {genericError && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{genericError}</div>}
        <TextInput label="Round name" placeholder="Seed Round" value={form.name} onChange={(e) => set('name', e.target.value)} error={fieldError(errors, 'name')} />
        <TextArea label="Description" placeholder="What will this round fund?" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} error={fieldError(errors, 'description')} />
        <TextInput label="Target amount ($)" type="number" placeholder="1000000" value={form.target_amount} onChange={(e) => set('target_amount', e.target.value)} error={fieldError(errors, 'target_amount')} />
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Min ticket ($)" type="number" placeholder="25000" value={form.minimum_ticket_size} onChange={(e) => set('minimum_ticket_size', e.target.value)} error={fieldError(errors, 'minimum_ticket_size')} />
          <TextInput label="Max ticket ($)" type="number" placeholder="250000" value={form.maximum_ticket_size} onChange={(e) => set('maximum_ticket_size', e.target.value)} error={fieldError(errors, 'maximum_ticket_size')} />
        </div>
        <Select label="Status" value={form.status} onChange={(e) => set('status', e.target.value as RoundStatus)} error={fieldError(errors, 'status')}>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="funded">Funded</option>
        </Select>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{round ? 'Save changes' : 'Open round'}</Button>
        </div>
      </form>
    </Modal>
  );
}

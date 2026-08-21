import { FormEvent, useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { TextInput, TextArea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { fieldError, getFieldErrors, getGenericError } from '@/lib/api';
import type { BidPayload, FieldErrors, FundingRound } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface BidFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: BidPayload) => Promise<void>;
  round: FundingRound;
}

export default function BidFormModal({ open, onClose, onSubmit, round }: BidFormModalProps) {
  const [amount, setAmount] = useState('');
  const [equityRequested, setEquityRequested] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAmount(''); setEquityRequested(''); setMessage(''); setErrors({}); setGenericError(null);
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({}); setGenericError(null); setLoading(true);
    try {
      await onSubmit({ funding_round: round.id, amount, equity_requested: equityRequested, message });
      onClose();
    } catch (err) {
      setErrors(getFieldErrors(err));
      setGenericError(getGenericError(err));
    } finally {
      setLoading(false);
    }
  };

  const min = parseFloat(round.minimum_ticket_size) || 0;
  const max = parseFloat(round.maximum_ticket_size) || 0;

  return (
    <Modal open={open} onClose={onClose} title="Place a bid" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-3">
        {genericError && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{genericError}</div>}
        <div className="rounded-md border border-white/10 bg-ink-800 px-3 py-2 text-xs text-slate-300">
          {min && max ? `Tickets between ${formatCurrency(min)} and ${formatCurrency(max)}` : 'No ticket size limits set'}
        </div>
        <TextInput label="Investment amount ($)" type="number" placeholder={String(min || '')} value={amount} onChange={(e) => setAmount(e.target.value)} error={fieldError(errors, 'amount')} />
        <TextInput label="Equity requested (%)" type="number" placeholder="5" value={equityRequested} onChange={(e) => setEquityRequested(e.target.value)} error={fieldError(errors, 'equity_requested')} />
        <TextArea label="Message to founder" placeholder="Why are you interested?" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} error={fieldError(errors, 'message')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Submit bid</Button>
        </div>
      </form>
    </Modal>
  );
}

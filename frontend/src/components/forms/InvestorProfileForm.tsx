import { FormEvent, useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { TextInput, TextArea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { fieldError, getFieldErrors, getGenericError } from '@/lib/api';
import type { FieldErrors, InvestorProfile, InvestorProfilePayload } from '@/lib/types';

interface InvestorProfileFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: InvestorProfilePayload) => Promise<void>;
  profile?: InvestorProfile | null;
}

const empty: InvestorProfilePayload = { firm_name: '', headline: '', bio: '', investment_focus: '', min_ticket_size: '', max_ticket_size: '', website_url: '' };

export default function InvestorProfileForm({ open, onClose, onSubmit, profile }: InvestorProfileFormProps) {
  const [form, setForm] = useState<InvestorProfilePayload>(empty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({ firm_name: profile.firm_name, headline: profile.headline, bio: profile.bio, investment_focus: profile.investment_focus, min_ticket_size: profile.min_ticket_size, max_ticket_size: profile.max_ticket_size, website_url: profile.website_url });
    } else { setForm(empty); }
    setErrors({}); setGenericError(null);
  }, [profile, open]);

  const set = <K extends keyof InvestorProfilePayload>(key: K, value: InvestorProfilePayload[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({}); setGenericError(null); setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setErrors(getFieldErrors(err));
      setGenericError(getGenericError(err));
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Investor profile" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        {genericError && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{genericError}</div>}
        <TextInput label="Firm name" placeholder="Acme Capital" value={form.firm_name} onChange={(e) => set('firm_name', e.target.value)} error={fieldError(errors, 'firm_name')} />
        <TextInput label="Headline" placeholder="Partner at Acme Capital" value={form.headline} onChange={(e) => set('headline', e.target.value)} error={fieldError(errors, 'headline')} />
        <TextArea label="Bio" placeholder="Tell your story..." rows={3} value={form.bio} onChange={(e) => set('bio', e.target.value)} error={fieldError(errors, 'bio')} />
        <TextInput label="Investment focus" placeholder="SaaS, AI/ML, Climate" value={form.investment_focus} onChange={(e) => set('investment_focus', e.target.value)} error={fieldError(errors, 'investment_focus')} />
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Min ticket ($)" type="number" placeholder="25000" value={form.min_ticket_size} onChange={(e) => set('min_ticket_size', e.target.value)} error={fieldError(errors, 'min_ticket_size')} />
          <TextInput label="Max ticket ($)" type="number" placeholder="250000" value={form.max_ticket_size} onChange={(e) => set('max_ticket_size', e.target.value)} error={fieldError(errors, 'max_ticket_size')} />
        </div>
        <TextInput label="Website" placeholder="https://acmecapital.com" value={form.website_url} onChange={(e) => set('website_url', e.target.value)} error={fieldError(errors, 'website_url')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Save profile</Button>
        </div>
      </form>
    </Modal>
  );
}

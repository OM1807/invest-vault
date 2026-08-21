import { FormEvent, useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { TextInput, TextArea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { fieldError, getFieldErrors, getGenericError } from '@/lib/api';
import type { FieldErrors, FounderProfile, FounderProfilePayload } from '@/lib/types';

interface FounderProfileFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: FounderProfilePayload) => Promise<void>;
  profile?: FounderProfile | null;
}

const empty: FounderProfilePayload = { company_name: '', headline: '', bio: '', website_url: '', location: '' };

export default function FounderProfileForm({ open, onClose, onSubmit, profile }: FounderProfileFormProps) {
  const [form, setForm] = useState<FounderProfilePayload>(empty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({ company_name: profile.company_name, headline: profile.headline, bio: profile.bio, website_url: profile.website_url, location: profile.location });
    } else { setForm(empty); }
    setErrors({}); setGenericError(null);
  }, [profile, open]);

  const set = <K extends keyof FounderProfilePayload>(key: K, value: FounderProfilePayload[K]) => setForm((f) => ({ ...f, [key]: value }));

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
    <Modal open={open} onClose={onClose} title="Founder profile" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        {genericError && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{genericError}</div>}
        <TextInput label="Company name" placeholder="Acme Inc." value={form.company_name} onChange={(e) => set('company_name', e.target.value)} error={fieldError(errors, 'company_name')} />
        <TextInput label="Headline" placeholder="Founder & CEO" value={form.headline} onChange={(e) => set('headline', e.target.value)} error={fieldError(errors, 'headline')} />
        <TextArea label="Bio" placeholder="Tell your story..." rows={4} value={form.bio} onChange={(e) => set('bio', e.target.value)} error={fieldError(errors, 'bio')} />
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Location" placeholder="San Francisco, CA" value={form.location} onChange={(e) => set('location', e.target.value)} error={fieldError(errors, 'location')} />
          <TextInput label="Website" placeholder="https://acme.com" value={form.website_url} onChange={(e) => set('website_url', e.target.value)} error={fieldError(errors, 'website_url')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Save profile</Button>
        </div>
      </form>
    </Modal>
  );
}

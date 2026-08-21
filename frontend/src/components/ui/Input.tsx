import { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

interface FieldProps {
  label?: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-slate-400">{label}</label>}
      {children}
      {error ? (
        <p className="text-xs text-rose-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  hint?: string;
}

export function TextInput({ label, error, hint, className = '', ...rest }: TextInputProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      <input
        className={`input-base ${error ? 'border-rose-500/60' : ''} ${className}`}
        {...rest}
      />
    </Field>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  hint?: string;
}

export function TextArea({ label, error, hint, className = '', ...rest }: TextAreaProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      <textarea className={`input-base resize-none ${error ? 'border-rose-500/60' : ''} ${className}`} {...rest} />
    </Field>
  );
}

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}

export function Select({ label, error, hint, className = '', children, ...rest }: SelectProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      <select className={`input-base ${error ? 'border-rose-500/60' : ''} ${className}`} {...rest}>
        {children}
      </select>
    </Field>
  );
}

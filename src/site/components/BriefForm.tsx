'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FocusEvent, type FormEvent } from 'react';
import { services } from '../content/services';
import Button from './Button';
import s from './BriefForm.module.css';

const needs = [
  ...services.map((x) => ({ value: x.slug, label: x.name })),
  { value: 'nearshore', label: 'Nearshore engineer / sprint' },
  { value: 'agency', label: 'Agency / white-label partnership' },
  { value: 'not-sure', label: 'Not sure yet' },
];

type Field = HTMLInputElement | HTMLTextAreaElement;
const messages: Record<string, (el: Field) => string> = {
  name: (el) => (el.value.trim() ? '' : 'Please tell us your name.'),
  email: (el) =>
    !el.value.trim() ? 'We need an email to reply to.' : el.validity.typeMismatch ? 'That email address doesn’t look complete.' : '',
  website: (el) => (el.value && el.validity.typeMismatch ? 'Use a full address, like https://example.com.' : ''),
  message: (el) => (el.value.trim().length >= 10 ? '' : 'A sentence or two helps us prepare. At least 10 characters.'),
};

/** Posts JSON to the backend's POST /api/briefs. Validation here is for the user; the backend validates again. */
export default function BriefForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ tone: '' | 'err'; text: string }>({ tone: '', text: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const els = formRef.current?.elements;
    const ts = els?.namedItem('ts') as HTMLInputElement | null;
    if (ts) ts.value = String(Math.floor(Date.now() / 1000));
    // Preselect "What do you need?" from ?service=…
    const want = new URLSearchParams(location.search).get('service');
    const need = els?.namedItem('need') as HTMLSelectElement | null;
    if (want && need && [...need.options].some((o) => o.value === want)) need.value = want;
  }, []);

  const check = (el: Field) => {
    const fn = messages[el.name];
    if (!fn) return true;
    const msg = fn(el);
    setErrors((e) => ({ ...e, [el.name]: msg }));
    return !msg;
  };

  const onBlur = (e: FocusEvent<HTMLFormElement>) => {
    const el = e.target as EventTarget as Field;
    if (el.name in messages && (el.name in errors || el.value)) check(el);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const bad = ['name', 'email', 'website', 'message'].map((n) => form.elements.namedItem(n) as Field).filter((el) => !check(el));
    if (bad.length) {
      bad[0].focus();
      setStatus({ tone: 'err', text: `Please fix ${bad.length} field${bad.length > 1 ? 's' : ''} above.` });
      return;
    }
    setSending(true);
    setStatus({ tone: '', text: 'Sending…' });
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/briefs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong.');
      router.push('/book/thanks');
    } catch (err) {
      setStatus({ tone: 'err', text: `${(err as Error).message} You can also email us directly.` });
      setSending(false);
    }
  };

  const err = (name: string) => ({
    'aria-invalid': name in errors ? Boolean(errors[name]) : undefined,
  });

  return (
    <form ref={formRef} className={s.brief} noValidate onSubmit={onSubmit} onBlur={onBlur}>
      <div className={s.brief__row}>
        <div className={s.f}>
          <label htmlFor="f-name">Name <span aria-hidden="true">*</span></label>
          <input id="f-name" name="name" type="text" autoComplete="name" required maxLength={120} aria-describedby="e-name" {...err('name')} />
          <p className={s.f__err} id="e-name">{errors.name}</p>
        </div>
        <div className={s.f}>
          <label htmlFor="f-email">Work email <span aria-hidden="true">*</span></label>
          <input id="f-email" name="email" type="email" autoComplete="email" required maxLength={160} aria-describedby="e-email" {...err('email')} />
          <p className={s.f__err} id="e-email">{errors.email}</p>
        </div>
      </div>
      <div className={s.brief__row}>
        <div className={s.f}>
          <label htmlFor="f-company">Company</label>
          <input id="f-company" name="company" type="text" autoComplete="organization" maxLength={160} />
        </div>
        <div className={s.f}>
          <label htmlFor="f-website">Website</label>
          <input id="f-website" name="website" type="url" inputMode="url" placeholder="https://" maxLength={200} aria-describedby="e-website" {...err('website')} />
          <p className={s.f__err} id="e-website">{errors.website}</p>
        </div>
      </div>
      <div className={s.brief__row}>
        <div className={s.f}>
          <label htmlFor="f-need">What do you need?</label>
          <select id="f-need" name="need">
            {needs.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
        </div>
        <div className={s.f}>
          <label htmlFor="f-timeline">Timeline</label>
          <select id="f-timeline" name="timeline">
            <option value="asap">As soon as possible</option>
            <option value="month">This month</option>
            <option value="quarter">This quarter</option>
            <option value="exploring">Just exploring</option>
          </select>
        </div>
      </div>
      <div className={s.f}>
        <label htmlFor="f-message">What’s going on? <span aria-hidden="true">*</span></label>
        <textarea id="f-message" name="message" rows={5} required maxLength={5000} aria-describedby="h-message e-message" {...err('message')} />
        <p className={s.f__hint} id="h-message">A demand letter, a broken integration, a team that needs another senior engineer: a few lines is plenty.</p>
        <p className={s.f__err} id="e-message">{errors.message}</p>
      </div>

      {/* Spam traps: a field humans never see, and the time the form was rendered. */}
      <div className={s.hp} aria-hidden="true">
        <label htmlFor="f-hp">Leave this empty</label>
        <input id="f-hp" name="company_site" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="ts" />

      <p className={s.brief__consent}>
        We use these details only to reply to you. See our <Link href="/legal/privacy-policy">privacy policy</Link>.
      </p>

      <div className={s.brief__actions}>
        <Button type="submit" size="lg" disabled={sending}>Send the brief</Button>
        <p className={s.brief__status} role="status" aria-live="polite" data-tone={status.tone}>{status.text}</p>
      </div>
    </form>
  );
}

'use client';
// The destination of every primary CTA. With site.formEndpoint set, the form posts JSON there;
// without it, it opens a pre-filled email to site.email so a submission is never lost.
import { useState, type FormEvent } from 'react';
import { services, site } from '@/data/site';

type State = 'idle' | 'sending' | 'sent' | 'mailto' | 'error';

export function ContactForm() {
  const [state, setState] = useState<State>('idle');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;

    if (!site.formEndpoint) {
      const body = [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Company: ${data.company || '-'}`,
        `Interested in: ${data.service}`,
        '',
        data.message,
      ].join('\n');
      location.href = `mailto:${site.email}?subject=${encodeURIComponent(site.cta.subject)}&body=${encodeURIComponent(body)}`;
      setState('mailto');
      return;
    }

    setState('sending');
    try {
      const res = await fetch(site.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setState('sent');
    } catch {
      setState('error');
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="form__row">
        <label className="field">
          <span className="field__label">name</span>
          <input name="name" autoComplete="name" required />
        </label>
        <label className="field">
          <span className="field__label">work email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
      </div>
      <div className="form__row">
        <label className="field">
          <span className="field__label">company <span className="field__opt">(optional)</span></span>
          <input name="company" autoComplete="organization" />
        </label>
        <label className="field">
          <span className="field__label">what do you need?</span>
          <select name="service" defaultValue="not sure yet">
            {services.map((s) => <option key={s.slug} value={s.tab}>{s.tab}</option>)}
            <option value="not sure yet">not sure yet</option>
          </select>
        </label>
      </div>
      <label className="field">
        <span className="field__label">what do you want to build or improve?</span>
        <textarea name="message" rows={4} required />
      </label>
      <div className="form__foot">
        <button className="btn btn--ink" type="submit" data-fill disabled={state === 'sending'}>
          <span className="btn__fill" aria-hidden="true" />
          <span className="btn__label">{state === 'sending' ? 'sending…' : site.cta.primary}</span>
          <span className="btn__arrow" aria-hidden="true">→</span>
        </button>
        <p className="form__status" role="status">
          {state === 'sent' && "Thanks, your message is in. We'll reply by email."}
          {state === 'mailto' && `Your email app should open with the details filled in. If it doesn't, write to ${site.email}.`}
          {state === 'error' && `That didn't send. Please try again, or write to ${site.email}.`}
        </p>
      </div>
    </form>
  );
}

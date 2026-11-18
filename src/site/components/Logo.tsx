const d = 'M32 22V5a5 5 0 0 0-5-5H5a5 5 0 0 0-5 5v22a5 5 0 0 0 5 5h22a5 5 0 0 0 5-5H5V5h22v12h-6v-6H11v11z';

/** Symbol + wordmark in the current text color. */
export default function Logo({ className }: { className?: string }) {
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55em', lineHeight: 1 }}>
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" style={{ width: '1.6em', height: '1.6em', flex: 'none' }}>
        <path d={d} fill="currentColor" />
      </svg>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.35em', letterSpacing: '-0.01em' }}>E-commetrics</span>
    </span>
  );
}

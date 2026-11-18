import Link from 'next/link';
import type { ReactNode } from 'react';
import Icon, { type IconName } from './Icon';
import s from './Button.module.css';

interface Props {
  href?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'light';
  size?: 'md' | 'lg';
  icon?: IconName | null;
  type?: 'button' | 'submit';
  className?: string;
  children: ReactNode;
  disabled?: boolean;
  tabIndex?: number;
  'aria-hidden'?: boolean;
}

export default function Button({ href, variant = 'primary', size = 'md', icon = 'arrow-right', type = 'button', className, children, ...rest }: Props) {
  // "btn" stays a plain class too, so other components can position buttons with :global(.btn).
  const cls = ['btn', s.btn, s[`btn--${variant}`], s[`btn--${size}`], className].filter(Boolean).join(' ');
  const inner = (
    <>
      <span className={s.btn__label}>{children}</span>
      {icon && <span className={s.btn__icon}><Icon name={icon} size={18} /></span>}
    </>
  );
  if (!href) return <button className={cls} type={type} {...rest}>{inner}</button>;
  if (href.startsWith('/')) return <Link className={cls} href={href} {...rest}>{inner}</Link>;
  return <a className={cls} href={href} {...rest}>{inner}</a>;
}

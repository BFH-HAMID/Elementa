import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost';

type BaseProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  icon?: ReactNode;
};

type ButtonProps = BaseProps & ComponentPropsWithoutRef<'button'> & { href?: never };
type LinkButtonProps = BaseProps & Omit<ComponentPropsWithoutRef<typeof Link>, 'className' | 'children'> & { href: string };

function classes(variant: Variant, className?: string) {
  return cn('btn', variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-secondary' : 'btn-ghost', className);
}

export function Button({ children, variant = 'primary', className, icon, ...props }: ButtonProps) {
  return <button className={classes(variant, className)} {...props}>{icon}{children}</button>;
}

export function LinkButton({ children, variant = 'primary', className, icon, href, ...props }: LinkButtonProps) {
  return <Link href={href} className={classes(variant, className)} {...props}>{icon}{children}</Link>;
}

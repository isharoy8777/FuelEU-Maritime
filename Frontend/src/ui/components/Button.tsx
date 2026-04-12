import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: 'gradient-ocean text-white shadow-md hover:opacity-90 active:scale-95',
  secondary: 'bg-white text-navy-900 border border-gray-200 hover:bg-gray-50 active:scale-95',
  ghost: 'bg-transparent text-sky-500 hover:bg-sky-50 active:scale-95',
  danger: 'gradient-red text-white shadow-md hover:opacity-90 active:scale-95',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-lg',
  md: 'px-4 py-2 text-sm font-semibold rounded-lg',
  lg: 'px-6 py-3 text-base font-semibold rounded-xl',
};

export function Button({ variant = 'primary', size = 'md', children, className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

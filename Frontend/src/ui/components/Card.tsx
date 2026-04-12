import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}

// ─── KPI Card with gradient header (V5 style) ──────────────────────────────────

type GradientColor = 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'ocean';

const GRADIENT_CLASSES: Record<GradientColor, string> = {
  blue: 'gradient-blue',
  green: 'gradient-green',
  purple: 'gradient-purple',
  amber: 'gradient-amber',
  red: 'gradient-red',
  ocean: 'gradient-ocean',
};

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  gradient?: GradientColor;
  icon?: ReactNode;
  trend?: string;
}

export function KpiCard({ title, value, subtitle, gradient = 'ocean', icon, trend }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={`${GRADIENT_CLASSES[gradient]} px-5 py-3 flex items-center justify-between`}>
        <span className="text-white/90 text-sm font-medium tracking-wide uppercase">{title}</span>
        {icon && <span className="text-white/80 text-xl">{icon}</span>}
      </div>
      <div className="px-5 py-4">
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {trend && <p className="text-xs text-emerald-600 font-medium mt-1">↑ {trend}</p>}
      </div>
    </div>
  );
}

// ─── Stat Card with colored left border (V1 style) ─────────────────────────────

type BorderColor = 'indigo' | 'green' | 'red' | 'amber' | 'sky';

const BORDER_CLASSES: Record<BorderColor, string> = {
  indigo: 'border-l-indigo-500',
  green: 'border-l-emerald-500',
  red: 'border-l-red-500',
  amber: 'border-l-amber-500',
  sky: 'border-l-sky-500',
};

interface StatCardProps {
  label: string;
  value: string | number;
  border?: BorderColor;
  icon?: ReactNode;
}

export function StatCard({ label, value, border = 'indigo', icon }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${BORDER_CLASSES[border]} p-5 flex items-center gap-4`}>
      {icon && <div className="text-2xl text-gray-400 flex-shrink-0">{icon}</div>}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

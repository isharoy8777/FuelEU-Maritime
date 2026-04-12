import type { ComplianceStatus, ComplianceLabel, BankEntryType } from '../../shared/types';

// ─── Badge ──────────────────────────────────────────────────────────────────────

type BadgeVariant = ComplianceStatus | ComplianceLabel | BankEntryType | 'VALID' | 'INVALID';

const BADGE_STYLES: Record<BadgeVariant, string> = {
  SURPLUS: 'bg-emerald-100 text-emerald-800',
  DEFICIT: 'bg-red-100 text-red-800',
  COMPLIANT: 'bg-emerald-100 text-emerald-800',
  'NON-COMPLIANT': 'bg-red-100 text-red-800',
  BANK: 'bg-sky-100 text-sky-800',
  APPLY: 'bg-orange-100 text-orange-800',
  VALID: 'bg-emerald-100 text-emerald-800',
  INVALID: 'bg-red-100 text-red-800',
};

interface BadgeProps {
  variant: BadgeVariant;
  children?: React.ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${BADGE_STYLES[variant]}`}>
      {children ?? variant}
    </span>
  );
}

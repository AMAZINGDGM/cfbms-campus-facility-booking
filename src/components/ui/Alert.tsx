import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import type { ReactNode } from 'react';

interface AlertProps {
  variant: 'success' | 'error' | 'warning' | 'info';
  children: ReactNode;
  className?: string;
}

const variants = {
  success: { bg: 'bg-green-50 border-green-200', text: 'text-green-800', Icon: CheckCircle2 },
  error:   { bg: 'bg-red-50 border-red-200',     text: 'text-red-800',   Icon: XCircle },
  warning: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', Icon: AlertTriangle },
  info:    { bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-800',  Icon: Info },
};

export default function Alert({ variant, children, className = '' }: AlertProps) {
  const { bg, text, Icon } = variants[variant];
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${bg} ${className}`}>
      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${text}`} />
      <div className={`text-sm ${text}`}>{children}</div>
    </div>
  );
}

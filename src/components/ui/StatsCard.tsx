import type { ReactNode } from 'react';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  className?: string;
  highlight?: boolean;
}

export default function StatsCard({ label, value, icon, className = '', highlight }: StatsCardProps) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-6 ${highlight ? 'border-[#C6A45C]' : 'border-gray-200'} ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-[#202938] mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${highlight ? 'bg-[#C6A45C]/10 text-[#C6A45C]' : 'bg-[#14233B]/5 text-[#14233B]'}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';
import { GraduationCap } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#14233B] rounded-2xl mb-4">
            <GraduationCap className="h-8 w-8 text-[#C6A45C]" />
          </div>
          <h1 className="text-2xl font-bold text-[#14233B]">CFBMS</h1>
          <p className="text-sm text-gray-500 mt-1">Campus Facility Booking Management System</p>
          <p className="text-xs text-gray-400 mt-0.5">Academic Demonstration — President University</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-[#202938] mb-1">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mb-6">{subtitle}</p>}
          {!subtitle && <div className="mb-6" />}
          {children}
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from './Sidebar';
import type { Profile } from '@/types';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export default async function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/auth/login');

  return (
    <div className="flex min-h-screen bg-[#F4F6FA]">
      <Sidebar profile={profile as Profile} />
      <div className="flex-1 flex flex-col min-w-0">
        {title && (
          <header className="bg-white border-b border-gray-200 px-8 py-5">
            <h1 className="text-xl font-semibold text-[#202938]">{title}</h1>
          </header>
        )}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

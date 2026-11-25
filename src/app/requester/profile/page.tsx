import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-lg">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-[#14233B] flex items-center justify-center text-white text-2xl font-bold">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#202938]">{profile?.full_name}</h2>
              <p className="text-sm text-gray-500">{profile?.email}</p>
              <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#14233B]/10 text-[#14233B] capitalize">
                {profile?.role}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Full Name</p>
              <p className="text-sm font-medium text-[#202938] mt-0.5">{profile?.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Email Address</p>
              <p className="text-sm font-medium text-[#202938] mt-0.5">{profile?.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Role</p>
              <p className="text-sm font-medium text-[#202938] mt-0.5 capitalize">{profile?.role}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Member Since</p>
              <p className="text-sm font-medium text-[#202938] mt-0.5">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </p>
            </div>
          </div>

          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">
              To update your profile information, please contact the system administrator. Role changes must be performed by an administrator.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

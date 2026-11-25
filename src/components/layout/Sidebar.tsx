'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, CalendarDays, User,
  ClipboardList, History, BarChart3, LogOut, GraduationCap,
} from 'lucide-react';
import { logout } from '@/lib/auth/actions';
import type { Profile } from '@/types';

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-5 w-5" />,
  Building2:       <Building2       className="h-5 w-5" />,
  CalendarDays:    <CalendarDays    className="h-5 w-5" />,
  User:            <User            className="h-5 w-5" />,
  ClipboardList:   <ClipboardList   className="h-5 w-5" />,
  History:         <History         className="h-5 w-5" />,
  BarChart3:       <BarChart3       className="h-5 w-5" />,
};

const navByRole = {
  requester: [
    { label: 'Dashboard',   href: '/requester/dashboard',  icon: 'LayoutDashboard' },
    { label: 'Facilities',  href: '/requester/facilities', icon: 'Building2' },
    { label: 'My Bookings', href: '/requester/bookings',   icon: 'CalendarDays' },
    { label: 'Profile',     href: '/requester/profile',    icon: 'User' },
  ],
  administrator: [
    { label: 'Dashboard',        href: '/admin/dashboard',         icon: 'LayoutDashboard' },
    { label: 'Facilities',       href: '/admin/facilities',        icon: 'Building2' },
    { label: 'Booking Requests', href: '/admin/bookings',          icon: 'ClipboardList' },
    { label: 'Booking History',  href: '/admin/bookings/history',  icon: 'History' },
    { label: 'Utilization',      href: '/admin/utilization',       icon: 'BarChart3' },
  ],
};

interface SidebarProps {
  profile: Profile;
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const role = profile.role as 'requester' | 'administrator';
  const navItems = navByRole[role] ?? navByRole.requester;

  return (
    <aside className="w-64 min-h-screen bg-[#14233B] text-white flex flex-col flex-shrink-0">
      {/* Logo / Brand */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#C6A45C]/20 rounded-lg">
            <GraduationCap className="h-6 w-6 text-[#C6A45C]" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">CFBMS</p>
            <p className="text-[10px] text-white/50 leading-tight">President University</p>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-6 py-3 border-b border-white/10">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#C6A45C]/20 text-[#C6A45C] capitalize">
          {role}
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {iconMap[item.icon]}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="mb-3 px-2">
          <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
          <p className="text-xs text-white/50 truncate">{profile.email}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}

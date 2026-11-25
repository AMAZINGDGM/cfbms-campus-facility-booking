export const COLORS = {
  primary: '#14233B',
  gold: '#C6A45C',
  background: '#F4F6FA',
  white: '#FFFFFF',
  text: '#202938',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  error: '#dc2626',
  warning: '#f59e0b',
} as const;

export const FACILITY_TYPES = [
  { value: 'classroom' as const, label: 'Classroom' },
  { value: 'fablab' as const, label: 'FabLab' },
] as const;

export const BOOKING_STATUSES = [
  { value: 'pending' as const, label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved' as const, label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'rejected' as const, label: 'Rejected', color: 'bg-red-100 text-red-800' },
] as const;

export const CAMPUS_TIMEZONE = 'Asia/Jakarta';

export const APP_NAME = 'CFBMS';
export const APP_FULL_NAME = 'Campus Facility Booking Management System';

export const NAV_ITEMS = {
  requester: [
    { label: 'Dashboard', href: '/requester/dashboard', icon: 'LayoutDashboard' },
    { label: 'Facilities', href: '/requester/facilities', icon: 'Building2' },
    { label: 'My Bookings', href: '/requester/bookings', icon: 'CalendarDays' },
    { label: 'Profile', href: '/requester/profile', icon: 'User' },
  ],
  administrator: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard' },
    { label: 'Facilities', href: '/admin/facilities', icon: 'Building2' },
    { label: 'Booking Requests', href: '/admin/bookings', icon: 'ClipboardList' },
    { label: 'Booking History', href: '/admin/bookings/history', icon: 'History' },
    { label: 'Utilization', href: '/admin/utilization', icon: 'BarChart3' },
  ],
} as const;

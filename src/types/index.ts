export type UserRole = 'requester' | 'administrator';
export type FacilityType = 'classroom' | 'fablab';
export type BookingStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Facility {
  id: string;
  name: string;
  facility_type: FacilityType;
  description: string | null;
  location: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  requester_id: string;
  facility_id: string;
  activity_title: string;
  purpose: string;
  participant_count: number;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  facility?: Facility;
  requester?: Profile;
}

export interface BookingLog {
  id: string;
  booking_id: string;
  actor_id: string;
  old_status: BookingStatus | null;
  new_status: BookingStatus;
  reason: string | null;
  created_at: string;
  actor?: Pick<Profile, 'full_name' | 'email'>;
}

export interface DashboardStats {
  totalFacilities: number;
  totalBookings: number;
  pendingRequests: number;
  approvedBookings: number;
  rejectedBookings: number;
}

export interface RequesterDashboardStats {
  totalBookings: number;
  pendingRequests: number;
  approvedBookings: number;
  rejectedBookings: number;
}

export interface BookingFilters {
  status?: BookingStatus;
  facility_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface FacilityUtilization {
  id: string;
  name: string;
  facility_type: FacilityType;
  totalBookings: number;
  approvedBookings: number;
  pendingBookings: number;
}

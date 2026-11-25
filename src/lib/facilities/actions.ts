'use server';

import { createClient } from '@/lib/supabase/server';
import { createFacilitySchema, updateFacilitySchema } from '@/lib/booking/validation';
import { revalidatePath } from 'next/cache';

export async function createFacility(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'administrator') {
    return { error: 'Only administrators can manage facilities' };
  }

  const rawData = {
    name: formData.get('name') as string,
    facility_type: formData.get('facility_type') as string,
    description: (formData.get('description') as string) || undefined,
    location: formData.get('location') as string,
    capacity: formData.get('capacity') as string,
  };

  const parsed = createFacilitySchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.from('facilities').insert(parsed.data);

  if (error) return { error: error.message };

  revalidatePath('/admin/facilities');
  revalidatePath('/requester/facilities');
  return { success: true };
}

export async function updateFacility(facilityId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'administrator') {
    return { error: 'Only administrators can manage facilities' };
  }

  const rawData = {
    name: formData.get('name') as string,
    facility_type: formData.get('facility_type') as string,
    description: (formData.get('description') as string) || undefined,
    location: formData.get('location') as string,
    capacity: formData.get('capacity') as string,
    is_active: formData.get('is_active') === 'true',
  };

  const parsed = updateFacilitySchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase
    .from('facilities')
    .update(parsed.data)
    .eq('id', facilityId);

  if (error) return { error: error.message };

  revalidatePath('/admin/facilities');
  revalidatePath('/requester/facilities');
  return { success: true };
}

export async function toggleFacilityActive(facilityId: string, isActive: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'administrator') {
    return { error: 'Only administrators can manage facilities' };
  }

  const { error } = await supabase
    .from('facilities')
    .update({ is_active: isActive })
    .eq('id', facilityId);

  if (error) return { error: error.message };

  revalidatePath('/admin/facilities');
  revalidatePath('/requester/facilities');
  return { success: true };
}

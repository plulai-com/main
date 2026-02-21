'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useAdminRealtime() {
  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'activity_submissions' 
        },
        (payload: any) => {
          console.log('New submission:', payload);
          // Update submission count in real-time
        }
      )
      .on('postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles' 
        },
        (payload: any) => {
          console.log('Profile updated:', payload);
          // Update user status in real-time
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
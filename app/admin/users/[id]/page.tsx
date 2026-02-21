'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  role: string;
  is_paid: boolean;
  created_at: string;
  day_streak: number;
  total_logins: number;
  current_streak: number;
}

interface UserProgress {
  xp: number;
  level: number;
}

interface Activity {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
  event_type: string;
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch user progress
      const { data: progress, error: progressError } = await supabase
        .from('users_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is okay
        throw progressError;
      }

      // Fetch recent activity
      const { data: activityData, error: activityError } = await supabase
        .from('xp_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (activityError) throw activityError;

      setUser(profile);
      setUserProgress(progress);
      setActivity(activityData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-600">User not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.email}</h1>
              <p className="text-gray-600">
                {user.username || 'No username'} • Joined {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              user.role === 'admin' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {user.role}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              user.is_paid 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {user.is_paid ? 'Paid' : 'Free'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Activity Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {activity.map((item) => (
                <div key={item.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{item.reason}</span>
                    <span className="text-green-600 font-bold">+{item.amount} XP</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
              {activity.length === 0 && (
                <p className="text-gray-500 text-center py-4">No activity yet</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                Send Message
              </button>
              <button className="w-full text-left px-4 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100">
                Award XP
              </button>
              <button className="w-full text-left px-4 py-2 text-sm bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100">
                Reset Password
              </button>
              <button className="w-full text-left px-4 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100">
                Deactivate Account
              </button>
            </div>
          </div>

          {/* User Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">User Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Level</span>
                <span className="font-bold">{userProgress?.level || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total XP</span>
                <span className="font-bold">{userProgress?.xp || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Day Streak</span>
                <span className="font-bold">{user.day_streak || 0} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Logins</span>
                <span className="font-bold">{user.total_logins || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Streak</span>
                <span className="font-bold">{user.current_streak || 0} days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// app/admin/users/[id]/edit/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Save,
  ArrowLeft,
  RefreshCw,
  User,
  Mail,
  Calendar,
  Shield,
  CreditCard,
  Globe,
  Image as ImageIcon,
  Award,
  TrendingUp,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Upload,
  Trash2,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

// Types
interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  role: 'student' | 'admin';
  subscription_status: 'active' | 'canceled' | 'past_due' | 'inactive' | 'trialing' | null;
  is_paid: boolean;
  updated_at: string;
  last_login_date: string | null;
  total_logins: number;
  current_streak: number;
  longest_streak: number;
  day_streak: number;
  age_group: string | null;
  avatar_url: string | null;
  avatar_id: string | null;
  language_preference: string;
  date_of_birth: string | null;
  bio: string | null;
  subscription_id: string | null;
  current_period_end: string | null;
  current_period_start: string | null;
  cancel_at_period_end: boolean | null;
  last_streak_date: string | null;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  subscription_interval: string;
  stripe_payment_id: string | null;
  currency: string;
}

interface UserProgress {
  level: number;
  xp: number;
  total_xp: number;
}

interface UserBadge {
  id: string;
  badge_id: string;
  name: string;
  description: string;
  earned_at: string;
  icon_url: string | null;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userPayments, setUserPayments] = useState<Payment[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [deletePaymentDialog, setDeletePaymentDialog] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [addPaymentDialog, setAddPaymentDialog] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: 49.99,
    status: 'completed',
    subscription_interval: 'monthly',
    currency: 'USD',
  });

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    role: 'student' as 'student' | 'admin',
    subscription_status: 'inactive' as 'active' | 'canceled' | 'past_due' | 'inactive' | 'trialing',
    language_preference: 'en',
    age_group: '',
    date_of_birth: '',
    bio: '',
    subscription_id: '',
    current_period_start: '',
    current_period_end: '',
    cancel_at_period_end: false,
    day_streak: 0,
    current_streak: 0,
    longest_streak: 0,
    total_logins: 0,
    last_login_date: '',
    last_streak_date: '',
  });

  // Check authentication and fetch user data
  useEffect(() => {
    checkAuth();
  }, [userId]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'admin') {
        router.push('/');
        return;
      }

      setCurrentUser(session.user);
      setAuthLoading(false);
      fetchUserData();
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch all user data in parallel
      const [
        userData,
        paymentsData,
        progressData,
        badgesData,
      ] = await Promise.all([
        fetchUser(),
        fetchUserPayments(),
        fetchUserProgress(),
        fetchUserBadges(),
      ]);

      if (userData) {
        setUser(userData);
        // Initialize form data with user data
        setFormData({
          email: userData.email || '',
          username: userData.username || '',
          role: userData.role || 'student',
          subscription_status: userData.subscription_status || 'inactive',
          language_preference: userData.language_preference || 'en',
          age_group: userData.age_group || '',
          date_of_birth: userData.date_of_birth?.split('T')[0] || '',
          bio: userData.bio || '',
          subscription_id: userData.subscription_id || '',
          current_period_start: userData.current_period_start?.split('T')[0] || '',
          current_period_end: userData.current_period_end?.split('T')[0] || '',
          cancel_at_period_end: userData.cancel_at_period_end || false,
          day_streak: userData.day_streak || 0,
          current_streak: userData.current_streak || 0,
          longest_streak: userData.longest_streak || 0,
          total_logins: userData.total_logins || 0,
          last_login_date: userData.last_login_date?.split('T')[0] || '',
          last_streak_date: userData.last_streak_date?.split('T')[0] || '',
        });

        if (userData.avatar_url) {
          setAvatarPreview(userData.avatar_url);
        }
      }

      setUserPayments(paymentsData);
      setUserProgress(progressData);
      setUserBadges(badgesData);
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load user data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async (): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: 'Error',
            description: 'User not found',
            variant: 'destructive',
          });
          router.push('/admin/users');
          return null;
        }
        throw error;
      }

      if (!data) {
        toast({
          title: 'Error',
          description: 'User not found',
          variant: 'destructive',
        });
        router.push('/admin/users');
        return null;
      }

      // Get paid status from payments
      const { data: payments } = await supabase
        .from('payments')
        .select('user_id')
        .eq('user_id', userId)
        .eq('status', 'completed');

      const isPaid = payments && payments.length > 0;

      return {
        ...data,
        is_paid: isPaid,
      } as UserProfile;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  };

  const fetchUserPayments = async (): Promise<Payment[]> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user payments:', error);
      return [];
    }
  };

  const fetchUserProgress = async (): Promise<UserProgress | null> => {
    try {
      const { data, error } = await supabase
        .from('users_progress')
        .select('level, xp')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return {
        level: data.level || 1,
        xp: data.xp || 0,
        total_xp: (data.level || 1) * 1000 + (data.xp || 0),
      };
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return null;
    }
  };

  const fetchUserBadges = async (): Promise<UserBadge[]> => {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          id,
          badge_id,
          earned_at,
          badges (
            name,
            description,
            icon_url
          )
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        badge_id: item.badge_id,
        name: item.badges?.name || 'Unknown Badge',
        description: item.badges?.description || '',
        earned_at: item.earned_at,
        icon_url: item.badges?.icon_url || null,
      }));
    } catch (error) {
      console.error('Error fetching user badges:', error);
      return [];
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size should be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Delete old avatar if exists
      if (user?.avatar_url) {
        const oldPath = user.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`avatars/${oldPath}`]);
        }
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload avatar',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Upload avatar if changed
      let avatarUrl = user?.avatar_url || null;
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
        if (!avatarUrl) return;
      }

      // Prepare update data
      const updateData: any = {
        username: formData.username || null,
        role: formData.role,
        subscription_status: formData.subscription_status,
        language_preference: formData.language_preference,
        age_group: formData.age_group || null,
        date_of_birth: formData.date_of_birth || null,
        bio: formData.bio || null,
        subscription_id: formData.subscription_id || null,
        current_period_start: formData.current_period_start ? new Date(formData.current_period_start).toISOString() : null,
        current_period_end: formData.current_period_end ? new Date(formData.current_period_end).toISOString() : null,
        cancel_at_period_end: formData.cancel_at_period_end,
        day_streak: formData.day_streak,
        current_streak: formData.current_streak,
        longest_streak: formData.longest_streak,
        total_logins: formData.total_logins,
        last_login_date: formData.last_login_date || null,
        last_streak_date: formData.last_streak_date || null,
        updated_at: new Date().toISOString(),
      };

      if (avatarUrl !== null) {
        updateData.avatar_url = avatarUrl;
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) throw updateError;

      // Update email if changed
      if (formData.email !== user?.email) {
        const { error: emailError } = await supabase.auth.admin.updateUserById(
          userId,
          { email: formData.email }
        );
        
        if (emailError) {
          console.warn('Could not update email:', emailError);
          toast({
            title: 'Warning',
            description: 'Profile updated but email update failed. You may need to update email manually.',
            variant: 'default',
          });
        }
      }

      // Update progress if changed
      if (userProgress && (formData.day_streak !== user?.day_streak || formData.current_streak !== user?.current_streak)) {
        await supabase
          .from('users_progress')
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }

      toast({
        title: 'Success',
        description: 'User updated successfully!',
        variant: 'default',
      });
      
      // Refresh user data
      await fetchUserData();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save user changes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please enter and confirm new password',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Password reset successfully!',
        variant: 'default',
      });
      
      setNewPassword('');
      setConfirmPassword('');
      setResetPasswordDialog(false);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      // Refresh payments
      const payments = await fetchUserPayments();
      setUserPayments(payments);
      
      toast({
        title: 'Success',
        description: 'Payment deleted successfully!',
        variant: 'default',
      });
      
      setDeletePaymentDialog(false);
      setPaymentToDelete(null);
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete payment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddPayment = async () => {
    try {
      setSaving(true);

      const paymentData = {
        user_id: userId,
        amount: newPayment.amount,
        status: newPayment.status,
        subscription_interval: newPayment.subscription_interval,
        currency: newPayment.currency,
        period_start: new Date().toISOString(),
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('payments')
        .insert(paymentData);

      if (error) throw error;

      // Update user's subscription status if payment is completed
      if (newPayment.status === 'completed') {
        await supabase
          .from('profiles')
          .update({ 
            subscription_status: 'active',
            current_period_start: paymentData.period_start,
            current_period_end: paymentData.period_end
          })
          .eq('id', userId);
          
        // Update local form data
        setFormData(prev => ({
          ...prev,
          subscription_status: 'active',
          current_period_start: paymentData.period_start.slice(0, 16),
          current_period_end: paymentData.period_end.slice(0, 16)
        }));
      }

      // Refresh payments
      const payments = await fetchUserPayments();
      setUserPayments(payments);
      
      toast({
        title: 'Success',
        description: 'Payment added successfully!',
        variant: 'default',
      });
      
      setAddPaymentDialog(false);
      setNewPayment({
        amount: 49.99,
        status: 'completed',
        subscription_interval: 'monthly',
        currency: 'USD',
      });
    } catch (error: any) {
      console.error('Error adding payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add payment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);

      // Delete dependent records in correct order
      await supabase
        .from('step_progress')
        .delete()
        .eq('user_id', userId);

      await supabase
        .from('lesson_progress')
        .delete()
        .eq('user_id', userId);

      await supabase
        .from('users_progress')
        .delete()
        .eq('user_id', userId);

      await supabase
        .from('user_badges')
        .delete()
        .eq('user_id', userId);

      await supabase
        .from('payments')
        .delete()
        .eq('user_id', userId);

      // Delete profile
      await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      // Delete auth user (admin API)
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User deleted successfully!',
        variant: 'default',
      });

      router.push('/admin/users');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const calculateDaysRemaining = (endDate: string | null) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateProgressPercentage = () => {
    if (!userProgress) return 0;
    return Math.round((userProgress.xp % 1000) / 10);
  };

  // Get the first letter of email for avatar fallback
  const getAvatarFallback = () => {
    return user?.email?.charAt(0)?.toUpperCase() || 'U';
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-4">The user you're looking for doesn't exist.</p>
          <Link href="/admin/users">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit User</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage user profile, subscription, and settings
            </p>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Profile & Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>User information and avatar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                    <AvatarImage src={avatarPreview || undefined} />
                    <AvatarFallback className="text-3xl">
                      {getAvatarFallback()}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 cursor-pointer">
                    <div className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-md">
                      <Upload className="h-4 w-4" />
                    </div>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      aria-label="Upload avatar"
                    />
                  </label>
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900">
                    {formData.username || formData.email.split('@')[0]}
                  </h3>
                  <p className="text-gray-600">{formData.email}</p>
                  <Badge className="mt-2" variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                    {user.role === 'admin' ? 'Admin' : 'Student'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    type="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Stats */}
          <Card>
            <CardHeader>
              <CardTitle>User Stats</CardTitle>
              <CardDescription>Activity and progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Level</span>
                    <span className="text-lg font-bold text-gray-900">{userProgress.level}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">XP</span>
                    <span className="text-lg font-bold text-gray-900">{userProgress.xp.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${calculateProgressPercentage()}%` }}
                    />
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {calculateProgressPercentage()}% to next level
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Logins</p>
                  <p className="text-2xl font-bold text-gray-900">{formData.total_logins || 0}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Day Streak</p>
                  <p className="text-2xl font-bold text-gray-900">{formData.day_streak || 0}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Current Streak</span>
                  <span className="font-medium text-gray-900">{formData.current_streak || 0} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Longest Streak</span>
                  <span className="font-medium text-gray-900">{formData.longest_streak || 0} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Last Login</span>
                  <span className="text-sm text-gray-600">{formatDate(formData.last_login_date || null)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Manage user account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setResetPasswordDialog(true)}
              >
                <Shield className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setAddPaymentDialog(true)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
              
              <Link href={`/admin/users/${userId}`}>
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  View User
                </Button>
              </Link>
              
              <Separator />
              
              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={handleDeleteUser}
                disabled={saving}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
            </TabsList>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Settings</CardTitle>
                  <CardDescription>Configure user permissions and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">User Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value: 'student' | 'admin') => handleSelectChange('role', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language_preference">Language Preference</Label>
                      <Select
                        value={formData.language_preference}
                        onValueChange={(value) => handleSelectChange('language_preference', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar">Arabic</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age_group">Age Group</Label>
                      <Select
                        value={formData.age_group || ''}
                        onValueChange={(value) => handleSelectChange('age_group', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select age group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="young">Young (5-9)</SelectItem>
                          <SelectItem value="tween">Tween (10-12)</SelectItem>
                          <SelectItem value="teen">Teen (13-17)</SelectItem>
                          <SelectItem value="all">All Ages</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input
                        id="date_of_birth"
                        name="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Streak Management</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="day_streak">Day Streak</Label>
                        <Input
                          id="day_streak"
                          name="day_streak"
                          type="number"
                          min="0"
                          value={formData.day_streak}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="current_streak">Current Streak</Label>
                        <Input
                          id="current_streak"
                          name="current_streak"
                          type="number"
                          min="0"
                          value={formData.current_streak}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longest_streak">Longest Streak</Label>
                        <Input
                          id="longest_streak"
                          name="longest_streak"
                          type="number"
                          min="0"
                          value={formData.longest_streak}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="last_streak_date">Last Streak Date</Label>
                        <Input
                          id="last_streak_date"
                          name="last_streak_date"
                          type="date"
                          value={formData.last_streak_date}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="total_logins">Total Logins</Label>
                        <Input
                          id="total_logins"
                          name="total_logins"
                          type="number"
                          min="0"
                          value={formData.total_logins}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_login_date">Last Login Date</Label>
                      <Input
                        id="last_login_date"
                        name="last_login_date"
                        type="date"
                        value={formData.last_login_date}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Management</CardTitle>
                  <CardDescription>Manage user subscription and billing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subscription_status">Subscription Status</Label>
                      <Select
                        value={formData.subscription_status}
                        onValueChange={(value) => handleSelectChange('subscription_status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="trialing">Trialing</SelectItem>
                          <SelectItem value="past_due">Past Due</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subscription_id">Subscription ID</Label>
                      <Input
                        id="subscription_id"
                        name="subscription_id"
                        value={formData.subscription_id}
                        onChange={handleInputChange}
                        placeholder="Enter subscription ID"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="current_period_start">Period Start</Label>
                        <Input
                          id="current_period_start"
                          name="current_period_start"
                          type="datetime-local"
                          value={formData.current_period_start}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="current_period_end">Period End</Label>
                        <Input
                          id="current_period_end"
                          name="current_period_end"
                          type="datetime-local"
                          value={formData.current_period_end}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="cancel_at_period_end" className="cursor-pointer font-medium">
                          Cancel at Period End
                        </Label>
                        <p className="text-sm text-gray-600">
                          Subscription will automatically cancel at the end of the current period
                        </p>
                      </div>
                      <Switch
                        id="cancel_at_period_end"
                        checked={formData.cancel_at_period_end}
                        onCheckedChange={(checked) => handleSwitchChange('cancel_at_period_end', checked)}
                      />
                    </div>

                    {formData.current_period_end && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Days Remaining</span>
                          <span className={`text-lg font-bold ${calculateDaysRemaining(formData.current_period_end) <= 7 ? 'text-red-600' : 'text-green-600'}`}>
                            {calculateDaysRemaining(formData.current_period_end)} days
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Subscription ends on {formatDate(formData.current_period_end)}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Paid Status</p>
                        <p className="text-sm text-gray-600">
                          User has {user.is_paid ? 'made' : 'not made'} payments
                        </p>
                      </div>
                      <Badge variant={user.is_paid ? "default" : "secondary"}>
                        {user.is_paid ? 'Paid' : 'Free'}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSelectChange('subscription_status', 'active')}
                        disabled={formData.subscription_status === 'active'}
                      >
                        Activate Subscription
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSelectChange('subscription_status', 'inactive')}
                        disabled={formData.subscription_status === 'inactive'}
                      >
                        Deactivate
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          const nextMonth = new Date(today);
                          nextMonth.setMonth(nextMonth.getMonth() + 1);
                          
                          setFormData(prev => ({
                            ...prev,
                            current_period_end: nextMonth.toISOString().slice(0, 16),
                            subscription_status: 'active'
                          }));
                        }}
                      >
                        Extend 1 Month
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            current_period_start: new Date().toISOString().slice(0, 16),
                            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
                            subscription_status: 'active'
                          }));
                        }}
                      >
                        Start Subscription
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle>Payment History</CardTitle>
                      <CardDescription>View and manage user payments</CardDescription>
                    </div>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => setAddPaymentDialog(true)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Add Payment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {userPayments.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                      <p className="text-gray-600 mb-4">This user hasn't made any payments yet.</p>
                      <Button variant="outline" onClick={() => setAddPaymentDialog(true)}>
                        Add Payment
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">Total Payments</p>
                          <p className="text-2xl font-bold text-gray-900">{userPayments.length}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">Total Amount</p>
                          <p className="text-2xl font-bold text-gray-900">
                            ${userPayments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">Active Status</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {userPayments.some(p => p.status === 'completed') ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-lg border">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Interval
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {userPayments.map((payment) => (
                              <tr key={payment.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatDate(payment.created_at)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  ${payment.amount.toFixed(2)} {payment.currency}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge 
                                    variant={
                                      payment.status === 'completed' ? 'default' :
                                      payment.status === 'pending' ? 'secondary' : 'destructive'
                                    }
                                  >
                                    {payment.status}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {payment.subscription_interval}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setPaymentToDelete(payment.id);
                                      setDeletePaymentDialog(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Badges Tab */}
            <TabsContent value="badges" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Earned Badges</CardTitle>
                  <CardDescription>Badges earned by the user</CardDescription>
                </CardHeader>
                <CardContent>
                  {userBadges.length === 0 ? (
                    <div className="text-center py-12">
                      <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No badges earned</h3>
                      <p className="text-gray-600">This user hasn't earned any badges yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {userBadges.map((badge) => (
                        <div 
                          key={badge.id} 
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                        >
                          <div className="flex items-start gap-3">
                            <div className="bg-blue-100 p-3 rounded-full shrink-0">
                              {badge.icon_url ? (
                                <img 
                                  src={badge.icon_url} 
                                  alt={badge.name}
                                  className="h-6 w-6"
                                />
                              ) : (
                                <Award className="h-6 w-6 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{badge.name}</h4>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{badge.description}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Earned on {formatDate(badge.earned_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Payment Dialog */}
      <Dialog open={deletePaymentDialog} onOpenChange={setDeletePaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeletePaymentDialog(false);
                setPaymentToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => paymentToDelete && handleDeletePayment(paymentToDelete)}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={addPaymentDialog} onOpenChange={setAddPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
            <DialogDescription>
              Add a new payment record for this user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0"
                value={newPayment.amount}
                onChange={(e) => setNewPayment(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-status">Status</Label>
              <Select
                value={newPayment.status}
                onValueChange={(value) => setNewPayment(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-interval">Subscription Interval</Label>
              <Select
                value={newPayment.subscription_interval}
                onValueChange={(value) => setNewPayment(prev => ({ ...prev, subscription_interval: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-currency">Currency</Label>
              <Select
                value={newPayment.currency}
                onValueChange={(value) => setNewPayment(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddPaymentDialog(false);
                setNewPayment({
                  amount: 49.99,
                  status: 'completed',
                  subscription_interval: 'monthly',
                  currency: 'USD',
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPayment}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {user.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">Password must be at least 6 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetPasswordDialog(false);
                setNewPassword('');
                setConfirmPassword('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={saving || !newPassword || !confirmPassword}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
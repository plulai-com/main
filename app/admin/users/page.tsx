// app/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Award,
  TrendingUp,
  Download,
  RefreshCw,
  Loader2,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  username: string | null;
  role: string;
  subscription_status: string;
  updated_at: string;
  current_streak: number;
  total_logins: number;
  bio: string | null;
  age_group: string | null;
}

interface UserStats {
  totalXP: number;
  completedLessons: number;
  earnedBadges: number;
  lastLogin: string | null;
}

interface EditFormData {
  email: string;
  username: string;
  role: string;
  subscription_status: string;
  subscription_interval: string;
  current_streak: number;
  total_logins: number;
  bio: string;
  age_group: string;
  xp: number;
}

type FilterType = 'all' | 'admin' | 'student' | 'active' | 'inactive' | 'canceled';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    email: '',
    username: '',
    role: 'student',
    subscription_status: 'inactive',
    subscription_interval: 'monthly',
    current_streak: 0,
    total_logins: 0,
    bio: '',
    age_group: '',
    xp: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    admins: 0,
    students: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchQuery, selectedFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Use SQL function to bypass RLS
      const { data, error } = await supabase
        .rpc('public_get_all_users');

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      setUsers(data || []);

      // Calculate stats
      const totalUsers = data?.length || 0;
      const activeSubscriptions = data?.filter((u: User) => u.subscription_status === 'active').length || 0;
      const admins = data?.filter((u: User) => u.role === 'admin').length || 0;
      const students = data?.filter((u: User) => u.role === 'student').length || 0;

      setStats({ totalUsers, activeSubscriptions, admins, students });
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to load users. Make sure you have run the SQL migration.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filter
    switch (selectedFilter) {
      case 'admin':
        filtered = filtered.filter(u => u.role === 'admin');
        break;
      case 'student':
        filtered = filtered.filter(u => u.role === 'student');
        break;
      case 'active':
        filtered = filtered.filter(u => u.subscription_status === 'active');
        break;
      case 'inactive':
        filtered = filtered.filter(u => u.subscription_status === 'inactive');
        break;
      case 'canceled':
        filtered = filtered.filter(u => u.subscription_status === 'canceled');
        break;
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const fetchUserStats = async (userId: string): Promise<UserStats> => {
    try {
      const { data, error } = await supabase
        .rpc('public_get_user_stats', { user_id_param: userId });

      if (error) throw error;

      return {
        totalXP: data.totalXP || 0,
        completedLessons: data.completedLessons || 0,
        earnedBadges: data.earnedBadges || 0,
        lastLogin: data.lastLogin || null,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        totalXP: 0,
        completedLessons: 0,
        earnedBadges: 0,
        lastLogin: null,
      };
    }
  };

  const handleViewUser = async (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
    const stats = await fetchUserStats(user.id);
    setUserStats(stats);
  };

  const handleEditUser = async (user: User) => {
    setSelectedUser(user);
    const stats = await fetchUserStats(user.id);
    setUserStats(stats);
    
    // Populate form with user data
    setEditFormData({
      email: user.email,
      username: user.username || '',
      role: user.role,
      subscription_status: user.subscription_status,
      subscription_interval: user.subscription_status === 'active' ? 'monthly' : '',
      current_streak: user.current_streak || 0,
      total_logins: user.total_logins || 0,
      bio: user.bio || '',
      age_group: user.age_group || '',
      xp: stats.totalXP,
    });
    
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      console.log('Saving user with data:', editFormData);

      // Update basic profile information
      const { data: profileResult, error: profileError } = await supabase
        .rpc('public_update_user_profile', {
          user_id_param: selectedUser.id,
          email_param: editFormData.email,
          username_param: editFormData.username || null,
          role_param: editFormData.role,
          subscription_status_param: editFormData.subscription_status,
          bio_param: editFormData.bio || null,
          age_group_param: editFormData.age_group || null,
        });

      console.log('Profile update result:', profileResult);

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error(`Profile update failed: ${profileError.message}`);
      }

      if (!profileResult?.success) {
        throw new Error(profileResult?.error || 'Profile update failed');
      }

      // Update subscription fields if they exist
      if (editFormData.subscription_interval) {
        const { data: subResult, error: subError } = await supabase
          .rpc('public_update_user_subscription_fields', {
            user_id_param: selectedUser.id,
            subscription_status_param: editFormData.subscription_status,
            subscription_interval_param: editFormData.subscription_interval,
            current_period_start_param: null,
            current_period_end_param: null,
          });

        if (subError) {
          console.warn('Subscription update warning:', subError);
          // Don't fail the whole operation
        }
      }

      // Update activity stats
      const { data: activityResult, error: activityError } = await supabase
        .rpc('public_update_user_activity', {
          user_id_param: selectedUser.id,
          current_streak_param: editFormData.current_streak,
          total_logins_param: editFormData.total_logins,
        });

      if (activityError) {
        console.warn('Activity update warning:', activityError);
        // Don't fail the whole operation
      }

      // Update XP if changed
      if (editFormData.xp !== userStats?.totalXP) {
        const { data: xpResult, error: xpError } = await supabase
          .rpc('public_update_user_xp', {
            user_id_param: selectedUser.id,
            new_xp: editFormData.xp,
          });

        if (xpError) {
          console.error('XP update error:', xpError);
          // Don't fail the whole operation
        }
      }

      setShowEditModal(false);
      await fetchUsers();
      alert('User updated successfully!');
    } catch (error: any) {
      console.error('Error updating user:', error);
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to update user';
      if (error.message?.includes('age_group')) {
        errorMessage = 'Invalid age group selected. Please choose a valid option or leave it empty.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { data, error } = await supabase
        .rpc('public_update_user_role', {
          user_id_param: userId,
          new_role: newRole
        });

      if (error) throw error;

      await fetchUsers();
      alert(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update user role');
    }
  };

  const handleUpdateSubscription = async (userId: string, newStatus: string) => {
    try {
      const { data, error } = await supabase
        .rpc('public_update_user_subscription', {
          user_id_param: userId,
          new_status: newStatus
        });

      if (error) throw error;

      await fetchUsers();
      alert(`Subscription status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription status');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('public_delete_user', {
          user_id_param: userId
        });

      if (error) throw error;

      await fetchUsers();
      setShowUserModal(false);
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['User Management Export'],
      ['Generated', new Date().toLocaleString()],
      ['Total Users', stats.totalUsers],
      [''],
      ['ID', 'Email', 'Username', 'Role', 'Subscription', 'Streak', 'Total Logins', 'Last Updated'],
      ...filteredUsers.map(u => [
        u.id,
        u.email,
        u.username || '',
        u.role,
        u.subscription_status,
        u.current_streak,
        u.total_logins,
        new Date(u.updated_at).toLocaleDateString(),
      ]),
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const jsonData = {
      exportedAt: new Date().toISOString(),
      totalUsers: stats.totalUsers,
      users: filteredUsers.map(u => ({
        id: u.id,
        email: u.email,
        username: u.username,
        role: u.role,
        subscriptionStatus: u.subscription_status,
        currentStreak: u.current_streak,
        totalLogins: u.total_logins,
        updatedAt: u.updated_at,
        ageGroup: u.age_group,
      })),
    };

    const json = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'canceled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'admin'
      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      : 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-purple-200 text-lg font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 md:p-8">
      <div className="fixed inset-0 opacity-10 pointer-events-none select-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="select-text cursor-text">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
              User Management
            </h1>
            <p className="text-purple-200 text-lg">
              Manage and monitor all platform users
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-lg shadow-emerald-500/30">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <DropdownMenuItem onClick={exportToCSV} className="text-white hover:bg-slate-700 cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToJSON} className="text-white hover:bg-slate-700 cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              onClick={fetchUsers}
              variant="outline"
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Active Subscriptions"
            value={stats.activeSubscriptions.toLocaleString()}
            icon={<CreditCard className="w-6 h-6" />}
            color="emerald"
          />
          <StatCard
            title="Administrators"
            value={stats.admins.toLocaleString()}
            icon={<UserCheck className="w-6 h-6" />}
            color="purple"
          />
          <StatCard
            title="Students"
            value={stats.students.toLocaleString()}
            icon={<Users className="w-6 h-6" />}
            color="indigo"
          />
        </div>

        {/* Filters and Search */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                <Input
                  placeholder="Search by email or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-purple-300"
                />
              </div>

              <Select value={selectedFilter} onValueChange={(value: FilterType) => setSelectedFilter(value)}>
                <SelectTrigger className="w-full md:w-[200px] bg-slate-700 border-slate-600 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white hover:bg-slate-700">All Users</SelectItem>
                  <SelectItem value="admin" className="text-white hover:bg-slate-700">Admins</SelectItem>
                  <SelectItem value="student" className="text-white hover:bg-slate-700">Students</SelectItem>
                  <SelectItem value="active" className="text-white hover:bg-slate-700">Active Subscription</SelectItem>
                  <SelectItem value="inactive" className="text-white hover:bg-slate-700">Inactive</SelectItem>
                  <SelectItem value="canceled" className="text-white hover:bg-slate-700">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 text-purple-300 text-sm select-text cursor-text">
              Showing {currentUsers.length} of {filteredUsers.length} users
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-700/50">
                    <TableHead className="text-purple-300">Email</TableHead>
                    <TableHead className="text-purple-300">Username</TableHead>
                    <TableHead className="text-purple-300">Role</TableHead>
                    <TableHead className="text-purple-300">Subscription</TableHead>
                    <TableHead className="text-purple-300">Streak</TableHead>
                    <TableHead className="text-purple-300">Logins</TableHead>
                    <TableHead className="text-purple-300">Last Updated</TableHead>
                    <TableHead className="text-purple-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentUsers.map((user) => (
                    <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/50 transition-colors">
                      <TableCell className="font-medium text-white select-text cursor-text">{user.email}</TableCell>
                      <TableCell className="text-purple-200 select-text cursor-text">{user.username || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.subscription_status)}>
                          {user.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-purple-200 select-text cursor-text">
                        {user.current_streak || 0} 🔥
                      </TableCell>
                      <TableCell className="text-purple-200 select-text cursor-text">
                        {user.total_logins || 0}
                      </TableCell>
                      <TableCell className="text-purple-200 select-text cursor-text">
                        {new Date(user.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-purple-300 hover:text-white hover:bg-slate-700">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem 
                              onClick={() => handleViewUser(user)}
                              className="text-white hover:bg-slate-700 cursor-pointer"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleEditUser(user)}
                              className="text-white hover:bg-slate-700 cursor-pointer"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem 
                              onClick={() => handleUpdateRole(user.id, user.role === 'admin' ? 'student' : 'admin')}
                              className="text-white hover:bg-slate-700 cursor-pointer"
                            >
                              <UserCheck className="w-4 h-4 mr-2" />
                              {user.role === 'admin' ? 'Make Student' : 'Make Admin'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleUpdateSubscription(user.id, user.subscription_status === 'active' ? 'inactive' : 'active')}
                              className="text-white hover:bg-slate-700 cursor-pointer"
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              {user.subscription_status === 'active' ? 'Deactivate' : 'Activate'} Subscription
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className="text-red-400 hover:bg-red-900/20 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-700">
                <div className="text-purple-300 text-sm select-text cursor-text">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Details Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">User Details</DialogTitle>
            <DialogDescription className="text-purple-300">
              Complete information for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="select-text cursor-text">
                  <p className="text-purple-300 text-sm mb-1">Email</p>
                  <p className="text-white font-medium">{selectedUser.email}</p>
                </div>
                <div className="select-text cursor-text">
                  <p className="text-purple-300 text-sm mb-1">Username</p>
                  <p className="text-white font-medium">{selectedUser.username || 'Not set'}</p>
                </div>
                <div className="select-text cursor-text">
                  <p className="text-purple-300 text-sm mb-1">Role</p>
                  <Badge className={getRoleColor(selectedUser.role)}>{selectedUser.role}</Badge>
                </div>
                <div className="select-text cursor-text">
                  <p className="text-purple-300 text-sm mb-1">Subscription</p>
                  <Badge className={getStatusColor(selectedUser.subscription_status)}>
                    {selectedUser.subscription_status}
                  </Badge>
                </div>
              </div>

              {/* Stats */}
              {userStats && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-700/50 rounded-lg">
                  <div className="select-text cursor-text">
                    <p className="text-purple-300 text-sm mb-1">Total XP</p>
                    <p className="text-white font-bold text-xl">{userStats.totalXP.toLocaleString()}</p>
                  </div>
                  <div className="select-text cursor-text">
                    <p className="text-purple-300 text-sm mb-1">Completed Lessons</p>
                    <p className="text-white font-bold text-xl">{userStats.completedLessons}</p>
                  </div>
                  <div className="select-text cursor-text">
                    <p className="text-purple-300 text-sm mb-1">Earned Badges</p>
                    <p className="text-white font-bold text-xl">{userStats.earnedBadges}</p>
                  </div>
                  <div className="select-text cursor-text">
                    <p className="text-purple-300 text-sm mb-1">Last Login</p>
                    <p className="text-white font-bold text-xl">
                      {userStats.lastLogin ? new Date(userStats.lastLogin).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              )}

              {/* Activity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="select-text cursor-text">
                  <p className="text-purple-300 text-sm mb-1">Current Streak</p>
                  <p className="text-white font-medium">{selectedUser.current_streak || 0} days 🔥</p>
                </div>
                <div className="select-text cursor-text">
                  <p className="text-purple-300 text-sm mb-1">Total Logins</p>
                  <p className="text-white font-medium">{selectedUser.total_logins || 0}</p>
                </div>
                <div className="select-text cursor-text">
                  <p className="text-purple-300 text-sm mb-1">Last Updated</p>
                  <p className="text-white font-medium">
                    {new Date(selectedUser.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="select-text cursor-text">
                  <p className="text-purple-300 text-sm mb-1">Age Group</p>
                  <p className="text-white font-medium">
                    {selectedUser.age_group || 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Bio */}
              {selectedUser.bio && (
                <div className="select-text cursor-text">
                  <p className="text-purple-300 text-sm mb-1">Bio</p>
                  <p className="text-white">{selectedUser.bio}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              onClick={() => setShowUserModal(false)}
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit User</DialogTitle>
            <DialogDescription className="text-purple-300">
              Update user information and settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-purple-300 text-sm mb-2 block">Email</label>
                  <Input
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    type="email"
                  />
                </div>

                <div>
                  <label className="text-purple-300 text-sm mb-2 block">Username</label>
                  <Input
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Username"
                  />
                </div>

                <div>
                  <label className="text-purple-300 text-sm mb-2 block">Role</label>
                  <Select 
                    value={editFormData.role} 
                    onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="student" className="text-white hover:bg-slate-700">Student</SelectItem>
                      <SelectItem value="admin" className="text-white hover:bg-slate-700">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-purple-300 text-sm mb-2 block">Age Group</label>
                  <Select 
                    value={editFormData.age_group || 'none'} 
                    onValueChange={(value) => setEditFormData({ ...editFormData, age_group: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="none" className="text-white hover:bg-slate-700">None</SelectItem>
                      <SelectItem value="6-8" className="text-white hover:bg-slate-700">6-8 years</SelectItem>
                      <SelectItem value="9-12" className="text-white hover:bg-slate-700">9-12 years</SelectItem>
                      <SelectItem value="13-15" className="text-white hover:bg-slate-700">13-15 years</SelectItem>
                      <SelectItem value="16-18" className="text-white hover:bg-slate-700">16-18 years</SelectItem>
                      <SelectItem value="18+" className="text-white hover:bg-slate-700">18+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-purple-300 text-sm mb-2 block">Bio</label>
                <textarea
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                  className="w-full bg-slate-700 border-slate-600 text-white rounded-md p-3 min-h-[100px]"
                  placeholder="User bio..."
                />
              </div>
            </div>

            {/* Subscription */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Subscription</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-purple-300 text-sm mb-2 block">Status</label>
                  <Select 
                    value={editFormData.subscription_status} 
                    onValueChange={(value) => setEditFormData({ ...editFormData, subscription_status: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="active" className="text-white hover:bg-slate-700">Active</SelectItem>
                      <SelectItem value="inactive" className="text-white hover:bg-slate-700">Inactive</SelectItem>
                      <SelectItem value="canceled" className="text-white hover:bg-slate-700">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-purple-300 text-sm mb-2 block">Interval</label>
                  <Select 
                    value={editFormData.subscription_interval} 
                    onValueChange={(value) => setEditFormData({ ...editFormData, subscription_interval: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="monthly" className="text-white hover:bg-slate-700">Monthly</SelectItem>
                      <SelectItem value="yearly" className="text-white hover:bg-slate-700">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Activity & Progress</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-purple-300 text-sm mb-2 block">Current Streak (days)</label>
                  <Input
                    type="number"
                    value={editFormData.current_streak}
                    onChange={(e) => setEditFormData({ ...editFormData, current_streak: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600 text-white"
                    min="0"
                  />
                </div>

                <div>
                  <label className="text-purple-300 text-sm mb-2 block">Total Logins</label>
                  <Input
                    type="number"
                    value={editFormData.total_logins}
                    onChange={(e) => setEditFormData({ ...editFormData, total_logins: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600 text-white"
                    min="0"
                  />
                </div>

                <div>
                  <label className="text-purple-300 text-sm mb-2 block">Total XP</label>
                  <Input
                    type="number"
                    value={editFormData.xp}
                    onChange={(e) => setEditFormData({ ...editFormData, xp: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600 text-white"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Current Stats Display */}
            {userStats && (
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-purple-300 mb-3">Current Stats (Read-only)</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-purple-400">Completed Lessons</p>
                    <p className="text-white font-bold text-lg">{userStats.completedLessons}</p>
                  </div>
                  <div>
                    <p className="text-purple-400">Earned Badges</p>
                    <p className="text-white font-bold text-lg">{userStats.earnedBadges}</p>
                  </div>
                  <div>
                    <p className="text-purple-400">Last Login</p>
                    <p className="text-white font-bold text-lg">
                      {userStats.lastLogin ? new Date(userStats.lastLogin).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              onClick={() => setShowEditModal(false)}
              variant="outline"
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveUser}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    emerald: 'from-emerald-500 to-teal-500',
    purple: 'from-purple-500 to-violet-500',
    indigo: 'from-indigo-500 to-purple-500',
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:shadow-2xl hover:shadow-purple-500/20 transition-all overflow-hidden group">
      <div className={`h-1 bg-gradient-to-r ${colorClasses[color]}`} />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="select-text cursor-text">
            <p className="text-purple-300 text-sm font-medium mb-1">{title}</p>
            <p className="text-white text-2xl font-bold">{value}</p>
          </div>
          <div className={`rounded-xl p-3 bg-gradient-to-br ${colorClasses[color]} group-hover:scale-110 transition-transform`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
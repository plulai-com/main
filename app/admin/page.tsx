// app/admin/page.tsx
// PREMIUM REDESIGNED VERSION - Beautiful UI/UX with export functionality
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  BookOpen,
  Award,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Eye,
  UserCheck,
  Target,
  Loader2,
  LogOut,
  RefreshCw,
  CreditCard,
  Calendar,
  Activity,
  Download,
  FileSpreadsheet,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardStats {
  totalUsers: number;
  newUsersInPeriod: number;
  monthlyActiveUsers: number;
  churnRate: number;
  periodRevenue: number;
  totalRevenue: number;
  avgSessionDuration: number;
  courseCompletionRate: number;
  pendingSubmissions: number;
  totalBadges: number;
  badgesInPeriod: number;
  totalLessons: number;
  activeCourses: number;
  activeSubscriptions: number;
  newSubscriptionsInPeriod: number;
  canceledSubscriptionsInPeriod: number;
  lessonsCompletedInPeriod: number;
  submissionsInPeriod: number;
  reviewedInPeriod: number;
  totalLoginsInPeriod: number;
  userGrowthPercentage: number;
  revenueGrowthPercentage: number;
}

interface RecentSubmission {
  id: string;
  user_email: string;
  user_name: string;
  activity_title: string;
  submitted_at: string;
  status: string;
  has_screenshot: boolean;
}

type PeriodType = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'allTime';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('thisMonth');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    newUsersInPeriod: 0,
    monthlyActiveUsers: 0,
    churnRate: 0,
    periodRevenue: 0,
    totalRevenue: 0,
    avgSessionDuration: 0,
    courseCompletionRate: 0,
    pendingSubmissions: 0,
    totalBadges: 0,
    badgesInPeriod: 0,
    totalLessons: 0,
    activeCourses: 0,
    activeSubscriptions: 0,
    newSubscriptionsInPeriod: 0,
    canceledSubscriptionsInPeriod: 0,
    lessonsCompletedInPeriod: 0,
    submissionsInPeriod: 0,
    reviewedInPeriod: 0,
    totalLoginsInPeriod: 0,
    userGrowthPercentage: 0,
    revenueGrowthPercentage: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDashboard = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
        }
        await fetchDashboardData();
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        setError('Failed to initialize dashboard');
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchDashboardData();
    }
  }, [selectedPeriod]);

  const getPeriodDates = (period: PeriodType) => {
    const now = new Date();
    let start: Date, end: Date, previousStart: Date, previousEnd: Date;

    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        previousEnd = start;
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
        previousEnd = start;
        break;
      case 'last7days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        end = now;
        previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        previousEnd = start;
        break;
      case 'last30days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        end = now;
        previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
        previousEnd = start;
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = start;
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        previousEnd = start;
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear() + 1, 0, 1);
        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = start;
        break;
      case 'allTime':
      default:
        start = new Date(2000, 0, 1);
        end = new Date(2099, 11, 31);
        previousStart = new Date(2000, 0, 1);
        previousEnd = new Date(2000, 0, 2);
        break;
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
      previousStart: previousStart.toISOString(),
      previousEnd: previousEnd.toISOString(),
    };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const handleRefresh = () => {
    setError(null);
    fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { start, end, previousStart, previousEnd } = getPeriodDates(selectedPeriod);

      const { data: statsData, error: statsError } = await supabase
        .rpc('public_get_dashboard_stats_by_period', {
          period_start: start,
          period_end: end,
        });

      if (statsError) throw statsError;

      const { data: userGrowthData, error: userGrowthError } = await supabase
        .rpc('public_get_user_growth', {
          current_period_start: start,
          current_period_end: end,
          previous_period_start: previousStart,
          previous_period_end: previousEnd,
        });

      if (userGrowthError) throw userGrowthError;

      const { data: revenueGrowthData, error: revenueGrowthError } = await supabase
        .rpc('public_get_revenue_growth', {
          current_period_start: start,
          current_period_end: end,
          previous_period_start: previousStart,
          previous_period_end: previousEnd,
        });

      if (revenueGrowthError) throw revenueGrowthError;

      const { data: submissionsData, error: submissionsError } = await supabase
        .rpc('public_get_recent_submissions', { limit_count: 10 });

      if (submissionsError) throw submissionsError;

      setDashboardStats({
        totalUsers: Number(statsData.total_users) || 0,
        newUsersInPeriod: Number(statsData.new_users_in_period) || 0,
        monthlyActiveUsers: Number(statsData.monthly_active_users) || 0,
        churnRate: Number(statsData.churn_rate) || 0,
        periodRevenue: Number(statsData.period_revenue) || 0,
        totalRevenue: Number(statsData.total_revenue) || 0,
        avgSessionDuration: Number(statsData.avg_session_duration_minutes) || 0,
        courseCompletionRate: Number(statsData.course_completion_rate) || 0,
        pendingSubmissions: Number(statsData.pending_submissions) || 0,
        totalBadges: Number(statsData.total_badges) || 0,
        badgesInPeriod: Number(statsData.badges_in_period) || 0,
        totalLessons: Number(statsData.total_lessons) || 0,
        activeCourses: Number(statsData.active_courses) || 0,
        activeSubscriptions: Number(statsData.active_subscriptions) || 0,
        newSubscriptionsInPeriod: Number(statsData.new_subscriptions_in_period) || 0,
        canceledSubscriptionsInPeriod: Number(statsData.canceled_subscriptions_in_period) || 0,
        lessonsCompletedInPeriod: Number(statsData.lessons_completed_in_period) || 0,
        submissionsInPeriod: Number(statsData.submissions_in_period) || 0,
        reviewedInPeriod: Number(statsData.reviewed_in_period) || 0,
        totalLoginsInPeriod: Number(statsData.total_logins_in_period) || 0,
        userGrowthPercentage: Number(userGrowthData.growth_percentage) || 0,
        revenueGrowthPercentage: Number(revenueGrowthData.growth_percentage) || 0,
      });

      setRecentSubmissions(submissionsData || []);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Period', getPeriodLabel(selectedPeriod)],
      ['Exported At', new Date().toISOString()],
      [''],
      ['USER METRICS', ''],
      ['Total Users', dashboardStats.totalUsers],
      ['New Users', dashboardStats.newUsersInPeriod],
      ['Active Users', dashboardStats.monthlyActiveUsers],
      ['User Growth', `${dashboardStats.userGrowthPercentage}%`],
      ['Total Logins', dashboardStats.totalLoginsInPeriod],
      [''],
      ['REVENUE METRICS', ''],
      ['Period Revenue', `$${dashboardStats.periodRevenue.toFixed(2)}`],
      ['Total Revenue', `$${dashboardStats.totalRevenue.toFixed(2)}`],
      ['Revenue Growth', `${dashboardStats.revenueGrowthPercentage}%`],
      [''],
      ['SUBSCRIPTION METRICS', ''],
      ['Active Subscriptions', dashboardStats.activeSubscriptions],
      ['New Subscriptions', dashboardStats.newSubscriptionsInPeriod],
      ['Canceled Subscriptions', dashboardStats.canceledSubscriptionsInPeriod],
      ['Churn Rate', `${dashboardStats.churnRate}%`],
      [''],
      ['ENGAGEMENT METRICS', ''],
      ['Avg Session Duration', `${dashboardStats.avgSessionDuration} min`],
      [''],
      ['LEARNING METRICS', ''],
      ['Total Badges', dashboardStats.totalBadges],
      ['Badges Earned (Period)', dashboardStats.badgesInPeriod],
      ['Total Lessons', dashboardStats.totalLessons],
      ['Active Courses', dashboardStats.activeCourses],
      ['Lessons Completed (Period)', dashboardStats.lessonsCompletedInPeriod],
      ['Course Completion Rate', `${dashboardStats.courseCompletionRate}%`],
      [''],
      ['ACTIVITY METRICS', ''],
      ['Pending Reviews', dashboardStats.pendingSubmissions],
      ['Submissions (Period)', dashboardStats.submissionsInPeriod],
      ['Reviewed (Period)', dashboardStats.reviewedInPeriod],
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const jsonData = {
      period: getPeriodLabel(selectedPeriod),
      exportedAt: new Date().toISOString(),
      metrics: {
        users: {
          total: dashboardStats.totalUsers,
          new: dashboardStats.newUsersInPeriod,
          active: dashboardStats.monthlyActiveUsers,
          growthPercentage: dashboardStats.userGrowthPercentage,
          totalLogins: dashboardStats.totalLoginsInPeriod,
        },
        revenue: {
          period: dashboardStats.periodRevenue,
          total: dashboardStats.totalRevenue,
          growthPercentage: dashboardStats.revenueGrowthPercentage,
        },
        subscriptions: {
          active: dashboardStats.activeSubscriptions,
          new: dashboardStats.newSubscriptionsInPeriod,
          canceled: dashboardStats.canceledSubscriptionsInPeriod,
          churnRate: dashboardStats.churnRate,
        },
        engagement: {
          avgSessionDurationMinutes: dashboardStats.avgSessionDuration,
        },
        learning: {
          totalBadges: dashboardStats.totalBadges,
          badgesEarnedInPeriod: dashboardStats.badgesInPeriod,
          totalLessons: dashboardStats.totalLessons,
          activeCourses: dashboardStats.activeCourses,
          lessonsCompletedInPeriod: dashboardStats.lessonsCompletedInPeriod,
          completionRate: dashboardStats.courseCompletionRate,
        },
        activity: {
          pendingReviews: dashboardStats.pendingSubmissions,
          submissionsInPeriod: dashboardStats.submissionsInPeriod,
          reviewedInPeriod: dashboardStats.reviewedInPeriod,
        },
      },
      recentSubmissions: recentSubmissions.map(sub => ({
        id: sub.id,
        user: sub.user_name,
        email: sub.user_email,
        activity: sub.activity_title,
        submittedAt: sub.submitted_at,
        status: sub.status,
        hasScreenshot: sub.has_screenshot,
      })),
    };

    const json = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getPeriodLabel = (period: PeriodType): string => {
    const labels: Record<PeriodType, string> = {
      today: 'Today',
      yesterday: 'Yesterday',
      last7days: 'Last 7 Days',
      last30days: 'Last 30 Days',
      thisMonth: 'This Month',
      lastMonth: 'Last Month',
      thisYear: 'This Year',
      allTime: 'All Time',
    };
    return labels[period];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-purple-200 text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none select-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative p-6 md:p-8">
        {/* Header */}
        <div className="max-w-[1600px] mx-auto mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="select-text cursor-text">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                Dashboard
              </h1>
              <p className="text-purple-200 text-lg">
                Welcome back, <span className="text-purple-300 font-medium select-text cursor-text">{user?.email || 'Admin'}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-lg shadow-emerald-500/30">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
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

              <Select value={selectedPeriod} onValueChange={(value: PeriodType) => setSelectedPeriod(value)}>
                <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="today" className="text-white hover:bg-slate-700 cursor-pointer">Today</SelectItem>
                  <SelectItem value="yesterday" className="text-white hover:bg-slate-700 cursor-pointer">Yesterday</SelectItem>
                  <SelectItem value="last7days" className="text-white hover:bg-slate-700 cursor-pointer">Last 7 Days</SelectItem>
                  <SelectItem value="last30days" className="text-white hover:bg-slate-700 cursor-pointer">Last 30 Days</SelectItem>
                  <SelectItem value="thisMonth" className="text-white hover:bg-slate-700 cursor-pointer">This Month</SelectItem>
                  <SelectItem value="lastMonth" className="text-white hover:bg-slate-700 cursor-pointer">Last Month</SelectItem>
                  <SelectItem value="thisYear" className="text-white hover:bg-slate-700 cursor-pointer">This Year</SelectItem>
                  <SelectItem value="allTime" className="text-white hover:bg-slate-700 cursor-pointer">All Time</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                disabled={loading}
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Button 
                onClick={handleLogout} 
                variant="outline"
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="max-w-[1600px] mx-auto mb-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-300 font-medium select-text cursor-text">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Hero Card */}
        <div className="max-w-[1600px] mx-auto mb-8">
          <div className="bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 rounded-2xl p-8 shadow-2xl shadow-purple-900/50 border border-purple-400/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="select-text cursor-text">
                <div className="text-purple-100 text-sm font-medium mb-2 uppercase tracking-wider">
                  {getPeriodLabel(selectedPeriod)}
                </div>
                <h2 className="text-5xl md:text-6xl font-bold text-white mb-2">
                  ${dashboardStats.periodRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h2>
                <p className="text-purple-200 text-lg">Period Revenue</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6 select-text cursor-text">
                <div className="text-right">
                  <div className="text-purple-200 text-sm mb-1">Revenue Growth</div>
                  <div className={`text-2xl font-bold flex items-center justify-end ${dashboardStats.revenueGrowthPercentage >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {dashboardStats.revenueGrowthPercentage >= 0 ? <ArrowUpRight className="w-5 h-5 mr-1" /> : <ArrowDownRight className="w-5 h-5 mr-1" />}
                    {Math.abs(dashboardStats.revenueGrowthPercentage).toFixed(1)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-purple-200 text-sm mb-1">User Growth</div>
                  <div className={`text-2xl font-bold flex items-center justify-end ${dashboardStats.userGrowthPercentage >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {dashboardStats.userGrowthPercentage >= 0 ? <ArrowUpRight className="w-5 h-5 mr-1" /> : <ArrowDownRight className="w-5 h-5 mr-1" />}
                    {Math.abs(dashboardStats.userGrowthPercentage).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Metrics Grid */}
        <div className="max-w-[1600px] mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <EnhancedMetricCard
              title="Total Users"
              value={dashboardStats.totalUsers.toLocaleString()}
              change={`+${dashboardStats.newUsersInPeriod} new`}
              percentage={dashboardStats.userGrowthPercentage}
              icon={<Users className="w-6 h-6" />}
              color="blue"
            />
            
            <EnhancedMetricCard
              title="Active Users"
              value={dashboardStats.monthlyActiveUsers.toLocaleString()}
              change={`${dashboardStats.totalLoginsInPeriod} logins`}
              percentage={0}
              icon={<UserCheck className="w-6 h-6" />}
              color="emerald"
            />

            <EnhancedMetricCard
              title="Active Subscriptions"
              value={dashboardStats.activeSubscriptions.toLocaleString()}
              change={`+${dashboardStats.newSubscriptionsInPeriod} new`}
              percentage={0}
              icon={<CreditCard className="w-6 h-6" />}
              color="purple"
            />

            <EnhancedMetricCard
              title="Churn Rate"
              value={`${dashboardStats.churnRate.toFixed(1)}%`}
              change={`${dashboardStats.canceledSubscriptionsInPeriod} canceled`}
              percentage={0}
              icon={<TrendingDown className="w-6 h-6" />}
              color={dashboardStats.churnRate < 5 ? 'emerald' : 'red'}
            />

            <EnhancedMetricCard
              title="Avg Session Time"
              value={`${dashboardStats.avgSessionDuration} min`}
              change="Per user"
              percentage={0}
              icon={<Clock className="w-6 h-6" />}
              color="amber"
            />

            <EnhancedMetricCard
              title="Total Badges"
              value={dashboardStats.totalBadges.toLocaleString()}
              change={`+${dashboardStats.badgesInPeriod} earned`}
              percentage={0}
              icon={<Award className="w-6 h-6" />}
              color="yellow"
            />

            <EnhancedMetricCard
              title="Course Progress"
              value={`${dashboardStats.courseCompletionRate.toFixed(1)}%`}
              change={`${dashboardStats.lessonsCompletedInPeriod} completed`}
              percentage={0}
              icon={<CheckCircle className="w-6 h-6" />}
              color="indigo"
            />

            <EnhancedMetricCard
              title="Pending Reviews"
              value={dashboardStats.pendingSubmissions.toLocaleString()}
              change={`${dashboardStats.submissionsInPeriod} submitted`}
              percentage={0}
              icon={<Eye className="w-6 h-6" />}
              color="rose"
            />
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="max-w-[1600px] mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SmallStatCard
              label="Total Lessons"
              value={dashboardStats.totalLessons}
              icon={<BookOpen className="w-5 h-5" />}
            />
            <SmallStatCard
              label="Active Courses"
              value={dashboardStats.activeCourses}
              icon={<Target className="w-5 h-5" />}
            />
            <SmallStatCard
              label="Total Revenue"
              value={`$${dashboardStats.totalRevenue.toFixed(2)}`}
              icon={<DollarSign className="w-5 h-5" />}
            />
            <SmallStatCard
              label="Reviewed"
              value={dashboardStats.reviewedInPeriod}
              icon={<CheckCircle className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="max-w-[1600px] mx-auto">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="select-text cursor-text">
                  <CardTitle className="text-white text-2xl">Pending Reviews</CardTitle>
                  <CardDescription className="text-purple-300">
                    {dashboardStats.pendingSubmissions} submissions waiting
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-400 opacity-50" />
                  <p className="text-purple-200 text-lg select-text cursor-text">All caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSubmissions.slice(0, 5).map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-all border border-slate-600/50 hover:border-purple-500/50"
                    >
                      <div className="flex-1 select-text cursor-text">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <p className="font-semibold text-white">{submission.user_name}</p>
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                            {submission.status}
                          </Badge>
                          {submission.has_screenshot && (
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">
                              📷 Screenshot
                            </Badge>
                          )}
                        </div>
                        <p className="text-purple-200 text-sm mb-1">{submission.activity_title}</p>
                        <p className="text-purple-400 text-xs">{formatTimeAgo(submission.submitted_at)}</p>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-purple-600 hover:bg-purple-500 text-white border-0 ml-4"
                      >
                        Review
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface EnhancedMetricCardProps {
  title: string;
  value: string | number;
  change: string;
  percentage: number;
  icon: React.ReactNode;
  color: string;
}

function EnhancedMetricCard({ title, value, change, percentage, icon, color }: EnhancedMetricCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    emerald: 'from-emerald-500 to-teal-500',
    purple: 'from-purple-500 to-violet-500',
    red: 'from-red-500 to-rose-500',
    amber: 'from-amber-500 to-orange-500',
    yellow: 'from-yellow-500 to-amber-500',
    indigo: 'from-indigo-500 to-purple-500',
    rose: 'from-rose-500 to-pink-500',
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 overflow-hidden group">
      <div className={`h-1 bg-gradient-to-r ${colorClasses[color]}`} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 select-text cursor-text">
            <p className="text-purple-300 text-sm font-medium mb-1">{title}</p>
            <p className="text-white text-3xl font-bold mb-1">{value}</p>
          </div>
          <div className={`rounded-xl p-3 bg-gradient-to-br ${colorClasses[color]} group-hover:scale-110 transition-transform`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between select-text cursor-text">
          <span className="text-purple-400 text-sm">{change}</span>
          {percentage !== 0 && (
            <span className={`text-sm font-semibold flex items-center ${percentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {percentage >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(percentage).toFixed(1)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SmallStatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm hover:bg-slate-700/50 transition-all">
      <div className="flex items-center justify-between">
        <div className="select-text cursor-text">
          <p className="text-purple-300 text-xs mb-1">{label}</p>
          <p className="text-white text-xl font-bold">{value}</p>
        </div>
        <div className="text-purple-400">
          {icon}
        </div>
      </div>
    </div>
  );
}
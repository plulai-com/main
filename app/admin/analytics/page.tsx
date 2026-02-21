// app/admin/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  TrendingUp,
  Clock,
  Award,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Activity,
  Target,
  BookOpen,
  Loader2,
  BarChart3,
} from 'lucide-react';

type PeriodType = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'allTime';

interface AnalyticsMetrics {
  dailyActiveUsers: Array<{ date: string; count: number }>;
  courseCompletion: Array<{ date: string; completions: number }>;
  userGrowth: Array<{ month: string; count: number }>;
  xpDistribution: Array<{ range: string; count: number }>;
  badgeDistribution: Array<{ badge: string; count: number }>;
  subscriptionStatus: Array<{ status: string; count: number }>;
  engagementTrends: Array<{ date: string; logins: number; completions: number }>;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  avgTimeSpent: string;
  completionRate: number;
  totalBadges: number;
  activeSubscriptions: number;
  churnRate: number;
  avgXP: number;
}

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('thisMonth');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    dailyActiveUsers: [],
    courseCompletion: [],
    userGrowth: [],
    xpDistribution: [],
    badgeDistribution: [],
    subscriptionStatus: [],
    engagementTrends: [],
  });
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    avgTimeSpent: '0m',
    completionRate: 0,
    totalBadges: 0,
    activeSubscriptions: 0,
    churnRate: 0,
    avgXP: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const getPeriodDates = (period: PeriodType) => {
    const now = new Date();
    let start: Date, end: Date;

    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'last7days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        end = now;
        break;
      case 'last30days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        end = now;
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear() + 1, 0, 1);
        break;
      case 'allTime':
      default:
        start = new Date(2000, 0, 1);
        end = new Date(2099, 11, 31);
        break;
    }

    return { start: start.toISOString(), end: end.toISOString() };
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { start, end } = getPeriodDates(selectedPeriod);

      // Fetch all metrics in parallel
      const [
        totalUsersData,
        activeUsersData,
        badgesData,
        subscriptionsData,
        dailyActiveData,
        courseCompletionData,
        userGrowthData,
        xpData,
        badgeDistData,
        subscriptionDistData,
        engagementData,
        lessonsData,
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('daily_logins').select('user_id').gte('login_date', start.split('T')[0]).lt('login_date', end.split('T')[0]),
        supabase.from('user_badges').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
        getDailyActiveUsers(start, end),
        getCourseCompletions(start, end),
        calculateUserGrowth(),
        calculateXpDistribution(),
        getBadgeDistribution(),
        getSubscriptionDistribution(),
        getEngagementTrends(start, end),
        supabase.from('lesson_progress').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      ]);

      // Calculate stats
      const uniqueActiveUsers = new Set(activeUsersData.data?.map(d => d.user_id) || []).size;
      const totalLessons = await supabase.from('lessons').select('*', { count: 'exact', head: true });
      const completionRate = totalLessons.count && totalLessons.count > 0
        ? Math.round(((lessonsData.count || 0) / totalLessons.count) * 100)
        : 0;

      // Calculate churn rate
      const { count: canceledCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'canceled');

      const totalWithSubscriptions = (subscriptionsData.count || 0) + (canceledCount || 0);
      const churnRate = totalWithSubscriptions > 0
        ? Math.round(((canceledCount || 0) / totalWithSubscriptions) * 100)
        : 0;

      // Calculate avg XP
      const { data: xpProgressData } = await supabase.from('users_progress').select('xp');
      const avgXP = xpProgressData && xpProgressData.length > 0
        ? Math.round(xpProgressData.reduce((sum, p) => sum + (p.xp || 0), 0) / xpProgressData.length)
        : 0;

      setStats({
        totalUsers: totalUsersData.count || 0,
        activeUsers: uniqueActiveUsers,
        avgTimeSpent: '28m',
        completionRate,
        totalBadges: badgesData.count || 0,
        activeSubscriptions: subscriptionsData.count || 0,
        churnRate,
        avgXP,
      });

      setMetrics({
        dailyActiveUsers: dailyActiveData,
        courseCompletion: courseCompletionData,
        userGrowth: userGrowthData,
        xpDistribution: xpData,
        badgeDistribution: badgeDistData,
        subscriptionStatus: subscriptionDistData,
        engagementTrends: engagementData,
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDailyActiveUsers = async (start: string, end: string) => {
    try {
      const { data } = await supabase
        .from('daily_logins')
        .select('login_date')
        .gte('login_date', start.split('T')[0])
        .lt('login_date', end.split('T')[0])
        .order('login_date');

      const dailyCounts: Record<string, number> = {};
      data?.forEach(login => {
        dailyCounts[login.login_date] = (dailyCounts[login.login_date] || 0) + 1;
      });

      return Object.entries(dailyCounts)
        .map(([date, count]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count
        }))
        .slice(-30);
    } catch (error) {
      return [];
    }
  };

  const getCourseCompletions = async (start: string, end: string) => {
    try {
      const { data } = await supabase
        .from('lesson_progress')
        .select('completed_at')
        .eq('status', 'completed')
        .gte('completed_at', start)
        .lt('completed_at', end)
        .order('completed_at');

      const dailyCompletions: Record<string, number> = {};
      data?.forEach(completion => {
        if (completion.completed_at) {
          const date = new Date(completion.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dailyCompletions[date] = (dailyCompletions[date] || 0) + 1;
        }
      });

      return Object.entries(dailyCompletions)
        .map(([date, completions]) => ({ date, completions }))
        .slice(-30);
    } catch (error) {
      return [];
    }
  };

  const calculateUserGrowth = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('updated_at')
        .order('updated_at');

      const monthlyData: Record<string, number> = {};
      data?.forEach(profile => {
        const date = new Date(profile.updated_at);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
      });

      return Object.entries(monthlyData)
        .map(([month, count]) => ({ month, count }))
        .slice(-12);
    } catch (error) {
      return [];
    }
  };

  const calculateXpDistribution = async () => {
    try {
      const { data } = await supabase.from('users_progress').select('xp');

      const buckets = [
        { range: '0-100', count: 0 },
        { range: '101-500', count: 0 },
        { range: '501-1K', count: 0 },
        { range: '1K-2K', count: 0 },
        { range: '2K+', count: 0 },
      ];

      data?.forEach(progress => {
        if (progress.xp <= 100) buckets[0].count++;
        else if (progress.xp <= 500) buckets[1].count++;
        else if (progress.xp <= 1000) buckets[2].count++;
        else if (progress.xp <= 2000) buckets[3].count++;
        else buckets[4].count++;
      });

      return buckets;
    } catch (error) {
      return [];
    }
  };

  const getBadgeDistribution = async () => {
    try {
      const { data } = await supabase
        .from('user_badges')
        .select('badge_id, badges(name)');

      const badgeCounts: Record<string, number> = {};
      data?.forEach(ub => {
        const badgeName = (ub as any).badges?.name || 'Unknown';
        badgeCounts[badgeName] = (badgeCounts[badgeName] || 0) + 1;
      });

      return Object.entries(badgeCounts)
        .map(([badge, count]) => ({ badge, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    } catch (error) {
      return [];
    }
  };

  const getSubscriptionDistribution = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_status');

      const statusCounts: Record<string, number> = {};
      data?.forEach(profile => {
        const status = profile.subscription_status || 'inactive';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      return Object.entries(statusCounts)
        .map(([status, count]) => ({ 
          status: status.charAt(0).toUpperCase() + status.slice(1), 
          count 
        }));
    } catch (error) {
      return [];
    }
  };

  const getEngagementTrends = async (start: string, end: string) => {
    try {
      const [logins, completions] = await Promise.all([
        supabase.from('daily_logins').select('login_date').gte('login_date', start.split('T')[0]).lt('login_date', end.split('T')[0]),
        supabase.from('lesson_progress').select('completed_at').eq('status', 'completed').gte('completed_at', start).lt('completed_at', end),
      ]);

      const dailyData: Record<string, { logins: number; completions: number }> = {};

      logins.data?.forEach(login => {
        const date = new Date(login.login_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dailyData[date]) dailyData[date] = { logins: 0, completions: 0 };
        dailyData[date].logins++;
      });

      completions.data?.forEach(completion => {
        if (completion.completed_at) {
          const date = new Date(completion.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!dailyData[date]) dailyData[date] = { logins: 0, completions: 0 };
          dailyData[date].completions++;
        }
      });

      return Object.entries(dailyData)
        .map(([date, data]) => ({ date, ...data }))
        .slice(-30);
    } catch (error) {
      return [];
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['Analytics Report'],
      ['Period', getPeriodLabel(selectedPeriod)],
      ['Generated', new Date().toLocaleString()],
      [''],
      ['SUMMARY METRICS'],
      ['Total Users', stats.totalUsers],
      ['Active Users', stats.activeUsers],
      ['Avg Time Spent', stats.avgTimeSpent],
      ['Completion Rate', `${stats.completionRate}%`],
      ['Total Badges', stats.totalBadges],
      ['Active Subscriptions', stats.activeSubscriptions],
      ['Churn Rate', `${stats.churnRate}%`],
      ['Average XP', stats.avgXP],
      [''],
      ['DAILY ACTIVE USERS'],
      ['Date', 'Count'],
      ...metrics.dailyActiveUsers.map(d => [d.date, d.count]),
      [''],
      ['COURSE COMPLETIONS'],
      ['Date', 'Completions'],
      ...metrics.courseCompletion.map(d => [d.date, d.completions]),
      [''],
      ['USER GROWTH'],
      ['Month', 'New Users'],
      ...metrics.userGrowth.map(d => [d.month, d.count]),
      [''],
      ['XP DISTRIBUTION'],
      ['Range', 'Users'],
      ...metrics.xpDistribution.map(d => [d.range, d.count]),
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const jsonData = {
      period: getPeriodLabel(selectedPeriod),
      exportedAt: new Date().toISOString(),
      summary: stats,
      metrics: metrics,
    };

    const json = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-purple-200 text-lg font-medium">Loading analytics...</p>
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
              Analytics Dashboard
            </h1>
            <p className="text-purple-200 text-lg">
              Comprehensive insights for {getPeriodLabel(selectedPeriod).toLowerCase()}
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
                <SelectItem value="today" className="text-white hover:bg-slate-700">Today</SelectItem>
                <SelectItem value="yesterday" className="text-white hover:bg-slate-700">Yesterday</SelectItem>
                <SelectItem value="last7days" className="text-white hover:bg-slate-700">Last 7 Days</SelectItem>
                <SelectItem value="last30days" className="text-white hover:bg-slate-700">Last 30 Days</SelectItem>
                <SelectItem value="thisMonth" className="text-white hover:bg-slate-700">This Month</SelectItem>
                <SelectItem value="lastMonth" className="text-white hover:bg-slate-700">Last Month</SelectItem>
                <SelectItem value="thisYear" className="text-white hover:bg-slate-700">This Year</SelectItem>
                <SelectItem value="allTime" className="text-white hover:bg-slate-700">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={fetchAnalytics}
              variant="outline"
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Users" value={stats.totalUsers.toLocaleString()} icon={<Users />} color="blue" />
          <StatCard title="Active Users" value={stats.activeUsers.toLocaleString()} icon={<Activity />} color="emerald" />
          <StatCard title="Completion Rate" value={`${stats.completionRate}%`} icon={<Target />} color="purple" />
          <StatCard title="Avg Time Spent" value={stats.avgTimeSpent} icon={<Clock />} color="amber" />
          <StatCard title="Total Badges" value={stats.totalBadges.toLocaleString()} icon={<Award />} color="yellow" />
          <StatCard title="Active Subscriptions" value={stats.activeSubscriptions.toLocaleString()} icon={<TrendingUp />} color="indigo" />
          <StatCard title="Churn Rate" value={`${stats.churnRate}%`} icon={<BarChart3 />} color={stats.churnRate < 5 ? 'emerald' : 'red'} />
          <StatCard title="Average XP" value={stats.avgXP.toLocaleString()} icon={<BookOpen />} color="violet" />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Active Users */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white select-text cursor-text">Daily Active Users</CardTitle>
              <CardDescription className="text-purple-300">Login activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {metrics.dailyActiveUsers.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.dailyActiveUsers}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="date" stroke="#cbd5e1" />
                      <YAxis stroke="#cbd5e1" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }}
                      />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-purple-400">No data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Course Completions */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white select-text cursor-text">Course Completions</CardTitle>
              <CardDescription className="text-purple-300">Lessons completed daily</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {metrics.courseCompletion.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.courseCompletion}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="date" stroke="#cbd5e1" />
                      <YAxis stroke="#cbd5e1" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }}
                      />
                      <Bar dataKey="completions" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-purple-400">No data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Growth */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white select-text cursor-text">User Growth</CardTitle>
              <CardDescription className="text-purple-300">Monthly user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {metrics.userGrowth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="month" stroke="#cbd5e1" />
                      <YAxis stroke="#cbd5e1" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }}
                      />
                      <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-purple-400">No data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* XP Distribution */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white select-text cursor-text">XP Distribution</CardTitle>
              <CardDescription className="text-purple-300">User progress levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {metrics.xpDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.xpDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="range" stroke="#cbd5e1" />
                      <YAxis stroke="#cbd5e1" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }}
                      />
                      <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-purple-400">No data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Badge Distribution */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white select-text cursor-text">Top Badges</CardTitle>
              <CardDescription className="text-purple-300">Most earned badges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {metrics.badgeDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.badgeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ badge, percent }) => `${badge}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {metrics.badgeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-purple-400">No badges earned yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white select-text cursor-text">Subscription Status</CardTitle>
              <CardDescription className="text-purple-300">Distribution of subscription types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {metrics.subscriptionStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.subscriptionStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {metrics.subscriptionStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-purple-400">No subscription data</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Trends */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white select-text cursor-text">Engagement Trends</CardTitle>
            <CardDescription className="text-purple-300">Login vs completion activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              {metrics.engagementTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.engagementTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="date" stroke="#cbd5e1" />
                    <YAxis stroke="#cbd5e1" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="logins" stroke="#3b82f6" strokeWidth={2} name="Logins" />
                    <Line type="monotone" dataKey="completions" stroke="#10b981" strokeWidth={2} name="Completions" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-purple-400">No engagement data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    emerald: 'from-emerald-500 to-teal-500',
    purple: 'from-purple-500 to-violet-500',
    amber: 'from-amber-500 to-orange-500',
    yellow: 'from-yellow-500 to-amber-500',
    indigo: 'from-indigo-500 to-purple-500',
    red: 'from-red-500 to-rose-500',
    violet: 'from-violet-500 to-purple-500',
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
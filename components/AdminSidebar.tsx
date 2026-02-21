// components/AdminSidebar.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileText,
  Settings, 
  BarChart, 
  MessageSquare, 
  Bell,
  Shield,
  Database,
  GraduationCap,
  Trophy,
  Zap,
  Cpu,
  History,
  CreditCard,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  FileCheck,
  Gamepad2,
  Target,
  Activity,
  Clock
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Your Supabase client

interface DashboardStats {
  pendingReviews: number;
  totalUsers: number;
  activeToday: number;
  newMessages: number;
  totalCourses: number;
  totalLessons: number;
  systemStatus: 'healthy' | 'warning' | 'error';
}

interface SidebarItem {
  path: string;
  icon: any;
  label: string;
  count: number | null;
}

interface Section {
  title: string;
  items: SidebarItem[];
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    pendingReviews: 0,
    totalUsers: 0,
    activeToday: 0,
    newMessages: 0,
    totalCourses: 0,
    totalLessons: 0,
    systemStatus: 'healthy'
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch real data from database
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [
        pendingReviewsRes,
        totalUsersRes,
        activeTodayRes,
        newMessagesRes,
        totalCoursesRes,
        totalLessonsRes
      ] = await Promise.all([
        // Pending activity submissions
        supabase
          .from('activity_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'submitted'),

        // Total users
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true }),

        // Users active today
        supabase
          .from('daily_logins')
          .select('*', { count: 'exact', head: true })
          .eq('login_date', new Date().toISOString().split('T')[0]),

        // Unread admin notifications
        supabase
          .from('admin_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false),

        // Total courses
        supabase
          .from('courses')
          .select('*', { count: 'exact', head: true }),

        // Total lessons
        supabase
          .from('lessons')
          .select('*', { count: 'exact', head: true })
      ]);

      // Check system status
      const systemCheck = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      const pendingReviews = pendingReviewsRes.count || 0;
      const systemStatus = systemCheck.error ? 'error' : 
                         pendingReviews > 50 ? 'warning' : 'healthy';

      setStats({
        pendingReviews,
        totalUsers: totalUsersRes.count || 0,
        activeToday: activeTodayRes.count || 0,
        newMessages: newMessagesRes.count || 0,
        totalCourses: totalCoursesRes.count || 0,
        totalLessons: totalLessonsRes.count || 0,
        systemStatus
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats(prev => ({ ...prev, systemStatus: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();

    // Set up real-time subscriptions
    const tables = ['activity_submissions', 'profiles', 'daily_logins', 'admin_notifications'];
    
    const subscriptions = tables.map(table => {
      return supabase
        .channel(`public:${table}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table },
          fetchDashboardStats
        )
        .subscribe();
    });

    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
      clearInterval(interval);
    };
  }, []);

  // Dashboard sections with real data
  const sections: Section[] = [
    {
      title: 'Overview',
      items: [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', count: null },
        { path: '/admin/analytics', icon: BarChart, label: 'Analytics', count: null },
        { path: '/admin/activity', icon: Activity, label: 'Live Activity', count: stats.activeToday },
      ]
    },
    {
      title: 'Users',
      items: [
        { path: '/admin/users', icon: Users, label: 'All Users', count: stats.totalUsers },
        // { path: '/admin/students', icon: GraduationCap, label: 'Students', count: stats.totalUsers },
        { path: '/admin/progress', icon: Target, label: 'Progress', count: null },
      ]
    },
    {
      title: 'Content',
      items: [
        { path: '/admin/courses', icon: BookOpen, label: 'Courses', count: stats.totalCourses },
        { path: '/admin/lessons', icon: FileText, label: 'Lessons', count: stats.totalLessons },
        { path: '/admin/activities', icon: Gamepad2, label: 'Activities', count: null },
      ]
    },
    {
      title: 'Assessment',
      items: [
        { path: '/admin/submissions', icon: FileText, label: 'Submissions', count: stats.pendingReviews },
        { path: '/admin/reviews', icon: FileCheck, label: 'Review Queue', count: stats.pendingReviews },
        { path: '/admin/certificates', icon: Trophy, label: 'Certificates', count: null },
      ]
    },
    {
      title: 'Engagement',
      items: [
        { path: '/admin/messages', icon: MessageSquare, label: 'Messages', count: stats.newMessages },
        { path: '/admin/notifications', icon: Bell, label: 'Notifications', count: null },
        { path: '/admin/badges', icon: Trophy, label: 'Badges', count: null },
        { path: '/admin/streaks', icon: Zap, label: 'Streaks', count: null },
      ]
    },
    {
      title: 'System',
      items: [
        { path: '/admin/database', icon: Database, label: 'Database', count: null },
        { path: '/admin/security', icon: Shield, label: 'Security', count: null },
        { path: '/admin/audit', icon: History, label: 'Audit Logs', count: null },
        { path: '/admin/ai-tutor', icon: Cpu, label: 'AI Tutor', count: null },
        { path: '/admin/billing', icon: CreditCard, label: 'Billing', count: null },
        { path: '/admin/settings', icon: Settings, label: 'Settings', count: null },
      ]
    }
  ];

  const filteredSections = searchTerm 
    ? sections.map(section => ({
        ...section,
        items: section.items.filter(item => 
          item.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(section => section.items.length > 0)
    : sections;

  const SidebarContent = () => (
    <div className={`h-full flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r`}>
      {/* Header */}
      <div className={`p-5 border-b ${isCollapsed ? 'px-4' : ''}`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                stats.systemStatus === 'healthy' ? 'bg-green-500' :
                stats.systemStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}>
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">EduTech</h1>
                <div className="flex items-center space-x-1">
                  <div className={`h-2 w-2 rounded-full ${
                    stats.systemStatus === 'healthy' ? 'bg-green-500' :
                    stats.systemStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <p className="text-xs text-gray-500">
                    {stats.systemStatus === 'healthy' ? 'System OK' :
                     stats.systemStatus === 'warning' ? 'Warning' : 'Error'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div 
              className={`h-9 w-9 rounded-lg flex items-center justify-center cursor-pointer ${
                stats.systemStatus === 'healthy' ? 'bg-green-500' :
                stats.systemStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              onClick={() => setIsCollapsed(false)}
            >
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-sm font-bold text-gray-900">{stats.pendingReviews}</div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-gray-900">{stats.activeToday}</div>
              <div className="text-xs text-gray-500">Active</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-gray-900">{stats.newMessages}</div>
              <div className="text-xs text-gray-500">Messages</div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search admin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 px-3">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                <div className="space-y-1">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-10 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          filteredSections.map((section) => (
            <div key={section.title} className="mb-4">
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                  {section.title}
                </h3>
              )}
              
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.path || pathname?.startsWith(`${item.path}/`);
                  const count = item.count;
                  
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={`
                        flex items-center ${isCollapsed ? 'justify-center px-3' : 'justify-between px-3'}
                        py-2.5 rounded-lg transition-colors group relative
                        ${isActive 
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500' 
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                        }
                      `}
                      title={isCollapsed ? item.label : ''}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`
                          flex items-center justify-center h-7 w-7
                          ${isActive 
                            ? 'text-blue-600' 
                            : 'text-gray-500 group-hover:text-blue-500'
                          }
                        `}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        
                        {!isCollapsed && (
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                        )}
                      </div>
                      
                      {!isCollapsed && count !== null && count > 0 && (
                        <span className={`
                          text-xs font-medium px-2 py-0.5 rounded-full min-w-5 text-center
                          ${isActive 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-600'
                          }
                        `}>
                          {count > 99 ? '99+' : count}
                        </span>
                      )}
                      
                      {isCollapsed && count !== null && count > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-[10px] bg-red-500 text-white rounded-full">
                          {count > 9 ? '9+' : count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className={`border-t p-4 ${isCollapsed ? 'px-3' : ''}`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-xs font-semibold text-white">A</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Admin</p>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={fetchDashboardStats}
              className="p-1.5 hover:bg-gray-100 rounded"
              aria-label="Refresh data"
              disabled={loading}
            >
              <Clock className={`h-4 w-4 ${loading ? 'animate-spin text-blue-500' : 'text-gray-500'}`} />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-xs font-semibold text-white">A</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Get toggle button position
  const toggleLeft = isCollapsed ? 'left-5' : 'left-64';

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow border"
        aria-label="Toggle sidebar"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 lg:hidden z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen z-40
        transition-transform duration-300
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
      `}>
        <SidebarContent />
      </aside>

      {/* Desktop Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`hidden lg:fixed top-1/2 z-30 h-8 w-8
          items-center justify-center bg-white border rounded-full shadow
          hover:bg-gray-50 transition-all duration-300 lg:flex ${toggleLeft}`}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        )}
      </button>
    </>
  );
}
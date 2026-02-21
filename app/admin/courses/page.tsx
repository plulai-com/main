// app/admin/courses/page.tsx
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
  BookOpen,
  Search,
  Filter,
  MoreVertical,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
  FileText,
  Users,
  Clock,
  CheckCircle,
  Target,
  GraduationCap,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  estimated_duration: number;
  thumbnail_url: string | null;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  lesson_count: number;
  enrolled_users: number;
}

interface CourseFormData {
  title: string;
  description: string;
  difficulty_level: string;
  estimated_duration: number;
  thumbnail_url: string;
  is_published: boolean;
  display_order: number;
}

type FilterType = 'all' | 'published' | 'unpublished' | 'beginner' | 'intermediate' | 'advanced';

export default function CoursesManagementPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [courseDetails, setCourseDetails] = useState<any>(null);
  
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    difficulty_level: 'beginner',
    estimated_duration: 30,
    thumbnail_url: '',
    is_published: false,
    display_order: 0,
  });

  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    totalLessons: 0,
    totalEnrollments: 0,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [courses, searchQuery, selectedFilter]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      console.log('Fetching courses...');
      
      const { data, error } = await supabase.rpc('public_get_all_courses');

      console.log('RPC Response:', { data, error });

      if (error) {
        console.error('RPC Error:', error);
        throw new Error(`RPC Error: ${error.message || JSON.stringify(error)}`);
      }

      // Data comes back as JSON array
      const coursesArray = Array.isArray(data) ? data : [];
      console.log('Courses data:', coursesArray);

      setCourses(coursesArray);

      // Calculate stats
      const totalCourses = coursesArray.length;
      const publishedCourses = coursesArray.filter((c: Course) => c.is_published).length;
      const totalLessons = coursesArray.reduce((sum: number, c: Course) => sum + (c.lesson_count || 0), 0);
      const totalEnrollments = coursesArray.reduce((sum: number, c: Course) => sum + (c.enrolled_users || 0), 0);

      setStats({ totalCourses, publishedCourses, totalLessons, totalEnrollments });
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      console.error('Error stack:', error.stack);
      alert(`Failed to load courses: ${error.message || 'Unknown error'}. Check console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...courses];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filter
    switch (selectedFilter) {
      case 'published':
        filtered = filtered.filter(c => c.is_published);
        break;
      case 'unpublished':
        filtered = filtered.filter(c => !c.is_published);
        break;
      case 'beginner':
        filtered = filtered.filter(c => c.difficulty_level === 'beginner');
        break;
      case 'intermediate':
        filtered = filtered.filter(c => c.difficulty_level === 'intermediate');
        break;
      case 'advanced':
        filtered = filtered.filter(c => c.difficulty_level === 'advanced');
        break;
    }

    setFilteredCourses(filtered);
  };

  const handleCreateCourse = async () => {
    try {
      const { data, error } = await supabase.rpc('public_create_course', {
        params: {
          title: formData.title,
          description: formData.description,
          difficulty_level: formData.difficulty_level,
          estimated_duration: formData.estimated_duration,
          thumbnail_url: formData.thumbnail_url || null,
          is_published: formData.is_published,
          display_order: formData.display_order,
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to create course');

      setShowCreateModal(false);
      resetForm();
      await fetchCourses();
      alert('Course created successfully!');
    } catch (error: any) {
      console.error('Error creating course:', error);
      alert(`Failed to create course: ${error.message}`);
    }
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      difficulty_level: course.difficulty_level,
      estimated_duration: course.estimated_duration,
      thumbnail_url: course.thumbnail_url || '',
      is_published: course.is_published,
      display_order: course.display_order,
    });
    setShowEditModal(true);
  };

  const handleUpdateCourse = async () => {
    if (!selectedCourse) return;

    try {
      const { data, error } = await supabase.rpc('public_update_course', {
        params: {
          course_id: selectedCourse.id,
          title: formData.title,
          description: formData.description,
          difficulty_level: formData.difficulty_level,
          estimated_duration: formData.estimated_duration,
          thumbnail_url: formData.thumbnail_url || null,
          is_published: formData.is_published,
          display_order: formData.display_order,
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to update course');

      setShowEditModal(false);
      resetForm();
      await fetchCourses();
      alert('Course updated successfully!');
    } catch (error: any) {
      console.error('Error updating course:', error);
      alert(`Failed to update course: ${error.message}`);
    }
  };

  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will also delete all lessons and progress data.`)) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc('public_delete_course', {
        params: { course_id: courseId }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to delete course');

      await fetchCourses();
      alert('Course deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting course:', error);
      alert(`Failed to delete course: ${error.message}`);
    }
  };

  const handleTogglePublish = async (courseId: string) => {
    try {
      const { data, error } = await supabase.rpc('public_toggle_course_publish', {
        params: { course_id: courseId }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to toggle publish status');

      await fetchCourses();
    } catch (error: any) {
      console.error('Error toggling publish:', error);
      alert(`Failed to update status: ${error.message}`);
    }
  };

  const handleViewDetails = async (course: Course) => {
    setSelectedCourse(course);
    try {
      const { data, error } = await supabase.rpc('public_get_course_details', {
        params: { course_id: course.id }
      });

      if (error) throw error;
      setCourseDetails(data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching course details:', error);
      alert('Failed to load course details');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      difficulty_level: 'beginner',
      estimated_duration: 30,
      thumbnail_url: '',
      is_published: false,
      display_order: 0,
    });
    setSelectedCourse(null);
  };

  const exportToCSV = () => {
    const csvData = [
      ['Course Management Export'],
      ['Generated', new Date().toLocaleString()],
      ['Total Courses', stats.totalCourses],
      [''],
      ['ID', 'Title', 'Difficulty', 'Duration (min)', 'Lessons', 'Enrolled Users', 'Published', 'Display Order'],
      ...filteredCourses.map(c => [
        c.id,
        c.title,
        c.difficulty_level,
        c.estimated_duration,
        c.lesson_count,
        c.enrolled_users,
        c.is_published ? 'Yes' : 'No',
        c.display_order,
      ]),
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `courses-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const jsonData = {
      exportedAt: new Date().toISOString(),
      totalCourses: stats.totalCourses,
      courses: filteredCourses.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        difficultyLevel: c.difficulty_level,
        estimatedDuration: c.estimated_duration,
        lessonCount: c.lesson_count,
        enrolledUsers: c.enrolled_users,
        isPublished: c.is_published,
        displayOrder: c.display_order,
      })),
    };

    const json = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `courses-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'advanced':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-purple-200 text-lg font-medium">Loading courses...</p>
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
              Course Management
            </h1>
            <p className="text-purple-200 text-lg">
              Manage courses, lessons, and content
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-lg shadow-emerald-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Course
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
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
              onClick={fetchCourses}
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
            title="Total Courses"
            value={stats.totalCourses.toLocaleString()}
            icon={<BookOpen className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Published"
            value={stats.publishedCourses.toLocaleString()}
            icon={<CheckCircle className="w-6 h-6" />}
            color="emerald"
          />
          <StatCard
            title="Total Lessons"
            value={stats.totalLessons.toLocaleString()}
            icon={<GraduationCap className="w-6 h-6" />}
            color="purple"
          />
          <StatCard
            title="Total Enrollments"
            value={stats.totalEnrollments.toLocaleString()}
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
                  placeholder="Search courses..."
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
                  <SelectItem value="all" className="text-white hover:bg-slate-700">All Courses</SelectItem>
                  <SelectItem value="published" className="text-white hover:bg-slate-700">Published</SelectItem>
                  <SelectItem value="unpublished" className="text-white hover:bg-slate-700">Unpublished</SelectItem>
                  <SelectItem value="beginner" className="text-white hover:bg-slate-700">Beginner</SelectItem>
                  <SelectItem value="intermediate" className="text-white hover:bg-slate-700">Intermediate</SelectItem>
                  <SelectItem value="advanced" className="text-white hover:bg-slate-700">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 text-purple-300 text-sm select-text cursor-text">
              Showing {filteredCourses.length} of {courses.length} courses
            </div>
          </CardContent>
        </Card>

        {/* Courses Table */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-700/50">
                    <TableHead className="text-purple-300">Title</TableHead>
                    <TableHead className="text-purple-300">Difficulty</TableHead>
                    <TableHead className="text-purple-300">Duration</TableHead>
                    <TableHead className="text-purple-300">Lessons</TableHead>
                    <TableHead className="text-purple-300">Enrolled</TableHead>
                    <TableHead className="text-purple-300">Status</TableHead>
                    <TableHead className="text-purple-300">Order</TableHead>
                    <TableHead className="text-purple-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id} className="border-slate-700 hover:bg-slate-700/50 transition-colors">
                      <TableCell className="font-medium text-white select-text cursor-text max-w-xs">
                        <div>
                          <p className="font-semibold">{course.title}</p>
                          <p className="text-sm text-purple-300 truncate">{course.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDifficultyColor(course.difficulty_level)}>
                          {course.difficulty_level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-purple-200 select-text cursor-text">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {course.estimated_duration} min
                        </div>
                      </TableCell>
                      <TableCell className="text-purple-200 select-text cursor-text">
                        {course.lesson_count || 0}
                      </TableCell>
                      <TableCell className="text-purple-200 select-text cursor-text">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course.enrolled_users || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={course.is_published 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                        }>
                          {course.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-purple-200 select-text cursor-text">
                        {course.display_order}
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
                              onClick={() => handleViewDetails(course)}
                              className="text-white hover:bg-slate-700 cursor-pointer"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleEditCourse(course)}
                              className="text-white hover:bg-slate-700 cursor-pointer"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Course
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem 
                              onClick={() => handleTogglePublish(course.id)}
                              className="text-white hover:bg-slate-700 cursor-pointer"
                            >
                              {course.is_published ? (
                                <><EyeOff className="w-4 h-4 mr-2" />Unpublish</>
                              ) : (
                                <><Eye className="w-4 h-4 mr-2" />Publish</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteCourse(course.id, course.title)}
                              className="text-red-400 hover:bg-red-900/20 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Course
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Course Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create New Course</DialogTitle>
            <DialogDescription className="text-purple-300">
              Add a new course to your platform
            </DialogDescription>
          </DialogHeader>

          <CourseForm formData={formData} setFormData={setFormData} />

          <DialogFooter className="gap-2">
            <Button 
              onClick={() => { setShowCreateModal(false); resetForm(); }}
              variant="outline"
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCourse}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white"
            >
              Create Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Course Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Course</DialogTitle>
            <DialogDescription className="text-purple-300">
              Update course information
            </DialogDescription>
          </DialogHeader>

          <CourseForm formData={formData} setFormData={setFormData} />

          <DialogFooter className="gap-2">
            <Button 
              onClick={() => { setShowEditModal(false); resetForm(); }}
              variant="outline"
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateCourse}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Course Details</DialogTitle>
            <DialogDescription className="text-purple-300">
              {selectedCourse?.title}
            </DialogDescription>
          </DialogHeader>

          {courseDetails && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-700/50 rounded-lg">
                <div className="select-text cursor-text">
                  <p className="text-purple-300 text-sm mb-1">Total Lessons</p>
                  <p className="text-white font-bold text-xl">{courseDetails.stats.total_lessons}</p>
                </div>
                <div className="select-text cursor-text">
                  <p className="text-purple-300 text-sm mb-1">Enrolled Users</p>
                  <p className="text-white font-bold text-xl">{courseDetails.stats.enrolled_users}</p>
                </div>
                <div className="select-text cursor-text">
                  <p className="text-purple-300 text-sm mb-1">Completions</p>
                  <p className="text-white font-bold text-xl">{courseDetails.stats.total_completions}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Lessons</h3>
                {courseDetails.lessons.length > 0 ? (
                  <div className="space-y-2">
                    {courseDetails.lessons.map((lesson: any) => (
                      <div key={lesson.id} className="p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="select-text cursor-text">
                            <p className="text-white font-medium">{lesson.title}</p>
                            <p className="text-sm text-purple-300">{lesson.description}</p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="text-purple-400">{lesson.step_count} steps</p>
                            <p className="text-emerald-400">{lesson.completion_count} completed</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-purple-400 text-center py-4">No lessons yet</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              onClick={() => setShowDetailsModal(false)}
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Course Form Component
function CourseForm({ formData, setFormData }: { 
  formData: CourseFormData; 
  setFormData: React.Dispatch<React.SetStateAction<CourseFormData>> 
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-purple-300 text-sm mb-2 block">Title</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="bg-slate-700 border-slate-600 text-white"
          placeholder="Course title"
        />
      </div>

      <div>
        <label className="text-purple-300 text-sm mb-2 block">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full bg-slate-700 border-slate-600 text-white rounded-md p-3 min-h-[100px]"
          placeholder="Course description..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-purple-300 text-sm mb-2 block">Difficulty Level</label>
          <Select 
            value={formData.difficulty_level} 
            onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
          >
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="beginner" className="text-white hover:bg-slate-700">Beginner</SelectItem>
              <SelectItem value="intermediate" className="text-white hover:bg-slate-700">Intermediate</SelectItem>
              <SelectItem value="advanced" className="text-white hover:bg-slate-700">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-purple-300 text-sm mb-2 block">Duration (minutes)</label>
          <Input
            type="number"
            value={formData.estimated_duration}
            onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) || 0 })}
            className="bg-slate-700 border-slate-600 text-white"
            min="1"
          />
        </div>

        <div>
          <label className="text-purple-300 text-sm mb-2 block">Display Order</label>
          <Input
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
            className="bg-slate-700 border-slate-600 text-white"
            min="0"
          />
        </div>

        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="published"
            checked={formData.is_published}
            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="published" className="text-purple-300 text-sm cursor-pointer">
            Publish immediately
          </label>
        </div>
      </div>

      <div>
        <label className="text-purple-300 text-sm mb-2 block">Thumbnail URL (optional)</label>
        <Input
          value={formData.thumbnail_url}
          onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
          className="bg-slate-700 border-slate-600 text-white"
          placeholder="https://..."
        />
      </div>
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
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Submission {
  id: string;
  user_id: string;
  activity_id: string;
  screenshot_url: string | null;
  notes: string | null;
  points_awarded: number | null;
  submitted_at: string;
  reviewed_at: string | null;
  status: 'submitted' | 'reviewed' | 'rejected';
  user?: {
    email: string;
    username: string | null;
  };
  activity?: {
    title: string;
    type: string;
  };
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<'submitted' | 'reviewed' | 'rejected'>('submitted');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_submissions')
        .select(`
          *,
          user:profiles!activity_submissions_user_id_fkey(email, username),
          activity:lesson_steps!activity_submissions_activity_id_fkey(title, type)
        `)
        .eq('status', filter)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (submissionId: string, points: number, notes: string) => {
    try {
      // Update submission status
      const { error: submissionError } = await supabase
        .from('activity_submissions')
        .update({
          status: 'reviewed',
          points_awarded: points,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (submissionError) throw submissionError;

      // Get submission to award XP
      const { data: submission } = await supabase
        .from('activity_submissions')
        .select('user_id')
        .eq('id', submissionId)
        .single();

      if (submission) {
        // Award XP to user
        await supabase
          .from('xp_events')
          .insert({
            user_id: submission.user_id,
            amount: points,
            reason: 'Activity submission review',
            event_type: 'lesson_completion'
          });
      }

      fetchSubmissions();
    } catch (error) {
      console.error('Error reviewing submission:', error);
    }
  };

  const handleReject = async (submissionId: string) => {
    if (!confirm('Are you sure you want to reject this submission?')) return;
    
    try {
      const { error } = await supabase
        .from('activity_submissions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;
      fetchSubmissions();
    } catch (error) {
      console.error('Error rejecting submission:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Activity Submissions</h1>
      
      {/* Custom Tabs Implementation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilter('submitted')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'submitted'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Review ({submissions.filter(s => s.status === 'submitted').length})
          </button>
          <button
            onClick={() => setFilter('reviewed')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'reviewed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reviewed
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'rejected'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Rejected
          </button>
        </nav>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {submissions.map((submission) => (
          <div key={submission.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {submission.activity?.title || 'Unknown Activity'}
                </h3>
                <p className="text-gray-600 text-sm">
                  Submitted by {submission.user?.email || 'Unknown User'} • {new Date(submission.submitted_at).toLocaleString()}
                </p>
                {submission.notes && (
                  <p className="mt-2 text-gray-700">{submission.notes}</p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                submission.status === 'submitted' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : submission.status === 'reviewed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
              </span>
            </div>

            {submission.screenshot_url && (
              <div className="mb-4">
                <img 
                  src={submission.screenshot_url} 
                  alt="Submission screenshot" 
                  className="max-w-full h-auto rounded-lg border"
                />
              </div>
            )}

            {submission.status === 'submitted' && (
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Award Points
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0-100"
                      className="border rounded px-3 py-2 w-24"
                      id={`points-${submission.id}`}
                    />
                    <input
                      type="text"
                      placeholder="Feedback notes..."
                      className="border rounded px-3 py-2 flex-1"
                      id={`notes-${submission.id}`}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const pointsInput = document.getElementById(`points-${submission.id}`) as HTMLInputElement;
                      const notesInput = document.getElementById(`notes-${submission.id}`) as HTMLInputElement;
                      handleReview(
                        submission.id, 
                        parseInt(pointsInput.value) || 0,
                        notesInput.value || ''
                      );
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(submission.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {submission.status !== 'submitted' && submission.points_awarded !== null && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Points awarded:</span> {submission.points_awarded}
                {submission.reviewed_at && (
                  <span className="ml-4">
                    Reviewed on: {new Date(submission.reviewed_at).toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {submissions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">
              No {filter} submissions found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
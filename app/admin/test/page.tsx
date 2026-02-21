// Test Component - Add this to a new page to debug revenue
// Create this as app/admin/test/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminTest() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      try {
        setLoading(true);
        const results: any = {};

        // Test 1: Check if user is admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        results.userProfile = profile;
        results.userProfileError = profileError?.message;

        // Test 2: Direct query to payments table
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('*');

        results.totalPayments = payments?.length || 0;
        results.paymentsError = paymentsError?.message;
        results.samplePayments = payments?.slice(0, 3);

        // Test 3: Count completed payments
        const { count: completedCount, error: completedError } = await supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');

        results.completedPaymentsCount = completedCount;
        results.completedError = completedError?.message;

        // Test 4: Try to sum revenue directly
        const { data: completedPayments, error: sumError } = await supabase
          .from('payments')
          .select('amount, status, created_at')
          .eq('status', 'completed');

        const totalRevenue = completedPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        results.directTotalRevenue = totalRevenue;
        results.completedPaymentsList = completedPayments;

        // Test 5: Use the debug function
        const { data: debugData, error: debugError } = await supabase
          .rpc('debug_get_payment_info');

        results.debugFunction = debugData;
        results.debugError = debugError?.message;

        // Test 6: Use admin function
        const { data: adminStats, error: adminError } = await supabase
          .rpc('admin_get_dashboard_stats');

        results.adminStats = adminStats;
        results.adminError = adminError?.message;

        // Test 7: Try individual admin functions
        const { data: totalRevData, error: revError } = await supabase
          .rpc('admin_get_total_revenue');

        results.adminTotalRevenue = totalRevData;
        results.adminRevenueError = revError?.message;

        const { data: currentRevData, error: currentRevError } = await supabase
          .rpc('admin_get_current_month_revenue');

        results.adminCurrentRevenue = currentRevData;
        results.adminCurrentError = currentRevError?.message;

        setDebugInfo(results);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    runTests();
  }, []);

  if (loading) {
    return <div className="p-8">Loading tests...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <pre className="bg-red-50 p-4 rounded">{error}</pre>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Revenue Debug Test</h1>
      
      <div className="space-y-6">
        {/* User Info */}
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">1. User Profile</h2>
          <pre className="text-sm">{JSON.stringify(debugInfo?.userProfile, null, 2)}</pre>
          {debugInfo?.userProfileError && (
            <p className="text-red-600 mt-2">Error: {debugInfo.userProfileError}</p>
          )}
        </div>

        {/* Payments Count */}
        <div className="bg-green-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">2. Payments in Database</h2>
          <p><strong>Total Payments:</strong> {debugInfo?.totalPayments}</p>
          <p><strong>Completed Payments:</strong> {debugInfo?.completedPaymentsCount}</p>
          {debugInfo?.paymentsError && (
            <p className="text-red-600 mt-2">Error: {debugInfo.paymentsError}</p>
          )}
        </div>

        {/* Sample Payments */}
        <div className="bg-yellow-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">3. Sample Payments</h2>
          <pre className="text-sm overflow-auto">{JSON.stringify(debugInfo?.samplePayments, null, 2)}</pre>
        </div>

        {/* Direct Revenue Calculation */}
        <div className="bg-purple-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">4. Direct Revenue Calculation (Client-side)</h2>
          <p className="text-2xl font-bold">${debugInfo?.directTotalRevenue?.toFixed(2) || '0.00'}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm">View all completed payments</summary>
            <pre className="text-xs overflow-auto mt-2 max-h-96">
              {JSON.stringify(debugInfo?.completedPaymentsList, null, 2)}
            </pre>
          </details>
        </div>

        {/* Debug Function */}
        <div className="bg-pink-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">5. Debug Function Results</h2>
          <pre className="text-sm">{JSON.stringify(debugInfo?.debugFunction, null, 2)}</pre>
          {debugInfo?.debugError && (
            <p className="text-red-600 mt-2">Error: {debugInfo.debugError}</p>
          )}
        </div>

        {/* Admin Stats Function */}
        <div className="bg-indigo-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">6. Admin Stats Function</h2>
          <pre className="text-sm">{JSON.stringify(debugInfo?.adminStats, null, 2)}</pre>
          {debugInfo?.adminError && (
            <p className="text-red-600 mt-2">Error: {debugInfo.adminError}</p>
          )}
        </div>

        {/* Individual Admin Functions */}
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">7. Individual Admin Revenue Functions</h2>
          <p><strong>Total Revenue:</strong> ${debugInfo?.adminTotalRevenue || 0}</p>
          <p><strong>Current Month Revenue:</strong> ${debugInfo?.adminCurrentRevenue || 0}</p>
          {debugInfo?.adminRevenueError && (
            <p className="text-red-600 mt-2">Total Revenue Error: {debugInfo.adminRevenueError}</p>
          )}
          {debugInfo?.adminCurrentError && (
            <p className="text-red-600 mt-2">Current Revenue Error: {debugInfo.adminCurrentError}</p>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white border-2 border-gray-300 p-6 rounded">
          <h2 className="text-2xl font-bold mb-4">Summary</h2>
          <div className="space-y-2">
            <p><strong>Are you admin?</strong> {debugInfo?.userProfile?.role === 'admin' ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Can access payments table?</strong> {debugInfo?.totalPayments > 0 || debugInfo?.paymentsError ? 
              (debugInfo?.paymentsError ? '❌ No - RLS blocking' : '✅ Yes') : '⚠️ No data'}</p>
            <p><strong>Payments in database?</strong> {debugInfo?.totalPayments > 0 ? `✅ Yes (${debugInfo.totalPayments})` : '❌ No'}</p>
            <p><strong>Completed payments?</strong> {debugInfo?.completedPaymentsCount > 0 ? `✅ Yes (${debugInfo.completedPaymentsCount})` : '❌ No'}</p>
            <p><strong>Direct calculation works?</strong> {debugInfo?.directTotalRevenue > 0 ? `✅ Yes ($${debugInfo.directTotalRevenue.toFixed(2)})` : '❌ No'}</p>
            <p><strong>Admin functions work?</strong> {debugInfo?.adminTotalRevenue !== undefined && !debugInfo?.adminRevenueError ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
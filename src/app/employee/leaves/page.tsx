'use client';

import Layout from '@/app/components/Layout';
import Link from 'next/link';
import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Leave {
  _id: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  status: string;
}

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await api.get('/leaves/my-leaves');
        setLeaves(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching leaves');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  return (
    <Layout allowedRoles={['employee']}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Leaves</h1>
        <Link
          href="/employee/leaves/apply"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Apply for Leave
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaves.map((leave) => (
                <tr key={leave._id}>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">{leave.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(new Date(leave.startDate), 'MMM d, yyyy')} - {format(new Date(leave.endDate), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">{leave.reason}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
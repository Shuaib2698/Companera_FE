'use client';

import Layout from '@/app/components/Layout';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import StatusBadge from '@/app/components/StatusBadge';
import RequestModal from '@/app/components/RequestModal';
import Link from 'next/link';

interface Request {
  _id: string;
  projectName: string;
  amount: number;
  status: string;
  createdAt: string;
  requiredByDate: string;
  description?: string;
  department: string;
  purpose: string;
  documentUrl: string;
  employee?: { name: string };
}

export default function AdminPaymentRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selected, setSelected] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'my'>('all');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const endpoint =
        tab === 'all' ? '/payment-Request/all' : '/payment-Request/my-requests';
      const res = await api.get(endpoint);
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [tab]);

  const handleStatusChange = async (status: string) => {
    if (!selected) return;
    try {
      await api.patch(`/payment-Request/${selected._id}/status`, { status });
      setSelected(null);
      fetchRequests();
    } catch (err) {
      console.error('Status update failed', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this request?')) {
      try {
        await api.delete(`/payment-Request/${id}`);
        fetchRequests();
      } catch (err) {
        console.error('Delete failed', err);
      }
    }
  };

  return (
    <Layout allowedRoles={['admin']}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment Requests</h1>
        <Link
          href="/admin/payment-Request/create"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          New Request
        </Link>
      </div>

      {/* Sub-navigation tabs */}
      <div className="mb-6 flex space-x-4 border-b pb-2">
        <button
          className={`text-sm font-medium ${
            tab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
          }`}
          onClick={() => setTab('all')}
        >
          All Payment Requests
        </button>
        <button
          className={`text-sm font-medium ${
            tab === 'my' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
          }`}
          onClick={() => setTab('my')}
        >
          My Payment Requests
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                {tab === 'all' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((r) => (
                <tr key={r._id}>
                  <td className="px-6 py-4">{r.projectName}</td>
                  <td className="px-6 py-4">${r.amount.toFixed(2)}</td>
                  <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                  {tab === 'all' && (
                    <td className="px-6 py-4">{r.employee?.name || 'N/A'}</td>
                  )}
                  <td className="px-6 py-4">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => setSelected(r)}
                      className="text-blue-600 hover:underline"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <RequestModal
          request={selected}
          onClose={() => setSelected(null)}
          onStatusChange={tab === 'all' ? handleStatusChange : undefined}
          isAdmin={tab === 'all'}
        />
      )}
    </Layout>
  );
}

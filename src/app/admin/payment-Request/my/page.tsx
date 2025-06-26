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
}

export default function AdminMyRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selected, setSelected] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/payment-Request/my-requests');
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <Layout allowedRoles={['admin']}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Submitted Requests</h1>
        <Link
          href="/admin/payment-Request/create"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          New Request
        </Link>
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
                  <td className="px-6 py-4">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelected(r)}
                      className="text-blue-600 hover:underline"
                    >
                      View Details
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
          isAdmin={false} // Admin can't act on their own requests
        />
      )}
    </Layout>
  );
}

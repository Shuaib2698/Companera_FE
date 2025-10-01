// app/admin/Request/page.tsx
'use client';

import Layout from '@/app/components/Layout';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import StatusBadge from '@/app/components/StatusBadge';
import RequestModal from '@/app/components/RequestModal';
import RequestTypeModal from '@/app/components/RequestTypeModal';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PaymentRequest {
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
  type: 'payment';
}

interface TripRequest {
  _id: string;
  tripPurpose: string;
  destination: string;
  startDate: string;
  endDate: string;
  estimatedCost: number;
  status: string;
  createdAt: string;
  description?: string;
  employee?: { name: string };
  type: 'trip';
}

interface AssetRequest {
  _id: string;
  requestType: string;
  assetType: string;
  preferredModel?: string;
  quantity: number;
  purpose: string;
  estimatedCost?: number;
  status: string;
  createdAt: string;
  employee?: { name: string };
  type: 'asset';
}

type Request = PaymentRequest | TripRequest | AssetRequest;

export default function AdminRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selected, setSelected] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'payment' | 'trip' | 'asset'>('payment');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const pathname = usePathname();

  // Determine if we're on "My Requests" page
  const isMyRequestsPage = pathname.includes('/my');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      let response;
      
      if (isMyRequestsPage) {
        // Fetch admin's own requests
        switch (tab) {
          case 'payment':
            response = await api.get('/payment-Request/my-requests');
            break;
          case 'trip':
            response = await api.get('/trip-requests/my-requests');
            break;
          case 'asset':
            response = await api.get('/asset-requests/my-requests');
            break;
        }
      } else {
        // Fetch all requests (incoming)
        switch (tab) {
          case 'payment':
            response = await api.get('/payment-Request/all');
            break;
          case 'trip':
            response = await api.get('/trip-requests/all');
            break;
          case 'asset':
            response = await api.get('/asset-requests/all');
            break;
        }
      }
      
      const requestsWithType = response.data.map((request: any) => ({
        ...request,
        type: tab
      }));
      setRequests(requestsWithType);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [tab, isMyRequestsPage]);

  const handleStatusChange = async (status: string) => {
    if (!selected) return;
    try {
      let endpoint = '';
      switch (selected.type) {
        case 'payment':
          endpoint = `/payment-Request/${selected._id}/status`;
          break;
        case 'trip':
          endpoint = `/trip-requests/${selected._id}/status`;
          break;
        case 'asset':
          endpoint = `/asset-requests/${selected._id}/status`;
          break;
      }
      
      await api.patch(endpoint, { status });
      setSelected(null);
      fetchRequests();
    } catch (err) {
      console.error('Status update failed', err);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (confirm('Are you sure you want to delete this request?')) {
      try {
        let endpoint = '';
        switch (type) {
          case 'payment':
            endpoint = `/payment-Request/${id}`;
            break;
          case 'trip':
            endpoint = `/trip-requests/${id}`;
            break;
          case 'asset':
            endpoint = `/asset-requests/${id}`;
            break;
        }
        
        await api.delete(endpoint);
        fetchRequests();
      } catch (err) {
        console.error('Delete failed', err);
      }
    }
  };

  const getRequestDisplayData = (request: Request) => {
    switch (request.type) {
      case 'payment':
        return {
          title: request.projectName,
          amount: `$${request.amount.toFixed(2)}`,
          details: request.purpose,
          employee: request.employee?.name || 'N/A'
        };
      case 'trip':
        return {
          title: request.tripPurpose,
          amount: `$${request.estimatedCost.toFixed(2)}`,
          details: request.destination,
          employee: request.employee?.name || 'N/A'
        };
      case 'asset':
        return {
          title: request.assetType,
          amount: request.estimatedCost ? `$${request.estimatedCost.toFixed(2)}` : 'N/A',
          details: request.requestType,
          employee: request.employee?.name || 'N/A'
        };
      default:
        return { title: '', amount: '', details: '', employee: 'N/A' };
    }
  };

  return (
    <Layout allowedRoles={['admin']}>
      {/* Main Navigation Bar */}
      <div className="mb-6">
        <div className="flex space-x-8 border-b">
          <Link
            href="/admin/Request"
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              !isMyRequestsPage
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Incoming Requests
          </Link>
          <Link
            href="/admin/Request/my"
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              isMyRequestsPage
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Requests
          </Link>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isMyRequestsPage ? 'My Submitted Requests' : 'All Requests'}
        </h1>
        <button
          onClick={() => setShowTypeModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          New Request
        </button>
      </div>

      {/* Sub-navigation tabs - ALWAYS VISIBLE */}
      <div className="mb-6 flex space-x-4 border-b pb-2">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t ${
            tab === 'payment' 
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setTab('payment')}
        >
          Payment Requests
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t ${
            tab === 'trip' 
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setTab('trip')}
        >
          Trip Requests
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t ${
            tab === 'asset' 
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setTab('asset')}
        >
          Asset Requests
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-64">
          <div className="text-lg">Loading...</div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {tab === 'payment' ? 'Project' : tab === 'trip' ? 'Purpose' : 'Asset Type'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                {!isMyRequestsPage && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => {
                const displayData = getRequestDisplayData(request);
                return (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{displayData.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{displayData.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={request.status} />
                    </td>
                    {!isMyRequestsPage && (
                      <td className="px-6 py-4 whitespace-nowrap">{displayData.employee}</td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">{displayData.details}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => setSelected(request)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        View
                      </button>
                      {isMyRequestsPage && (
                        <button
                          onClick={() => handleDelete(request._id, request.type)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {requests.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No {tab} requests found</div>
              <div className="text-sm text-gray-400">
                {isMyRequestsPage 
                  ? `You haven't submitted any ${tab} requests yet.`
                  : `No ${tab} requests have been submitted yet.`
                }
              </div>
            </div>
          )}
        </div>
      )}

      {selected && (
        <RequestModal
          request={selected}
          onClose={() => setSelected(null)}
          onStatusChange={isMyRequestsPage ? undefined : handleStatusChange}
          isAdmin={!isMyRequestsPage}
        />
      )}

      <RequestTypeModal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        userRole="admin"
      />
    </Layout>
  );
}
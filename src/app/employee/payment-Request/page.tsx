// app/employee/requests/page.tsx
'use client';

import Layout from '@/app/components/Layout';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import StatusBadge from '@/app/components/StatusBadge';
import RequestModal from '@/app/components/RequestModal';
import RequestTypeModal from '@/app/components/RequestTypeModal';
import Link from 'next/link';

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
  type: 'asset';
}

type Request = PaymentRequest | TripRequest | AssetRequest;

export default function EmployeeRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selected, setSelected] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'payment' | 'trip' | 'asset'>('payment');
  const [showTypeModal, setShowTypeModal] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      switch (tab) {
        case 'payment':
          endpoint = '/payment-Request/my-requests';
          break;
        case 'trip':
          endpoint = '/trip-Request/my-requests';
          break;
        case 'asset':
          endpoint = '/asset-Request/my-requests';
          break;
      }
      
      const res = await api.get(endpoint);
      const requestsWithType = res.data.map((request: any) => ({
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
  }, [tab]);

  const getRequestDisplayData = (request: Request) => {
    switch (request.type) {
      case 'payment':
        return {
          title: request.projectName,
          amount: `$${request.amount.toFixed(2)}`,
          details: request.purpose
        };
      case 'trip':
        return {
          title: request.tripPurpose,
          amount: `$${request.estimatedCost.toFixed(2)}`,
          details: request.destination
        };
      case 'asset':
        return {
          title: request.assetType,
          amount: request.estimatedCost ? `$${request.estimatedCost.toFixed(2)}` : 'N/A',
          details: request.requestType
        };
      default:
        return { title: '', amount: '', details: '' };
    }
  };

  return (
    <Layout allowedRoles={['employee']}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Requests</h1>
        <button
          onClick={() => setShowTypeModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          New Request
        </button>
      </div>

      {/* Sub-navigation tabs */}
      <div className="mb-6 flex space-x-4 border-b pb-2">
        <button
          className={`text-sm font-medium ${
            tab === 'payment' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
          }`}
          onClick={() => setTab('payment')}
        >
          Payment Requests
        </button>
        <button
          className={`text-sm font-medium ${
            tab === 'trip' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
          }`}
          onClick={() => setTab('trip')}
        >
          Trip Requests
        </button>
        <button
          className={`text-sm font-medium ${
            tab === 'asset' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
          }`}
          onClick={() => setTab('asset')}
        >
          Asset Requests
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => {
                const displayData = getRequestDisplayData(request);
                return (
                  <tr key={request._id}>
                    <td className="px-6 py-4">{displayData.title}</td>
                    <td className="px-6 py-4">{displayData.amount}</td>
                    <td className="px-6 py-4"><StatusBadge status={request.status} /></td>
                    <td className="px-6 py-4">{new Date(request.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{displayData.details}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelected(request)}
                        className="text-blue-600 hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <RequestModal
          request={selected}
          onClose={() => setSelected(null)}
          isAdmin={false}
        />
      )}

      <RequestTypeModal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        userRole="employee"
      />
    </Layout>
  );
}
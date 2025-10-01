'use client';

import Layout from '@/app/components/Layout';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface RequestItem {
  _id: string;
  projectName?: string;
  purpose: string;
  amount?: number;
  estimatedCost?: number;
  status: string;
  createdAt: string;
  requestType?: string;
  assetType?: string;
  tripPurpose?: string;
  destination?: string;
  type: 'payment' | 'asset' | 'trip';
  requiredByDate?: string;
  startDate?: string;
  endDate?: string;
}

type RequestType = 'all' | 'payment' | 'asset' | 'trip';

export default function RequestDashboard() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<RequestType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(req => req.type === activeTab));
    }
  }, [activeTab, requests]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [paymentRes, assetRes, tripRes] = await Promise.all([
        api.get('/payment-Request/my-requests'),
        api.get('/asset-requests/my-requests'),
        api.get('/trip-requests/my-requests')
      ]);

      const paymentRequests = paymentRes.data.map((req: any) => ({
        ...req,
        type: 'payment' as const
      }));

      const assetRequests = assetRes.data.map((req: any) => ({
        ...req,
        type: 'asset' as const
      }));

      const tripRequests = tripRes.data.map((req: any) => ({
        ...req,
        type: 'trip' as const
      }));

      const allRequests = [...paymentRequests, ...assetRequests, ...tripRequests]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setRequests(allRequests);
      setFilteredRequests(allRequests);
    } catch (err: any) {
      setError('Failed to fetch requests');
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'hold': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'payment': return 'Payment Request';
      case 'asset': return 'Asset Request';
      case 'trip': return 'Trip Request';
      default: return type;
    }
  };

  const getRequestDetails = (request: RequestItem) => {
    switch (request.type) {
      case 'payment':
        return {
          title: request.projectName,
          subtitle: request.purpose,
          amount: request.amount,
          date: request.requiredByDate
        };
      case 'asset':
        return {
          title: `${request.requestType} - ${request.assetType}`,
          subtitle: request.purpose,
          amount: request.estimatedCost,
          date: request.createdAt
        };
      case 'trip':
        return {
          title: `${request.tripPurpose} - ${request.destination}`,
          subtitle: request.purpose,
          amount: request.estimatedCost,
          date: request.startDate
        };
      default:
        return {
          title: 'Unknown Request',
          subtitle: '',
          amount: 0,
          date: request.createdAt
        };
    }
  };

  // Update the handleCreateRequest function in your RequestDashboard
const handleCreateRequest = (type: 'payment' | 'asset' | 'trip') => {
  setIsModalOpen(false);
  switch (type) {
    case 'payment':
      router.push('/employee/Request/payment-request');
      break;
    case 'asset':
      router.push('/employee/Request/asset-request');
      break;
    case 'trip':
      router.push('/employee/Request/trip-request');
      break;
  }
};

  if (loading) {
    return (
      <Layout allowedRoles={['employee']}>
        <div className="flex justify-center items-center min-h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout allowedRoles={['employee']}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Requests</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <span>+</span>
            <span>New Request</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Sub Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'all' as RequestType, name: 'All Requests' },
                { id: 'payment' as RequestType, name: 'Payment Requests' },
                { id: 'asset' as RequestType, name: 'Asset Requests' },
                { id: 'trip' as RequestType, name: 'Trip Requests' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount/Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => {
                const details = getRequestDetails(request);
                return (
                  <tr key={`${request.type}-${request._id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {getTypeLabel(request.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {details.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {details.subtitle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${details.amount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {details.date ? new Date(details.date).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No requests found</div>
              <div className="text-sm text-gray-400 mb-4">
                {activeTab === 'all' 
                  ? "You haven't created any requests yet."
                  : `You haven't created any ${activeTab} requests yet.`
                }
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Your First Request
              </button>
            </div>
          )}
        </div>

        {/* Request Type Modal */}
{isModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
      <h2 className="text-xl font-bold mb-4">Select Request Type</h2>
      <p className="text-gray-600 mb-6">Choose the type of request you want to create</p>
      
      <div className="space-y-3">
        <button
          onClick={() => handleCreateRequest('payment')}
          className="w-full p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors hover:border-blue-500"
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">💰</span>
            <div>
              <h3 className="font-semibold">Payment Request</h3>
              <p className="text-sm text-gray-600">Request for payments, advances, reimbursements</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleCreateRequest('asset')}
          className="w-full p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors hover:border-blue-500"
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">💻</span>
            <div>
              <h3 className="font-semibold">Asset Request</h3>
              <p className="text-sm text-gray-600">Request for assets, repairs, or equipment</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleCreateRequest('trip')}
          className="w-full p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors hover:border-blue-500"
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">✈️</span>
            <div>
              <h3 className="font-semibold">Trip Request</h3>
              <p className="text-sm text-gray-600">Request for business trips and travel</p>
            </div>
          </div>
        </button>
      </div>
      
      <button
        onClick={() => setIsModalOpen(false)}
        className="w-full mt-4 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Cancel
      </button>
    </div>
  </div>
)}
      </div>
    </Layout>
  );
}
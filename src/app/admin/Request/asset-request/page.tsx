// app/admin/Request/asset-request/page.tsx
'use client';

import Layout from '@/app/components/Layout';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';

export default function CreateAssetRequest() {
  const [form, setForm] = useState({
    requestType: 'Asset Request',
    assetType: 'Laptop',
    preferredModel: '',
    quantity: '1',
    purpose: '',
    estimatedCost: '',
    urgency: 'medium',
    description: '',
    documentUrl: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/asset-requests', {
        ...form,
        quantity: parseInt(form.quantity),
        estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined
      });
      router.push('/admin/Request');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create asset request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout allowedRoles={['admin']}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create Asset Request</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={form.requestType}
                onChange={(e) => setForm({...form, requestType: e.target.value})}
              >
                <option value="Asset Request">Asset Request</option>
                <option value="Asset Repair Request">Asset Repair Request</option>
                <option value="Asset Reimbursement Request">Asset Reimbursement Request</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={form.assetType}
                onChange={(e) => setForm({...form, assetType: e.target.value})}
              >
                <option value="Laptop">Laptop</option>
                <option value="Monitor">Monitor</option>
                <option value="Software License">Software License</option>
                <option value="Development Tools">Development Tools</option>
                <option value="Hardware Accessories">Hardware Accessories</option>
                <option value="Cloud Resources">Cloud Resources</option>
                <option value="Testing Devices">Testing Devices</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Model</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={form.preferredModel}
                onChange={(e) => setForm({...form, preferredModel: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={form.quantity}
                onChange={(e) => setForm({...form, quantity: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={form.purpose}
                onChange={(e) => setForm({...form, purpose: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={form.estimatedCost}
                onChange={(e) => setForm({...form, estimatedCost: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={form.urgency}
                onChange={(e) => setForm({...form, urgency: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document URL</label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={form.documentUrl}
                onChange={(e) => setForm({...form, documentUrl: e.target.value})}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/admin/Request')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
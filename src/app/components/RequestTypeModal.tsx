// components/RequestTypeModal.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RequestTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'admin' | 'employee';
}

export default function RequestTypeModal({ isOpen, onClose, userRole }: RequestTypeModalProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('');

  const requestTypes = [
    {
      id: 'payment',
      name: 'Payment Request',
      description: 'Request for payments like salary advance, project advance, etc.',
      icon: '💰',
      path: userRole === 'admin' ? '/admin/Request/payment-request' : '/employee/Request/payment-request'
    },
    {
      id: 'trip',
      name: 'Trip Request',
      description: 'Request for business trips and travel arrangements',
      icon: '✈️',
      path: userRole === 'admin' ? '/admin/Request/trip-request' : '/employee/Request/trip-request'
    },
    {
      id: 'asset',
      name: 'Asset Request',
      description: 'Request for assets, repairs, or reimbursements',
      icon: '💻',
      path: userRole === 'admin' ? '/admin/Request/asset-request' : '/employee/Request/asset-request'
    }
  ];

  const handleSelect = (type: typeof requestTypes[0]) => {
    setSelectedType(type.id);
    setTimeout(() => {
      router.push(type.path);
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Select Request Type</h2>
        <p className="text-gray-600 mb-6">Choose the type of request you want to create</p>
        
        <div className="space-y-3">
          {requestTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleSelect(type)}
              className={`w-full p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors ${
                selectedType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{type.icon}</span>
                <div>
                  <h3 className="font-semibold">{type.name}</h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
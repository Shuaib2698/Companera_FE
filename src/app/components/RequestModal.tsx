// components/RequestModal.tsx
'use client';
import StatusBadge from './StatusBadge';

interface Props {
  request: any;
  onClose: () => void;
  onStatusChange?: (status: string) => void;
  isAdmin?: boolean;
}

export default function RequestModal({ request, onClose, onStatusChange, isAdmin }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-6 w-full max-w-xl relative">
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-500 hover:text-gray-800">
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4">Payment Request Details</h2>

        <div className="space-y-3 text-sm">
          <div><strong>Project:</strong> {request.projectName}</div>
          <div><strong>Department:</strong> {request.department}</div>
          <div><strong>Purpose:</strong> {request.purpose}</div>
          <div><strong>Amount:</strong> ${request.amount.toFixed(2)}</div>
          <div><strong>Required By:</strong> {new Date(request.requiredByDate).toLocaleDateString()}</div>
          <div><strong>Status:</strong> <StatusBadge status={request.status} /></div>
          <div><strong>Document:</strong> <a href={request.documentUrl} className="text-blue-600 underline" target="_blank">View</a></div>
          <div><strong>Description:</strong> {request.description || '—'}</div>
        </div>

        {isAdmin && (
          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={() => onStatusChange?.('approved')} className="bg-green-600 text-white px-4 py-2 rounded">Approve</button>
            <button onClick={() => onStatusChange?.('rejected')} className="bg-red-600 text-white px-4 py-2 rounded">Reject</button>
            <button onClick={() => onStatusChange?.('hold')} className="bg-yellow-500 text-white px-4 py-2 rounded">Hold</button>
          </div>
        )}
      </div>
    </div>
  );
}

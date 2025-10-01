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
  // Helper function to get request type display name
  const getRequestType = () => {
    switch (request.type) {
      case 'payment': return 'Payment Request';
      case 'trip': return 'Trip Request';
      case 'asset': return 'Asset Request';
      default: return 'Request';
    }
  };

  // Helper function to get amount/cost based on request type
  const getAmount = () => {
    switch (request.type) {
      case 'payment': 
        return request.amount ? `$${request.amount.toFixed(2)}` : 'N/A';
      case 'trip':
        return request.estimatedCost ? `$${request.estimatedCost.toFixed(2)}` : 'N/A';
      case 'asset':
        return request.estimatedCost ? `$${request.estimatedCost.toFixed(2)}` : 'N/A';
      default:
        return 'N/A';
    }
  };

  // Helper function to get date based on request type
  const getDate = () => {
    switch (request.type) {
      case 'payment':
        return request.requiredByDate ? new Date(request.requiredByDate).toLocaleDateString() : 'N/A';
      case 'trip':
        return request.startDate ? new Date(request.startDate).toLocaleDateString() : 'N/A';
      case 'asset':
        return request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A';
      default:
        return 'N/A';
    }
  };

  // Helper function to get date label based on request type
  const getDateLabel = () => {
    switch (request.type) {
      case 'payment': return 'Required By';
      case 'trip': return 'Start Date';
      case 'asset': return 'Created Date';
      default: return 'Date';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl"
        >
          ✕
        </button>
        
        <h2 className="text-xl font-bold mb-4">{getRequestType()} Details</h2>

        <div className="space-y-4">
          {/* Common Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><strong>Status:</strong> <StatusBadge status={request.status} /></div>
            <div><strong>Date:</strong> {getDate()}</div>
          </div>

          {/* Payment Request Specific Fields */}
          {request.type === 'payment' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><strong>Project:</strong> {request.projectName || 'N/A'}</div>
                <div><strong>Department:</strong> {request.department || 'N/A'}</div>
              </div>
              <div><strong>Purpose:</strong> {request.purpose || 'N/A'}</div>
              <div><strong>Amount:</strong> {getAmount()}</div>
              <div><strong>Required By:</strong> {getDate()}</div>
            </>
          )}

          {/* Trip Request Specific Fields */}
          {request.type === 'trip' && (
  <>
    {/* ... existing trip fields ... */}
    {(request.country || request.zipCode) && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><strong>Country:</strong> {request.country || 'N/A'}</div>
        <div><strong>Zip Code:</strong> {request.zipCode || 'N/A'}</div>
      </div>
    )}
  </>
)}

          {/* Asset Request Specific Fields */}
          {request.type === 'asset' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><strong>Request Type:</strong> {request.requestType || 'N/A'}</div>
                <div><strong>Asset Type:</strong> {request.assetType || 'N/A'}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><strong>Preferred Model:</strong> {request.preferredModel || 'N/A'}</div>
                <div><strong>Quantity:</strong> {request.quantity || '1'}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><strong>Urgency:</strong> {request.urgency ? request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1) : 'N/A'}</div>
                <div><strong>Estimated Cost:</strong> {getAmount()}</div>
              </div>
              <div><strong>Purpose:</strong> {request.purpose || 'N/A'}</div>
              {(request.country || request.zipCode) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><strong>Country:</strong> {request.country || 'N/A'}</div>
                  <div><strong>Zip Code:</strong> {request.zipCode || 'N/A'}</div>
                </div>
              )}
            </>
          )}

          {/* Common Fields for all request types */}
          <div>
            <strong>Description:</strong> 
            <div className="mt-1 p-3 bg-gray-50 rounded border">{request.description || 'No description provided'}</div>
          </div>

          {request.documentUrl && (
            <div>
              <strong>Document:</strong>{' '}
              <a 
                href={request.documentUrl} 
                className="text-blue-600 underline hover:text-blue-800" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View Document
              </a>
            </div>
          )}

          {/* Employee information for admin */}
          {isAdmin && request.employee && (
            <div className="border-t pt-4 mt-4">
              <strong>Submitted By:</strong> {request.employee.name || 'N/A'}
            </div>
          )}
        </div>

        {isAdmin && onStatusChange && (
          <div className="mt-6 pt-4 border-t flex flex-wrap gap-2 justify-end">
            <button 
              onClick={() => onStatusChange('approved')} 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
            <button 
              onClick={() => onStatusChange('rejected')} 
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
            <button 
              onClick={() => onStatusChange('hold')} 
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
            >
              Hold
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
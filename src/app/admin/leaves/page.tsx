// app/admin/leaves/page.tsx
"use client";
import Layout from "@/app/components/Layout";
import api from "@/lib/api";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import Modal from "@/app/components/Modal";

interface Leave {
  _id: string;
  employee: { name: string; email: string; department: string };
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  status: string;
  approvedBy?: { name: string };
  rejectionReason?: string;
}

interface WFH {
  _id: string;
  employee: { name: string; email: string; department: string };
  date: string;
  reason: string;
  status: string;
  approvedBy?: { name: string };
  rejectionReason?: string;
}

export default function AdminLeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [wfhRequests, setWfhRequests] = useState<WFH[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"leaves" | "wfh" | "incoming">("incoming");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectForm, setRejectForm] = useState({
    id: "",
    type: "",
    reason: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [leavesRes, wfhRes] = await Promise.all([
          api.get("/leaves"),
          api.get("/wfh"),
        ]);

        setLeaves(leavesRes.data);
        setWfhRequests(wfhRes.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApprove = async (id: string, type: 'leave' | 'wfh') => {
    try {
      if (type === 'leave') {
        const res = await api.put(`/leaves/${id}/status`, { status: 'approved' });
        setLeaves(leaves.map(l => l._id === id ? res.data : l));
      } else {
        const res = await api.put(`/wfh/${id}/status`, { status: 'approved' });
        setWfhRequests(wfhRequests.map(w => w._id === id ? res.data : w));
      }
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error approving request");
    }
  };

  const openRejectModal = (id: string, type: 'leave' | 'wfh') => {
    setRejectForm({ id, type, reason: "" });
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    try {
      if (rejectForm.type === 'leave') {
        const res = await api.put(`/leaves/${rejectForm.id}/status`, { 
          status: 'rejected',
          rejectionReason: rejectForm.reason
        });
        setLeaves(leaves.map(l => l._id === rejectForm.id ? res.data : l));
      } else {
        const res = await api.put(`/wfh/${rejectForm.id}/status`, { 
          status: 'rejected',
          rejectionReason: rejectForm.reason
        });
        setWfhRequests(wfhRequests.map(w => w._id === rejectForm.id ? res.data : w));
      }
      setShowRejectModal(false);
      setRejectForm({ id: "", type: "", reason: "" });
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error rejecting request");
    }
  };

  if (loading) {
    return (
      <Layout allowedRoles={["admin"]}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-800">Admin - Leave & WFH Management</h1>
            <p className="text-gray-600 mt-1">Manage employee time off and remote work requests</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                className={`px-6 py-4 font-medium text-sm transition-all duration-300 ${activeTab === 'incoming' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('incoming')}
              >
                Incoming Requests
              </button>
              <button
                className={`px-6 py-4 font-medium text-sm transition-all duration-300 ${activeTab === 'leaves' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('leaves')}
              >
                All Leaves
              </button>
              <button
                className={`px-6 py-4 font-medium text-sm transition-all duration-300 ${activeTab === 'wfh' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('wfh')}
              >
                All WFH
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'incoming' && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">Pending Requests</h3>
                  
                  {/* Pending Leaves */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-gray-700 mb-4">Leave Requests</h4>
                    {leaves.filter(l => l.status === 'pending').length === 0 ? (
                      <p className="text-gray-500">No pending leave requests</p>
                    ) : (
                      <div className="space-y-4">
                        {leaves.filter(l => l.status === 'pending').map(leave => (
                          <div key={leave._id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <p className="font-medium text-gray-800 capitalize">{leave.type} Leave</p>
                                <p className="text-sm text-gray-500">
                                  Employee: {leave.employee.name} ({leave.employee.department})
                                </p>
                                <p className="text-sm text-gray-500">
                                  {format(new Date(leave.startDate), 'MMM d, yyyy')} - {format(new Date(leave.endDate), 'MMM d, yyyy')}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">{leave.reason}</p>
                              </div>
                              <span className="px-3 py-1 text-xs rounded-full font-medium bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApprove(leave._id, 'leave')}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openRejectModal(leave._id, 'leave')}
                                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Pending WFH */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-700 mb-4">WFH Requests</h4>
                    {wfhRequests.filter(w => w.status === 'pending').length === 0 ? (
                      <p className="text-gray-500">No pending WFH requests</p>
                    ) : (
                      <div className="space-y-4">
                        {wfhRequests.filter(w => w.status === 'pending').map(wfh => (
                          <div key={wfh._id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <p className="font-medium text-gray-800">Work From Home</p>
                                <p className="text-sm text-gray-500">
                                  Employee: {wfh.employee.name} ({wfh.employee.department})
                                </p>
                                <p className="text-sm text-gray-500">
                                  {format(new Date(wfh.date), 'EEEE, MMMM d, yyyy')}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">{wfh.reason}</p>
                              </div>
                              <span className="px-3 py-1 text-xs rounded-full font-medium bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApprove(wfh._id, 'wfh')}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openRejectModal(wfh._id, 'wfh')}
                                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'leaves' && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">All Leave Requests</h3>
                  
                  {leaves.length === 0 ? (
                    <p className="text-gray-500">No leave requests found</p>
                  ) : (
                    <div className="space-y-4">
                      {leaves.map(leave => (
                        <div key={leave._id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-medium text-gray-800 capitalize">{leave.type} Leave</p>
                              <p className="text-sm text-gray-500">
                                Employee: {leave.employee.name} ({leave.employee.department})
                              </p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(leave.startDate), 'MMM d, yyyy')} - {format(new Date(leave.endDate), 'MMM d, yyyy')}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">{leave.reason}</p>
                              {leave.rejectionReason && (
                                <p className="text-sm text-red-600 mt-1">Rejection Reason: {leave.rejectionReason}</p>
                              )}
                            </div>
                            <span className={`px-3 py-1 text-xs rounded-full font-medium ${leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                                leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                              }`}>
                              {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'wfh' && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">All WFH Requests</h3>
                  
                  {wfhRequests.length === 0 ? (
                    <p className="text-gray-500">No WFH requests found</p>
                  ) : (
                    <div className="space-y-4">
                      {wfhRequests.map(wfh => (
                        <div key={wfh._id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-medium text-gray-800">Work From Home</p>
                              <p className="text-sm text-gray-500">
                                Employee: {wfh.employee.name} ({wfh.employee.department})
                              </p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(wfh.date), 'EEEE, MMMM d, yyyy')}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">{wfh.reason}</p>
                              {wfh.rejectionReason && (
                                <p className="text-sm text-red-600 mt-1">Rejection Reason: {wfh.rejectionReason}</p>
                              )}
                            </div>
                            <span className={`px-3 py-1 text-xs rounded-full font-medium ${wfh.status === 'approved' ? 'bg-green-100 text-green-800' :
                                wfh.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                              }`}>
                              {wfh.status.charAt(0).toUpperCase() + wfh.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Request"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Rejection</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
              rows={4}
              value={rejectForm.reason}
              onChange={(e) => setRejectForm({ ...rejectForm, reason: e.target.value })}
              placeholder="Please provide a reason for rejection..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowRejectModal(false)}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Reject Request
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
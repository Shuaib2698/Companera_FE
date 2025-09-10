// app/employee/leaves/page.tsx
"use client";
import Layout from "@/app/components/Layout";
import Link from "next/link";
import api from "@/lib/api";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import Modal from "@/app/components/Modal";

interface Leave {
  _id: string;
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
  date: string;
  reason: string;
  status: string;
  approvedBy?: { name: string };
  rejectionReason?: string;
}

interface User {
  name: string;
  position: string;
  profilePicture?: string;
  leaveBalances?: {
    casual: number;
    sick: number;
    earned: number;
    bereavement: number;
    compOff: number;
    unpaid: number;
    paternity: number;
    maternity: number;
    wfh: number;
  };
}

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [wfhRequests, setWfhRequests] = useState<WFH[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"leaves" | "wfh">("leaves");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showWFHModal, setShowWFHModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    startDate: "",
    endDate: "",
    type: "casual",
    reason: "",
  });
  const [wfhForm, setWfhForm] = useState({
    date: "",
    reason: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [leavesRes, wfhRes] = await Promise.all([
          api.get("/leaves/my-leaves"),
          api.get("/wfh/my-wfh"),
        ]);

        setLeaves(leavesRes.data);
        setWfhRequests(wfhRes.data);
        
        // Set default user data since /users/me endpoint doesn't exist
        setUser({
          name: "Employee User",
          position: "Employee",
          leaveBalances: {
            casual: 7,
            sick: 7,
            earned: 15,
            bereavement: 3,
            compOff: 0,
            unpaid: 0,
            paternity: 1,
            maternity: 0,
            wfh: 7
          }
        });
      } catch (err: any) {
        setError(err.response?.data?.message || "Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLeaveSubmit = async () => {
    try {
      const res = await api.post("/leaves", leaveForm);
      setLeaves([res.data, ...leaves]);
      setShowLeaveModal(false);
      setLeaveForm({ startDate: "", endDate: "", type: "casual", reason: "" });
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error applying for leave");
    }
  };

  const handleWFHSubmit = async () => {
    try {
      const res = await api.post("/wfh", wfhForm);
      setWfhRequests([res.data, ...wfhRequests]);
      setShowWFHModal(false);
      setWfhForm({ date: "", reason: "" });
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error applying for WFH");
    }
  };

  if (loading) {
    return (
      <Layout allowedRoles={["employee", "admin"]}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout allowedRoles={["employee", "admin"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-800">Leave & WFH Management</h1>
            <p className="text-gray-600 mt-1">Manage your time off and remote work requests</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* User Profile Section */}
          <div className="flex items-center space-x-4 bg-white p-6 rounded-2xl shadow-lg">
            <div className="w-16 h-16 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-blue-600">
                  {user?.name?.charAt(0) || "U"}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{user?.name || "User"}</h2>
              <p className="text-gray-600">{user?.position || "Employee"}</p>
            </div>
          </div>

          {/* Leave Balances */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Leave & WFH Balances</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { key: "casual", label: "Casual Leave", color: "blue" },
                { key: "sick", label: "Sick Leave", color: "green" },
                { key: "earned", label: "Earned Leave", color: "purple" },
                { key: "bereavement", label: "Bereavement", color: "gray" },
                { key: "compOff", label: "Comp Off", color: "orange" },
                { key: "unpaid", label: "Unpaid Leave", color: "red" },
                { key: "paternity", label: "Paternity", color: "blue" },
                { key: "maternity", label: "Maternity", color: "pink" },
                { key: "wfh", label: "WFH", color: "indigo" }
              ].map((item) => (
                <div key={item.key} className={`bg-gradient-to-br from-${item.color}-50 to-${item.color}-100 p-4 rounded-xl border border-${item.color}-200`}>
                  <h3 className="font-medium text-gray-800">{item.label}</h3>
                  <p className="text-sm text-gray-600">Available: {user?.leaveBalances?.[item.key as keyof typeof user.leaveBalances] ?? 0}</p>
                  <p className="text-sm text-gray-600">
                    Used: {
                      item.key === "wfh" 
                        ? wfhRequests.filter(w => w.status === 'approved').length
                        : leaves.filter(l => l.type === item.key && l.status === 'approved').length
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                className={`px-6 py-4 font-medium text-sm transition-all duration-300 ${activeTab === 'leaves' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('leaves')}
              >
                My Leaves
              </button>
              <button
                className={`px-6 py-4 font-medium text-sm transition-all duration-300 ${activeTab === 'wfh' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('wfh')}
              >
                WFH Requests
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'leaves' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">My Leave Requests</h3>
                    <button
                      onClick={() => setShowLeaveModal(true)}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Apply for Leave
                    </button>
                  </div>

                  {leaves.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-500">No leave requests found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {leaves.map(leave => (
                        <div key={leave._id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-medium text-gray-800 capitalize">{leave.type} Leave</p>
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
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">WFH Requests</h3>
                    <button
                      onClick={() => setShowWFHModal(true)}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      Apply for WFH
                    </button>
                  </div>

                  {wfhRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <p className="text-gray-500">No WFH requests found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {wfhRequests.map(wfh => (
                        <div key={wfh._id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-medium text-gray-800">Work From Home</p>
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

      {/* Leave Application Modal */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Apply for Leave"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
              value={leaveForm.type}
              onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="earned">Earned Leave</option>
              <option value="bereavement">Bereavement Leave</option>
              <option value="compOff">Comp Off</option>
              <option value="unpaid">Unpaid Leave</option>
              <option value="paternity">Paternity Leave</option>
              <option value="maternity">Maternity Leave</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
              rows={4}
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              placeholder="Please provide a reason for your leave..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowLeaveModal(false)}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleLeaveSubmit}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Submit Leave Request
            </button>
          </div>
        </div>
      </Modal>

      {/* WFH Application Modal */}
      <Modal
        isOpen={showWFHModal}
        onClose={() => setShowWFHModal(false)}
        title="Apply for Work From Home"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
              value={wfhForm.date}
              onChange={(e) => setWfhForm({ ...wfhForm, date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
              rows={4}
              value={wfhForm.reason}
              onChange={(e) => setWfhForm({ ...wfhForm, reason: e.target.value })}
              placeholder="Please provide a reason for working from home..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowWFHModal(false)}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleWFHSubmit}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Submit WFH Request
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
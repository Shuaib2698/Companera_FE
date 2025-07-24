'use client';
import Layout from '@/app/components/Layout';
import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import Modal from '@/app/components/Modal';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  isImportant: boolean;
}

interface Leave {
  _id: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [activeTab, setActiveTab] = useState<'attendance' | 'workReport' | 'leaves'>('attendance');
  const [showManualPunchModal, setShowManualPunchModal] = useState(false);
  const [manualPunchData, setManualPunchData] = useState({
    date: '',
    punchIn: '',
    punchOut: '',
    reason: ''
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch today's attendance
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        
        const attendanceRes = await api.get(`/attendance/my-attendance?month=${month}&year=${year}`);
        const today = attendanceRes.data.find((r: any) => 
          new Date(r.date).toDateString() === currentDate.toDateString()
        );
        setTodayRecord(today || null);

        // Fetch announcements
        const announcementsRes = await api.get('/announcements');
        setAnnouncements(announcementsRes.data);

        // Fetch leaves
        const leavesRes = await api.get('/leaves/my-leaves');
        setLeaves(leavesRes.data);

      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handlePunchIn = async () => {
    try {
      const res = await api.post('/attendance/punchin');
      setTodayRecord(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error punching in');
    }
  };

  const handlePunchOut = async () => {
    try {
      const res = await api.post('/attendance/punchout');
      setTodayRecord(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error punching out');
    }
  };

  const handleManualPunchSubmit = async () => {
    try {
      // Validate the date is in the past
      const punchDate = new Date(manualPunchData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (punchDate >= today) {
        throw new Error('Manual punch only allowed for previous days');
      }

      const res = await api.post('/attendance/manual', {
        date: manualPunchData.date,
        punchIn: new Date(`${manualPunchData.date}T${manualPunchData.punchIn}`).toISOString(),
        punchOut: new Date(`${manualPunchData.date}T${manualPunchData.punchOut}`).toISOString(),
        reason: manualPunchData.reason
      });

      setTodayRecord(res.data);
      setShowManualPunchModal(false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error creating manual punch');
    }
  };

  const navigateToAttendance = () => {
    router.push('/employee/attendance');
  };

  const pendingLeaves = leaves.filter(leave => leave.status === 'pending').length;
  const upcomingLeaves = leaves.filter(leave => 
    leave.status === 'approved' && new Date(leave.startDate) > new Date()
  ).length;

  return (
    <Layout allowedRoles={['employee']}>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">Employee Dashboard</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side - Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Attendance/Work Report/Leaves section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex border-b border-gray-200">
                <button
                  className={`px-4 py-2 font-medium ${activeTab === 'attendance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('attendance')}
                >
                  Attendance
                </button>
                <button
                  className={`px-4 py-2 font-medium ${activeTab === 'workReport' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('workReport')}
                >
                  Work Report
                </button>
                <button
                  className={`px-4 py-2 font-medium ${activeTab === 'leaves' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('leaves')}
                >
                  Leaves & WFH
                </button>
              </div>

              {activeTab === 'attendance' && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Today's Attendance</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={handlePunchIn}
                        disabled={todayRecord?.punchIn}
                        className={`px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 ${todayRecord?.punchIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Punch In
                      </button>
                      <button
                        onClick={handlePunchOut}
                        disabled={!todayRecord?.punchIn || todayRecord?.punchOut}
                        className={`px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 ${!todayRecord?.punchIn || todayRecord?.punchOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Punch Out
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-500">Scheduled Hours</p>
                      <p className="font-semibold">8h 0m</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-500">Worked</p>
                      <p className="font-semibold">
                        {todayRecord?.punchIn && todayRecord?.punchOut 
                          ? `${Math.floor((new Date(todayRecord.punchOut).getTime() - new Date(todayRecord.punchIn).getTime()) / (1000 * 60 * 60))}h` 
                          : '0h'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-500">Balance</p>
                      <p className="font-semibold">0h 0m</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button 
                      onClick={navigateToAttendance}
                      className="text-blue-600 text-sm font-medium hover:underline"
                    >
                      My Attendance
                    </button>
                    <button 
                      onClick={() => setShowManualPunchModal(true)}
                      className="text-blue-600 text-sm font-medium ml-4 hover:underline"
                    >
                      Manual Punch In/Out
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-500">Working Days</p>
                      <p className="font-semibold">22</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-500">Absent Days</p>
                      <p className="font-semibold">0</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-500">Approved Leaves</p>
                      <p className="font-semibold">{leaves.filter(l => l.status === 'approved').length}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'workReport' && (
                <div className="mt-4">
                  <div className="flex border-b border-gray-200">
                    <button className="px-4 py-2 font-medium text-blue-600 border-b-2 border-blue-600">
                      Work Report
                    </button>
                    <button className="px-4 py-2 font-medium text-gray-500">
                      Work Report Overview
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input 
                        type="date" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        max={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Work Report</label>
                      <textarea 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                        rows={4}
                        placeholder="Enter your work report..."
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Submit
                      </button>
                      <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'leaves' && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-sm text-gray-500">Sick Leave</p>
                      <p className="font-semibold">5 available / 0 used</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-sm text-gray-500">Vacation</p>
                      <p className="font-semibold">12 available / 0 used</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-sm text-gray-500">Personal Leave</p>
                      <p className="font-semibold">3 available / 0 used</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-sm text-gray-500">WFH</p>
                      <p className="font-semibold">Unlimited / 0 used</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Apply New Leave
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Apply WFH Request
                    </button>
                    <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                      My Leaves
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with leaves/WFH */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-2">Recent Leaves & WFH</h3>
              {leaves.length === 0 ? (
                <p className="text-gray-500">No recent leave requests</p>
              ) : (
                <div className="space-y-2">
                  {leaves.slice(0, 3).map(leave => (
                    <div key={leave._id} className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <div>
                        <p className="capitalize">{leave.type} Leave</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(leave.startDate), 'MMM d, yyyy')} - {format(new Date(leave.endDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                        leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {leave.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Announcements and Calendar */}
          <div className="space-y-6">
            {/* Announcements */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Announcements</h3>
              {announcements.length === 0 ? (
                <p className="text-gray-500">No announcements</p>
              ) : (
                <div className="space-y-4">
                  {announcements.slice(0, 3).map(announcement => (
                    <div key={announcement._id} className="border-l-4 border-blue-500 pl-4 py-1">
                      <h4 className="font-medium">{announcement.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Pending Requests</p>
                  <p className="font-semibold">{pendingLeaves}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Upcoming Leaves</p>
                  <p className="font-semibold">{upcomingLeaves}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Punch Modal */}
      <Modal
        isOpen={showManualPunchModal}
        onClose={() => setShowManualPunchModal(false)}
        title="Manual Punch Entry"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              max={new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]}
              value={manualPunchData.date}
              onChange={(e) => setManualPunchData({...manualPunchData, date: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Punch In Time</label>
              <input
                type="time"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={manualPunchData.punchIn}
                onChange={(e) => setManualPunchData({...manualPunchData, punchIn: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Punch Out Time</label>
              <input
                type="time"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={manualPunchData.punchOut}
                onChange={(e) => setManualPunchData({...manualPunchData, punchOut: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              value={manualPunchData.reason}
              onChange={(e) => setManualPunchData({...manualPunchData, reason: e.target.value})}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowManualPunchModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleManualPunchSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
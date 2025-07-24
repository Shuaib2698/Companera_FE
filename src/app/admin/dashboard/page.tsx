'use client';
import { useEffect, useState } from 'react';
import Layout from '@/app/components/Layout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Modal from '@/app/components/Modal';

export default function AdminDashboard() {
  const router = useRouter();
  const [employeeCount, setEmployeeCount] = useState(0);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showManualPunchModal, setShowManualPunchModal] = useState(false);
  const [manualPunchData, setManualPunchData] = useState({
    date: '',
    punchIn: '',
    punchOut: '',
    reason: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countRes, attendanceRes] = await Promise.all([
          api.get('/users/count?role=employee').catch(err => {
            console.error('Error fetching employee count:', err);
            return { data: { count: 0 } };
          }),
          api.get('/attendance/my-attendance')
        ]);
        
        setEmployeeCount(countRes.data.count);
        
        const currentDate = new Date();
        const today = attendanceRes.data.find((r: any) => 
          new Date(r.date).toDateString() === currentDate.toDateString()
        );
        setTodayRecord(today || null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  return (
    <Layout allowedRoles={['admin']}>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Employees</h3>
            <p className="mt-2 text-3xl font-bold">{employeeCount}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Today's Attendance</h3>
            <p className="mt-2 text-3xl font-bold">
              {todayRecord ? todayRecord.status : 'Not Recorded'}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={navigateToAttendance}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                My Attendance
              </button>
              <button
                onClick={() => setShowManualPunchModal(true)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Manual Punch
              </button>
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

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Pending Requests</h3>
            <p className="mt-2 text-3xl font-bold">5</p>
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
      </div>
    </Layout>
  );
}
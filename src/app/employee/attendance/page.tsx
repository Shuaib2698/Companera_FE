'use client';

import Layout from '@/app/components/Layout';
import api from '@/lib/api';
import { useState, useEffect } from 'react';

interface AttendanceRecord {
  _id: string;
  date: string;
  punchIn: string;
  punchOut: string | null;
  status: string;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        
        const [allRecords, monthlyRecords] = await Promise.all([
          api.get('/attendance/my-attendance'),
          api.get(`/attendance/my-attendance?month=${month}&year=${year}`)
        ]);

        setRecords(allRecords.data);
        
        const today = monthlyRecords.data.find((r: any) => 
          new Date(r.date).toDateString() === currentDate.toDateString()
        );
        setTodayRecord(today || null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching attendance');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const handlePunchIn = async () => {
    try {
      const res = await api.post('/attendance/punchin');
      setTodayRecord(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error punching in');
    }
  };

  const handlePunchOut = async () => {
    try {
      const res = await api.post('/attendance/punchout');
      setTodayRecord(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error punching out');
    }
  };

  return (
    <Layout allowedRoles={['employee']}>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">Attendance</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Today's Attendance</h2>
          
          {todayRecord ? (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Punch In:</span>
                <span>{new Date(todayRecord.punchIn).toLocaleTimeString()}</span>
              </div>
              {todayRecord.punchOut ? (
                <div className="flex justify-between">
                  <span>Punch Out:</span>
                  <span>{new Date(todayRecord.punchOut).toLocaleTimeString()}</span>
                </div>
              ) : (
                <button
                  onClick={handlePunchOut}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Punch Out
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handlePunchIn}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Punch In
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Attendance History</h2>
          
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punch In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punch Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.punchIn ? new Date(record.punchIn).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.punchOut ? new Date(record.punchOut).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'present' ? 'bg-green-100 text-green-800' :
                          record.status === 'absent' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
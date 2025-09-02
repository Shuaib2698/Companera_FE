'use client';
import Layout from '@/app/components/Layout';
import api from '@/lib/api';
import { useState, useEffect } from 'react';

interface Punch {
  type: 'in' | 'out';
  time: string;
  _id?: string;
}

interface AttendanceRecord {
  _id: string;
  date: string;
  punches: Punch[];
  status: string;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [punchLoading, setPunchLoading] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
  try {
    const res = await api.get('/attendance/my-attendance');
    // Transform the data to ensure we have a punches array
    const recordsWithPunches = res.data.map((record: any) => {
      if (!record.punches && (record.punchIn || record.punchOut)) {
        // Convert old format to new format
        return {
          ...record,
          punches: [
            ...(record.punchIn ? [{ type: 'in', time: record.punchIn }] : []),
            ...(record.punchOut ? [{ type: 'out', time: record.punchOut }] : [])
          ]
        };
      }
      return record;
    });
    setRecords(recordsWithPunches);
  } catch (err: any) {
    setError(err.response?.data?.message || 'Error fetching attendance');
  } finally {
    setLoading(false);
  }
};

  const handlePunchIn = async () => {
  setPunchLoading(true);
  try {
    await api.post('/attendance/punch-in'); // Changed to punch-in
    await fetchAttendance(); // Refresh the data
  } catch (err: any) {
    setError(err.response?.data?.message || 'Error punching in');
  } finally {
    setPunchLoading(false);
  }
};

const handlePunchOut = async () => {
  setPunchLoading(true);
  try {
    await api.post('/attendance/punch-out'); // Changed to punch-out
    await fetchAttendance(); // Refresh the data
  } catch (err: any) {
    setError(err.response?.data?.message || 'Error punching out');
  } finally {
    setPunchLoading(false);
  }
};

  const getTodayRecord = () => {
    const today = new Date().toDateString();
    return records.find(record => new Date(record.date).toDateString() === today);
  };

  const getLastPunchType = () => {
  const todayRecord = getTodayRecord();
  if (!todayRecord || !todayRecord.punches || todayRecord.punches.length === 0) return null;
  return todayRecord.punches[todayRecord.punches.length - 1].type;
};

const canPunchIn = () => {
  const lastPunch = getLastPunchType();
  // Allow punch in if no punches yet or last punch was out
  return lastPunch === null || lastPunch === 'out';
};

const canPunchOut = () => {
  const lastPunch = getLastPunchType();
  // Allow punch out only if last punch was in
  return lastPunch === 'in';
};

  return (
    <Layout allowedRoles={['employee']}>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">Attendance</h1>
        
        {/* Punch In/Out Buttons */}
        <div className="bg-white p-6 rounded-lg shadow flex space-x-4">
          <button
            onClick={handlePunchIn}
            disabled={!canPunchIn() || punchLoading}
            className={`px-6 py-3 rounded-md text-white font-medium ${
              canPunchIn() ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {punchLoading ? 'Processing...' : 'Punch In'}
          </button>
          <button
            onClick={handlePunchOut}
            disabled={!canPunchOut() || punchLoading}
            className={`px-6 py-3 rounded-md text-white font-medium ${
              canPunchOut() ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {punchLoading ? 'Processing...' : 'Punch Out'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Attendance History</h2>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punches</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {record.punches.map((punch, index) => (
                            <div key={punch._id || index} className="flex items-center">
                              <span className={`w-16 inline-block text-xs font-medium mr-2 ${
                                punch.type === 'in' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {punch.type.toUpperCase()}
                              </span>
                              <span>
                                {new Date(punch.time).toLocaleTimeString()}
                              </span>
                            </div>
                          ))}
                        </div>
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
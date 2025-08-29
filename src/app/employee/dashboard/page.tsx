'use client';
import Layout from '@/app/components/Layout';
import api from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import Modal from '@/app/components/Modal';
import Image from 'next/image';

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

interface PunchRecord {
  _id: string;
  type: 'punchIn' | 'punchOut';
  timestamp: string;
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
  const [punchHistory, setPunchHistory] = useState<PunchRecord[]>([]);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch today's attendance
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        
        // Use the correct endpoint from backend
        const attendanceRes = await api.get(`/attendance/my-attendance?month=${month}&year=${year}`);
        const today = attendanceRes.data.find((r: any) => 
          new Date(r.date).toDateString() === currentDate.toDateString()
        );
        setTodayRecord(today || null);

        // Fetch announcements
        const announcementsRes = await api.get('/announcements');
        setAnnouncements(announcementsRes.data);

        // Fetch leaves - use correct endpoint
        const leavesRes = await api.get('/leaves/my-leaves');
        setLeaves(leavesRes.data);

        // For punch history, we'll simulate it from today's record since backend doesn't have this endpoint
        if (today) {
          const history: PunchRecord[] = [];
          if (today.punchIn) {
            history.push({
              _id: '1',
              type: 'punchIn',
              timestamp: today.punchIn
            });
          }
          if (today.punchOut) {
            history.push({
              _id: '2',
              type: 'punchOut',
              timestamp: today.punchOut
            });
          }
          setPunchHistory(history);
          
          // Start progress animation if punched in but not out
          if (today.punchIn && !today.punchOut) {
            startProgressAnimation();
          }
        }

      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        setError(err.response?.data?.message || 'Error fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Cleanup interval on unmount
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const startProgressAnimation = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (progressInterval.current) {
            clearInterval(progressInterval.current);
          }
          return 100;
        }
        return prev + 0.5; // Adjust speed as needed
      });
    }, 1000);
  };

  const handlePunchIn = async () => {
    try {
      const res = await api.post('/attendance/punchin');
      setTodayRecord(res.data);
      
      // Add to punch history
      setPunchHistory(prev => [...prev, {
        _id: Date.now().toString(),
        type: 'punchIn',
        timestamp: new Date().toISOString()
      }]);
      
      // Start progress animation
      setProgress(0);
      startProgressAnimation();
      
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error punching in');
    }
  };

  const handlePunchOut = async () => {
    try {
      const res = await api.post('/attendance/punchout');
      setTodayRecord(res.data);
      
      // Add to punch history
      setPunchHistory(prev => [...prev, {
        _id: Date.now().toString(),
        type: 'punchOut',
        timestamp: new Date().toISOString()
      }]);
      
      // Stop progress animation
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      setProgress(100);
      
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
        punchIn: manualPunchData.punchIn,
        punchOut: manualPunchData.punchOut,
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

  // Calculate total worked hours from punch history
  const calculateWorkedHours = () => {
    if (punchHistory.length === 0) return '0h 0m';
    
    let totalMs = 0;
    let punchInTime: Date | null = null;
    
    punchHistory.forEach(punch => {
      if (punch.type === 'punchIn') {
        punchInTime = new Date(punch.timestamp);
      } else if (punch.type === 'punchOut' && punchInTime) {
        const punchOutTime = new Date(punch.timestamp);
        totalMs += punchOutTime.getTime() - punchInTime.getTime();
        punchInTime = null;
      }
    });
    
    // If currently punched in but not out
    if (punchInTime) {
      totalMs += new Date().getTime() - punchInTime.getTime();
    }
    
    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Check if user can punch out (must have punched in last)
  const canPunchOut = punchHistory.length > 0 && punchHistory[punchHistory.length - 1].type === 'punchIn';

  return (
    <Layout allowedRoles={['employee']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome to your workspace</p>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <h2 className="text-xl font-semibold text-gray-800">Good to see you, User!</h2>
                <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64 bg-white rounded-2xl shadow-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left side - Main content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Attendance/Work Report/Leaves section */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="flex border-b border-gray-200 bg-gray-50">
                    <button
                      className={`px-6 py-4 font-medium text-sm transition-all duration-300 ${activeTab === 'attendance' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setActiveTab('attendance')}
                    >
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        My Attendance
                      </span>
                    </button>
                    <button
                      className={`px-6 py-4 font-medium text-sm transition-all duration-300 ${activeTab === 'workReport' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setActiveTab('workReport')}
                    >
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Work Report
                      </span>
                    </button>
                    <button
                      className={`px-6 py-4 font-medium text-sm transition-all duration-300 ${activeTab === 'leaves' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setActiveTab('leaves')}
                    >
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Leave & WFH
                      </span>
                    </button>
                  </div>

                  {activeTab === 'attendance' && (
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-800">Today's Attendance</h3>
                        <button 
                          onClick={navigateToAttendance}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Attendance History
                        </button>
                      </div>

                      <div className="flex flex-col md:flex-row gap-8 items-center justify-center mb-8">
                        {/* Punch In Button */}
                        <div className="relative">
                          <button
                            onClick={handlePunchIn}
                            disabled={todayRecord?.punchIn}
                            className={`w-28 h-28 rounded-full flex flex-col items-center justify-center text-white font-semibold transition-all duration-300 shadow-lg ${
                              todayRecord?.punchIn 
                                ? 'bg-green-500 cursor-not-allowed shadow-green-200' 
                                : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-200 hover:shadow-xl transform hover:-translate-y-1'
                            }`}
                          >
                            <div className="bg-white/20 rounded-full p-3 mb-2">
                              <Image 
                                src="/icons/punchin.png" 
                                alt="Punch In" 
                                width={32} 
                                height={32} 
                                className="filter brightness-0 invert"
                              />
                            </div>
                            <span className="text-sm">PUNCH IN</span>
                          </button>
                          {todayRecord?.punchIn && (
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-green-600 text-xs font-medium bg-green-100 px-2 py-1 rounded-full">
                              Done
                            </div>
                          )}
                        </div>

                        {/* Punch Out Button with Circular Progress */}
                        <div className="relative">
                          <div className="relative w-32 h-32">
                            {/* Circular Progress Background */}
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              {/* Background circle */}
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="6"
                              />
                              {/* Progress circle */}
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="url(#gradient)"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 45}`}
                                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                                className="transition-all duration-1000"
                              />
                              <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#6366f1" />
                                  <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                              </defs>
                            </svg>
                            
                            {/* Punch Out Button */}
                            <button
                              onClick={handlePunchOut}
                              disabled={!canPunchOut}
                              className={`absolute inset-0 w-24 h-24 rounded-full flex flex-col items-center justify-center text-white font-semibold transition-all duration-300 shadow-lg ${
                                !canPunchOut 
                                  ? 'bg-gray-400 cursor-not-allowed shadow-gray-200' 
                                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-indigo-200 hover:shadow-xl transform hover:-translate-y-1'
                              }`}
                              style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                            >
                              <div className="bg-white/20 rounded-full p-3 mb-2">
                                <Image 
                                  src="/icons/punchout.png" 
                                  alt="Punch Out" 
                                  width={32} 
                                  height={32} 
                                  className="filter brightness-0 invert"
                                />
                              </div>
                              <span className="text-sm">PUNCH OUT</span>
                            </button>
                          </div>
                          {todayRecord?.punchOut && (
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-green-600 text-xs font-medium bg-green-100 px-2 py-1 rounded-full">
                              Done
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Punch Status */}
                      {todayRecord?.punchIn && (
                        <div className="text-center mb-8 bg-blue-50 rounded-xl py-4 border border-blue-100">
                          <p className="text-gray-700 text-lg font-medium">
                            You punched in at <span className="text-blue-600 font-semibold">{format(new Date(todayRecord.punchIn), 'h:mm a')}</span>
                          </p>
                          {!todayRecord?.punchOut && (
                            <p className="text-green-600 font-semibold text-lg mt-1 flex items-center justify-center">
                              <svg className="w-5 h-5 mr-2 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              Ready to Punch Out
                            </p>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200 text-center">
                          <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">Scheduled</p>
                          <p className="font-semibold text-xl text-gray-800">8h 0m</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200 text-center">
                          <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">Worked</p>
                          <p className="font-semibold text-xl text-gray-800">{calculateWorkedHours()}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200 text-center">
                          <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">Balance</p>
                          <p className="font-semibold text-xl text-gray-800">0h 0m</p>
                        </div>
                      </div>

                      <div className="text-center">
                        <button 
                          onClick={() => setShowManualPunchModal(true)}
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-300"
                        >
                          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Add Manual Punch in/out
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'workReport' && (
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-6">Daily Work Report</h3>
                      <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input 
                          type="date" 
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                          max={format(new Date(), 'yyyy-MM-dd')}
                        />
                      </div>
                      <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Work Report</label>
                        <textarea 
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300" 
                          rows={5}
                          placeholder="Describe what you worked on today..."
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium transition-all duration-300 shadow-md hover:shadow-lg">
                          Submit Report
                        </button>
                        <button className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors duration-300">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'leaves' && (
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-6">Leave & WFH Balance</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                          <div className="flex items-center mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Sick Leave</p>
                              <p className="font-semibold text-gray-800">5 available / 0 used</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                          <div className="flex items-center mb-2">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Vacation</p>
                              <p className="font-semibold text-gray-800">12 available / 0 used</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                          <div className="flex items-center mb-2">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Personal Leave</p>
                              <p className="font-semibold text-gray-800">3 available / 0 used</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
                          <div className="flex items-center mb-2">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">WFH</p>
                              <p className="font-semibold text-gray-800">Unlimited / 0 used</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Apply New Leave
                        </button>
                        <button className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          Apply WFH Request
                        </button>
                        <button className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors duration-300 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          My Leaves
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Leaves & WFH Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Leaves & WFH</h3>
                  {leaves.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-500">No recent leave requests</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {leaves.slice(0, 5).map(leave => (
                        <div key={leave._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors duration-300">
                          <div>
                            <p className="capitalize font-medium text-gray-800">{leave.type} Leave</p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(leave.startDate), 'MMM d, yyyy')} - {format(new Date(leave.endDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                            leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                            leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Calendar, Announcements and Quick Stats */}
              <div className="space-y-6">
                {/* Small Calendar */}
                <div className="bg-white rounded-2xl shadow-lg p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">My Schedule</h3>
                  <div className="text-center mb-4">
                    <h4 className="font-semibold text-gray-700">May, 2025</h4>
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-center text-xs">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                      <div key={day} className="font-medium text-gray-500 py-2">{day}</div>
                    ))}
                    
                    {/* Empty days for the first week */}
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={`empty-${i}`} className="py-2"></div>
                    ))}
                    
                    {/* Days of the month */}
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <div 
                        key={day} 
                        className={`py-2 rounded-full transition-colors duration-300 ${
                          day === 24 
                            ? 'bg-blue-500 text-white font-semibold shadow-md' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Announcements */}
                <div className="bg-white rounded-2xl shadow-lg p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Announcements</h3>
                  {announcements.length === 0 ? (
                    <div className="text-center py-4">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-500 text-sm">No announcements</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {announcements.slice(0, 3).map(announcement => (
                        <div key={announcement._id} className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-blue-50 rounded-r-lg transition-colors duration-300">
                          <p className="text-xs text-gray-500 mb-1">
                            {format(new Date(announcement.createdAt), 'EEE, MMM d, yyyy')}
                          </p>
                          <h4 className="font-medium text-gray-800 text-sm mb-1">{announcement.title}</h4>
                          <p className="text-xs text-gray-600 line-clamp-2">{announcement.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-2xl shadow-lg p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                      <div className="flex items-center">
                        <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Pending Requests</p>
                          <p className="font-semibold text-gray-800">{pendingLeaves}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                      <div className="flex items-center">
                        <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Upcoming Leaves</p>
                          <p className="font-semibold text-gray-800">{upcomingLeaves}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
              max={new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]}
              value={manualPunchData.date}
              onChange={(e) => setManualPunchData({...manualPunchData, date: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Punch In Time</label>
              <input
                type="time"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                value={manualPunchData.punchIn}
                onChange={(e) => setManualPunchData({...manualPunchData, punchIn: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Punch Out Time</label>
              <input
                type="time"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                value={manualPunchData.punchOut}
                onChange={(e) => setManualPunchData({...manualPunchData, punchOut: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
              rows={4}
              value={manualPunchData.reason}
              onChange={(e) => setManualPunchData({...manualPunchData, reason: e.target.value})}
              placeholder="Please provide a reason for the manual punch entry..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowManualPunchModal(false)}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleManualPunchSubmit}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Submit
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
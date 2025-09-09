'use client';
import Layout from '@/app/components/Layout';
import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import Modal from '@/app/components/Modal';
import Image from 'next/image';
import { CalendarCheck, Circle, Loader2 } from 'lucide-react';

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

interface WorkReport {
  _id: string;
  date: string;
  workReport: string;
  status: string;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  _id: string;
  user: {
    _id: string;
    name: string;
    role: string;
  };
  comment: string;
  createdAt: string;
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
  const [punchLoading, setPunchLoading] = useState(false);

  const [secondsWorked, setSecondsWorked] = useState(0);
  const [progressColor, setProgressColor] = useState("#E89C1E");

  const MAX_HOURS = 9;
  const TOTAL_SECONDS = MAX_HOURS * 60 * 60;
  const RADIUS = 100;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  // Calculate progress for the circular indicator
  const progress = Math.min(secondsWorked / TOTAL_SECONDS, 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const hoursWorked = secondsWorked / 3600;

  // Update progress color based on hours worked
  useEffect(() => {
    if (hoursWorked >= 9) {
      setProgressColor("#6FAB55"); // green
    } else if (hoursWorked >= 4.5) {
      setProgressColor("#CA282C"); // red
    } else {
      setProgressColor("#E89C1E"); // default (orange)
    }
  }, [hoursWorked]);

  // Work report states
  const [workReports, setWorkReports] = useState<WorkReport[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [workReportText, setWorkReportText] = useState('');
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [workReportOverview, setWorkReportOverview] = useState<WorkReport[]>([]);
  const [activeWorkReportTab, setActiveWorkReportTab] = useState<'add' | 'overview'>('add');
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (todayRecord) {
      let startTime: Date | null = null;

      // Check for punch records in new format
      if (todayRecord.punches && todayRecord.punches.length > 0) {
        const lastPunch = todayRecord.punches[todayRecord.punches.length - 1];
        if (lastPunch.type === 'in') {
          startTime = new Date(lastPunch.time);
        }
      }
      // Fallback to old format
      else if (todayRecord.punchIn && !todayRecord.punchOut) {
        startTime = new Date(todayRecord.punchIn);
      }

      if (startTime) {
        interval = setInterval(() => {
          const diff = Math.floor((Date.now() - startTime!.getTime()) / 1000);
          setSecondsWorked(diff);
        }, 1000);
      } else {
        setSecondsWorked(0);
      }
    } else {
      setSecondsWorked(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [todayRecord]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch today's attendance
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();

        // Use the correct endpoint from backend
        const attendanceRes = await api.get(`/attendance/my-attendance?month=${month}&year=${year}`);

        // Find today's record
        const today = attendanceRes.data.find((r: any) => {
          const recordDate = new Date(r.date);
          recordDate.setHours(0, 0, 0, 0);
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          return recordDate.getTime() === todayDate.getTime();
        });

        setTodayRecord(today || null);

        // Fetch announcements
        const announcementsRes = await api.get('/announcements');
        setAnnouncements(announcementsRes.data);

        // Fetch leaves - use correct endpoint
        const leavesRes = await api.get('/leaves/my-leaves');
        setLeaves(leavesRes.data);

        // For punch history, use the punches from today's record
        if (today && today.punches) {
          const history: PunchRecord[] = today.punches.map((punch: any) => ({
            _id: punch._id,
            type: punch.type === 'in' ? 'punchIn' : 'punchOut',
            timestamp: punch.time
          }));
          setPunchHistory(history);
        }

      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        setError(err.response?.data?.message || 'Error fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch work reports for overview
  const fetchWorkReports = async () => {
    try {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      const res = await api.get(`/work-reports/my-reports?month=${month}&year=${year}`);
      setWorkReportOverview(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching work reports');
    }
  };

  // Submit or update work report
  const handleSubmitWorkReport = async () => {
    try {
      if (editingReportId) {
        // Update existing report
        await api.put(`/work-reports/${editingReportId}`, {
          date: selectedDate,
          workReport: workReportText
        });
      } else {
        // Create new report
        await api.post('/work-reports', {
          date: selectedDate,
          workReport: workReportText
        });
      }

      setWorkReportText('');
      setEditingReportId(null);
      setError('');

      // Show success message
      alert(`Work report ${editingReportId ? 'updated' : 'submitted'} successfully!`);
      
      // Refresh the overview if we're in that tab
      if (activeWorkReportTab === 'overview') {
        fetchWorkReports();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error submitting work report');
    }
  };

  // Edit work report
  const editWorkReport = (report: WorkReport) => {
    setSelectedDate(format(new Date(report.date), 'yyyy-MM-dd'));
    setWorkReportText(report.workReport);
    setEditingReportId(report._id);
    setActiveWorkReportTab('add');
  };

  // Delete work report
  const deleteWorkReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work report?')) return;

    try {
      await api.delete(`/work-reports/${id}`);
      setWorkReportOverview(workReportOverview.filter(report => report._id !== id));
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting work report');
    }
  };

  // Check if report can be edited (within 1 day)
  const canEditReport = (report: WorkReport) => {
    const now = new Date();
    const reportDate = new Date(report.createdAt);
    const hoursDiff = (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  // Check if report can be deleted (within 1 day or admin)
  const canDeleteReport = (report: WorkReport) => {
    const now = new Date();
    const reportDate = new Date(report.createdAt);
    const hoursDiff = (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  const handlePunchIn = async () => {
    if (!canPunchIn() || punchLoading) return;
    
    setPunchLoading(true);
    try {
      const res = await api.post('/attendance/punch-in');
      setTodayRecord(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error punching in');
    } finally {
      setPunchLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (!canPunchOut() || punchLoading) return;
    
    setPunchLoading(true);
    try {
      const res = await api.post('/attendance/punch-out');
      setTodayRecord(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error punching out');
    } finally {
      setPunchLoading(false);
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

      // Convert to punches array format for the new system
      const punches = [];
      if (manualPunchData.punchIn) {
        punches.push({
          type: 'in',
          time: new Date(`${manualPunchData.date}T${manualPunchData.punchIn}`)
        });
      }
      if (manualPunchData.punchOut) {
        punches.push({
          type: 'out',
          time: new Date(`${manualPunchData.date}T${manualPunchData.punchOut}`)
        });
      }

      const res = await api.post('/attendance/manual', {
        date: manualPunchData.date,
        punches: punches,
        reason: manualPunchData.reason
      });

      setTodayRecord(res.data);
      setShowManualPunchModal(false);
      setManualPunchData({ date: '', punchIn: '', punchOut: '', reason: '' });
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error creating manual punch');
    }
  };

  const navigateToAttendance = () => {
    router.push('/employee/attendance');
  };

  const navigateToLeaves = () => {
    router.push('/employee/leaves');
  };

  const navigateToApplyLeave = () => {
    router.push('/employee/leaves/apply');
  };

  const navigateToApplyWFH = () => {
    router.push('/employee/wfh/apply');
  };

  const pendingLeaves = leaves.filter(leave => leave.status === 'pending').length;
  const upcomingLeaves = leaves.filter(leave =>
    leave.status === 'approved' && new Date(leave.startDate) > new Date()
  ).length;

  const calculateWorkedHours = () => {
    const hours = Math.floor(secondsWorked / 3600);
    const minutes = Math.floor((secondsWorked % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getLastPunchType = () => {
    if (!todayRecord) return null;

    // Check if we have punch records in the new format
    if (todayRecord.punches && todayRecord.punches.length > 0) {
      const lastPunch = todayRecord.punches[todayRecord.punches.length - 1];
      return lastPunch.type;
    }

    // Fallback to old format
    if (todayRecord.punchIn && !todayRecord.punchOut) return 'in';
    if (todayRecord.punchOut) return 'out';

    return null;
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

  // Get current month and year for calendar
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

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

                      <div className="grid grid-cols-2 gap-2 md:gap-6 mt-3 md:mt-6">
  {/* Punch In & Punch Out section */}
  <div className="flex items-center justify-center flex-col">
    {/* Punch In Section */}
    <div className="w-[8rem] h-[8rem] md:w-[14rem] md:h-[14rem] rounded-full flex justify-center items-center">
      <div
        onClick={canPunchIn() && !punchLoading ? handlePunchIn : undefined}
        className={`flex items-center justify-center w-[7rem] h-[7rem] md:w-[12.5rem] md:h-[12.5rem] rounded-full ${
          !canPunchIn() || punchLoading
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-[#E2E6EA] cursor-pointer hover:bg-gray-200 transition-colors"
        }`}
      >
        <div className="relative flex items-center justify-center w-[5.5rem] h-[5.5rem] md:w-[9.5rem] md:h-[9.5rem] shadow-lg rounded-full bg-gray-100">
          <div className="absolute w-[4.5rem] h-[4.5rem] md:w-[8rem] md:h-[8rem] bg-gradient-to-r from-[#E4E7ED] to-[#FFFFFF] rounded-full flex flex-col items-center justify-center">
            <Image
              src="/icons/punchin.png"
              alt="Punch In"
              width={32}
              height={32}
              className="w-6 h-8 md:w-8 md:h-12"
            />
            <p className="mt-1 text-[10px] md:text-xs font-semibold text-gray-800">
              PUNCH IN
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="bg-[#EEEEEE] mt-3 py-1.5 px-3 rounded-full">
      <p className="text-gray-500 text-[10px] md:text-sm flex items-center justify-center">
        <Circle
          size={10}
          className="text-yellow-500 mr-1 md:mr-2 bg-yellow-500 rounded-full"
        />
        {(() => {
          let punchInTime = null;

          if (todayRecord?.punches) {
            const punchInRecord = todayRecord.punches.find((punch: any) => punch.type === 'in');
            if (punchInRecord) {
              punchInTime = punchInRecord.time;
            }
          } else if (todayRecord?.punchIn) {
            punchInTime = todayRecord.punchIn;
          }

          return punchInTime
            ? `Punch In at ${format(new Date(punchInTime), 'h:mm a')}`
            : "Not Punched In yet";
        })()}
      </p>
    </div>
  </div>

  {/* Add margin top to create a gap */}
  <div className="mt-8 flex items-center justify-center flex-col">
    {/* Punch Out Section */}
    <div className="relative w-[8rem] h-[8rem] md:w-[14rem] md:h-[14rem] rounded-full flex items-center justify-center">
      <svg
        className="absolute top-1 right-1 w-full h-full transform -rotate-90"
        viewBox="0 0 225 225"
      >
        <circle
          cx="120"
          cy="120"
          r={RADIUS}
          stroke={progressColor}
          strokeWidth="8"
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      <div
        className={`flex items-center justify-center w-[7rem] h-[7rem] md:w-[12.5rem] md:h-[12.5rem] rounded-full ${
          canPunchOut() && !punchLoading
            ? "bg-[#E2E6EA] cursor-pointer hover:bg-gray-200 transition-colors"
            : "bg-gray-300 cursor-not-allowed"
        }`}
      >
        <div
          onClick={canPunchOut() && !punchLoading ? handlePunchOut : undefined}
          className="relative flex items-center justify-center w-[5.5rem] h-[5.5rem] md:w-[9.5rem] md:h-[9.5rem] shadow-lg rounded-full bg-gray-100"
        >
          <div className="absolute w-[4.5rem] h-[4.5rem] md:w-[8rem] md:h-[8rem] bg-gradient-to-r from-[#E4E7ED] to-[#FFFFFF] rounded-full flex flex-col items-center justify-center">
            <Image
              src="/icons/punchout.png"
              alt="Punch Out"
              width={32}
              height={32}
              className="w-6 h-8 md:w-8 md:h-12"
            />
            <p className="mt-1 text-[10px] md:text-xs font-semibold text-gray-800">
              PUNCH OUT
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="bg-[#EEEEEE] mt-3 py-1.5 px-3 rounded-full">
      <p className="text-gray-500 text-[10px] md:text-sm flex items-center justify-center">
        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1 md:mr-2" />
        {(() => {
          let punchOutTime = null;

          if (todayRecord?.punches) {
            const punchOutRecord = todayRecord.punches.find((punch: any) => punch.type === 'out');
            if (punchOutRecord) {
              punchOutTime = punchOutRecord.time;
              return `Punch Out at ${format(new Date(punchOutTime), 'h:mm a')}`;
            }
          } else if (todayRecord?.punchOut) {
            punchOutTime = todayRecord.punchOut;
            return `Punch Out at ${format(new Date(punchOutTime), 'h:mm a')}`;
          }

          return canPunchOut() ? "Ready to Punch Out" : "Punch In First";
        })()}
      </p>
    </div>
  </div>
</div>

{/* The stats section */}
<div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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



                      <div className="flex justify-center">
  <button
    onClick={() => setShowManualPunchModal(true)}
    className="flex items-center justify-center bg-purple-500 text-white hover:bg-purple-600 px-6 py-3 rounded-lg text-lg font-medium transition-colors duration-300 w-full max-w-md"
  >
    <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
        clipRule="evenodd"
      />
    </svg>
    Add Manual Punch in/out
  </button>
</div>

                    </div>
                  )}

                  {activeTab === 'workReport' && (
                    <div className="p-6">
                      <div className="flex border-b border-gray-200 mb-6">
                        <button
                          className={`px-6 py-3 font-medium text-sm transition-all duration-300 ${activeWorkReportTab === 'add' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                          onClick={() => setActiveWorkReportTab('add')}
                        >
                          Add Work Report
                        </button>
                        <button
                          className={`px-6 py-3 font-medium text-sm transition-all duration-300 ${activeWorkReportTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                          onClick={() => {
                            setActiveWorkReportTab('overview');
                            fetchWorkReports();
                          }}
                        >
                          Work Report Overview
                        </button>
                      </div>

                      {activeWorkReportTab === 'add' && (
                        <>
                          <h3 className="text-xl font-semibold text-gray-800 mb-6">Daily Work Report</h3>
                          <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                            <input
                              type="date"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                              max={format(new Date(), 'yyyy-MM-dd')}
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                            />
                          </div>
                          <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Work Report</label>
                            <textarea
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                              rows={5}
                              placeholder="Describe what you worked on today..."
                              value={workReportText}
                              onChange={(e) => setWorkReportText(e.target.value)}
                            />
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={handleSubmitWorkReport}
                              disabled={!workReportText.trim()}
                              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg ${!workReportText.trim()
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                                }`}
                            >
                              {editingReportId ? 'Update Report' : 'Submit Report'}
                            </button>
                            {editingReportId && (
                              <button
                                onClick={() => {
                                  setEditingReportId(null);
                                  setWorkReportText('');
                                  setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
                                }}
                                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors duration-300"
                              >
                                Cancel Edit
                              </button>
                            )}
                          </div>
                        </>
                      )}

                      {activeWorkReportTab === 'overview' && (
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800 mb-6">Work Report Overview</h3>
                          {workReportOverview.length === 0 ? (
                            <div className="text-center py-8">
                              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-gray-500">No work reports found</p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {workReportOverview.map((report) => (
                                <div key={report._id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                  <div className="flex justify-between items-start mb-4">
                                    <div>
                                      <p className="font-medium text-gray-800">
                                        {format(new Date(report.date), 'EEEE, MMMM d, yyyy')}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {format(new Date(report.createdAt), 'MMM d, yyyy h:mm a')}
                                      </p>
                                    </div>
                                    <div className="flex space-x-2">
                                      {canEditReport(report) && (
                                        <button
                                          onClick={() => editWorkReport(report)}
                                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors duration-300"
                                        >
                                          Edit
                                        </button>
                                      )}
                                      {canDeleteReport(report) && (
                                        <button
                                          onClick={() => deleteWorkReport(report._id)}
                                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors duration-300"
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="bg-white p-4 rounded-lg mb-4">
                                    <p className="text-gray-700 whitespace-pre-wrap">{report.workReport}</p>
                                  </div>

                                  {report.comments && report.comments.length > 0 && (
                                    <div className="mt-4">
                                      <h4 className="font-medium text-gray-800 mb-3">Comments</h4>
                                      <div className="space-y-3">
                                        {report.comments.map((comment) => (
                                          <div key={comment._id} className="bg-white p-3 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-start mb-2">
                                              <p className="font-medium text-gray-800">{comment.user.name}</p>
                                              <p className="text-xs text-gray-500">
                                                {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                                              </p>
                                            </div>
                                            <p className="text-gray-700">{comment.comment}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
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
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${leave.status === 'approved' ? 'bg-green-100 text-green-800' :
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
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{currentMonth} {currentYear}</h3>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                      <div key={index} className="text-center text-xs font-medium text-gray-500 py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array(firstDayOfMonth).fill(null).map((_, index) => (
                      <div key={`empty-${index}`} className="h-8"></div>
                    ))}
                    {Array(daysInMonth).fill(null).map((_, index) => {
                      const day = index + 1;
                      const isToday = day === currentDate.getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                      return (
                        <div
                          key={day}
                          className={`h-8 flex items-center justify-center text-sm rounded-full ${isToday
                              ? 'bg-blue-600 text-white font-medium'
                              : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                            }`}
                        >
                          {day}
                        </div>
                      );
                    })}
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
              onChange={(e) => setManualPunchData({ ...manualPunchData, date: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Punch In Time</label>
              <input
                type="time"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                value={manualPunchData.punchIn}
                onChange={(e) => setManualPunchData({ ...manualPunchData, punchIn: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Punch Out Time</label>
              <input
                type="time"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                value={manualPunchData.punchOut}
                onChange={(e) => setManualPunchData({ ...manualPunchData, punchOut: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
              rows={4}
              value={manualPunchData.reason}
              onChange={(e) => setManualPunchData({ ...manualPunchData, reason: e.target.value })}
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
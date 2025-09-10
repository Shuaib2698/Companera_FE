// app/admin/holidays/page.tsx
"use client";
import Layout from "@/app/components/Layout";
import api from "@/lib/api";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import Modal from "@/app/components/Modal";

interface Holiday {
  _id: string;
  name: string;
  date: string;
  type: string;
  description?: string;
  recurring: boolean;
}

export default function AdminHolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [holidayForm, setHolidayForm] = useState({
    name: "",
    date: "",
    type: "government",
    description: "",
    recurring: false
  });

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/holidays?year=${selectedYear}`);
      setHolidays(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error fetching holidays");
    } finally {
      setLoading(false);
    }
  };

  const initializeGovernmentHolidays = async () => {
    try {
      await api.post('/holidays/initialize', { year: selectedYear });
      setError("");
      alert('Government holidays initialized successfully');
      fetchHolidays();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error initializing holidays");
    }
  };

  const handleAddHoliday = async () => {
    try {
      await api.post('/holidays', holidayForm);
      setShowAddModal(false);
      setHolidayForm({
        name: "",
        date: "",
        type: "government",
        description: "",
        recurring: false
      });
      setError("");
      fetchHolidays();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error adding holiday");
    }
  };

  const handleDeleteHoliday = async () => {
    if (!selectedHoliday) return;
    
    try {
      await api.delete(`/holidays/${selectedHoliday._id}`);
      setShowDeleteModal(false);
      setSelectedHoliday(null);
      setError("");
      fetchHolidays();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error deleting holiday");
    }
  };

  const getYears = () => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Holiday Management</h1>
                <p className="text-gray-600 mt-1">Manage company and government holidays</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Add Holiday
              </button>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center">
                <label className="mr-2 text-gray-700">Select Year:</label>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {getYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={initializeGovernmentHolidays}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition-colors duration-300"
              >
                Initialize Government Holidays
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* Holidays List */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Holidays for {selectedYear}
            </h2>
            
            {holidays.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">No holidays found for {selectedYear}</p>
                <button
                  onClick={initializeGovernmentHolidays}
                  className="mt-4 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition-colors duration-300"
                >
                  Initialize Government Holidays
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {holidays.map(holiday => (
                  <div key={holiday._id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{holiday.name}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(holiday.date), 'EEEE, MMMM d, yyyy')}
                        </p>
                        {holiday.description && (
                          <p className="text-sm text-gray-600 mt-1">{holiday.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {holiday.recurring ? 'Recurring yearly' : 'One-time holiday'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                          holiday.type === 'government' ? 'bg-blue-100 text-blue-800' :
                          holiday.type === 'company' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedHoliday(holiday);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Holiday Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Holiday"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Holiday Name</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
              value={holidayForm.name}
              onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
              placeholder="Enter holiday name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
              value={holidayForm.date}
              onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
              value={holidayForm.type}
              onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
            >
              <option value="government">Government Holiday</option>
              <option value="company">Company Holiday</option>
              <option value="religious">Religious Holiday</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
              rows={3}
              value={holidayForm.description}
              onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
              placeholder="Enter holiday description"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="recurring"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={holidayForm.recurring}
              onChange={(e) => setHolidayForm({ ...holidayForm, recurring: e.target.checked })}
            />
            <label htmlFor="recurring" className="ml-2 block text-sm text-gray-700">
              Recurring holiday (repeats yearly)
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleAddHoliday}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Add Holiday
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Holiday"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete the holiday "{selectedHoliday?.name}" on{" "}
            {selectedHoliday && format(new Date(selectedHoliday.date), 'MMMM d, yyyy')}?
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteHoliday}
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Delete Holiday
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
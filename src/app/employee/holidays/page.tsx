// app/employee/holidays/page.tsx
"use client";
import Layout from "@/app/components/Layout";
import api from "@/lib/api";
import { useState, useEffect } from "react";
import { format } from "date-fns";

interface Holiday {
  _id: string;
  name: string;
  date: string;
  type: string;
  description?: string;
  recurring: boolean;
}

export default function EmployeeHolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
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

    fetchHolidays();
  }, [selectedYear]);

  const getYears = () => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Holiday Calendar</h1>
            <p className="text-gray-600 mt-1">View company and government holidays</p>
            
            <div className="mt-4 flex items-center">
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
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        holiday.type === 'government' ? 'bg-blue-100 text-blue-800' :
                        holiday.type === 'company' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
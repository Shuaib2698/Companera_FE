'use client';
import Layout from '@/app/components/Layout';

export default function EmployeeDashboard() {
  return (
    <Layout allowedRoles={['employee']}>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">Employee Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Today's Attendance</h3>
            <p className="mt-2 text-3xl font-bold">Present</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Pending Requests</h3>
            <p className="mt-2 text-3xl font-bold">2</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Leaves</h3>
            <p className="mt-2 text-3xl font-bold">1</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

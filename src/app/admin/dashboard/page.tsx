import Layout from '@/app/components/Layout';

export default function AdminDashboard() {
  return (
    <Layout allowedRoles={['admin']}>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Employees</h3>
            <p className="mt-2 text-3xl font-bold">24</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Pending Requests</h3>
            <p className="mt-2 text-3xl font-bold">5</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Today's Attendance</h3>
            <p className="mt-2 text-3xl font-bold">18/24</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {/* Activity items would go here */}
            <div className="border-b pb-4">
              <p>John Doe submitted a payment request</p>
              <p className="text-sm text-gray-500">2 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
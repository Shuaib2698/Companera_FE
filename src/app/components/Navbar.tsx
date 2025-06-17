'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearToken, getUserFromToken } from '@/lib/auth';

export default function Navbar() {
  const router = useRouter();
  const user = getUserFromToken();

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex space-x-8">
          <Link href={user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} 
                className="text-xl font-bold text-blue-600">
            Company CMS
          </Link>
          
          {user?.role === 'employee' && (
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/employee/dashboard" className="text-gray-700 hover:text-blue-600">
                Dashboard
              </Link>
              <Link href="/employee/payment-Request" className="text-gray-700 hover:text-blue-600">
                Payment Requests
              </Link>
              <Link href="/employee/attendance" className="text-gray-700 hover:text-blue-600">
                Attendance
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <>
              <span className="hidden md:block text-gray-700">
                {user.name} ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
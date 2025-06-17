'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar';
import { getUserFromToken } from '@/lib/auth';

export default function Layout({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = getUserFromToken();
    if (!user) {
      router.push('/login');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.push(user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
      return;
    }

    setIsReady(true);
  }, [router, allowedRoles]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow">
          <div className="container mx-auto px-4 py-3">
            <div className="text-xl font-bold text-blue-600">Loading...</div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8"></main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
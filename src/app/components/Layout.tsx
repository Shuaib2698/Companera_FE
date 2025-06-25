'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar';
import { getUserFromToken } from '@/lib/auth';

interface LayoutProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function Layout({ children, allowedRoles }: LayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getUserFromToken();

    if (!currentUser) {
      router.push('/login');
      return;
    }

    // If allowedRoles is defined and user role not in allowedRoles, redirect
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
      router.push(currentUser.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
      return;
    }

    setUser(currentUser);
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
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

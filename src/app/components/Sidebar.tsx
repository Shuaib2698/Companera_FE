'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUserFromToken } from '@/lib/auth';

export default function Sidebar() {
  const pathname = usePathname();
  const user = getUserFromToken();

  const employeeLinks = [
    { href: '/employee/dashboard', text: 'Dashboard' },
    { href: '/employee/attendance', text: 'Attendance' },
    { href: '/employee/leaves', text: 'Leaves & WFH' },
    { href: '/employee/announcement', text: 'Announcements' },
    { href: '/employee/payment-Request', text: 'Payment Requests' },
  ];

  const adminLinks = [
    { href: '/admin/dashboard', text: 'Dashboard' },
    { href: '/admin/announcement', text: 'Announcements' },
    { href: '/admin/payment-Request', text: 'Payment Requests' },
    { href: '/admin/employees', text: 'Employees' },
  ];

  const links = user?.role === 'admin' ? adminLinks : employeeLinks;

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">Company CMS</h1>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block px-4 py-2 rounded ${pathname === link.href ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {link.text}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
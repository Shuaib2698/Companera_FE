'use client';
import { useEffect, useState } from 'react';
import Layout from '@/app/components/Layout';
import api from '@/lib/api';
import AnnouncementCard from '@/app/components/AnnouncementCard';

export default function EmployeeAnnouncementPage() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/announcements');
        setAnnouncements(res.data);
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <Layout allowedRoles={['employee']}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Company Announcements</h1>

        {announcements.length === 0 ? (
          <p className="text-gray-500">No announcements available.</p>
        ) : (
          <div className="space-y-4">
            {announcements.map((a: any) => (
              <AnnouncementCard key={a._id} announcement={a} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

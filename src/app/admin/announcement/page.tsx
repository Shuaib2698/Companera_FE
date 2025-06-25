'use client';
import { useEffect, useState } from 'react';
import Layout from '@/app/components/Layout';
import api from '@/lib/api';
import AnnouncementForm from '@/app/components/AnnouncementForm';
import AnnouncementCard from '@/app/components/AnnouncementCard';

export default function AdminAnnouncementPage() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const res = await api.get('/announcements');
    setAnnouncements(res.data);
  };

  const handleCreate = async (data: any) => {
    await api.post('/announcements', data);
    fetchAnnouncements();
  };

  const handleUpdate = async (id: string, data: any) => {
    await api.put(`/announcements/${id}`, data);
    fetchAnnouncements();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/announcements/${id}`);
    fetchAnnouncements();
  };

  return (
    <Layout allowedRoles={['admin']}>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Announcement Section</h1>

        <AnnouncementForm onSubmit={handleCreate} />

        <div className="grid grid-cols-1 gap-4">
          {announcements.map((a: any) => (
            <AnnouncementCard
              key={a._id}
              announcement={a}
              isAdmin
              onEdit={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}

import React from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ReservationsManager } from '../../components/admin/ReservationsManager';

export const ReservationsAdminPage: React.FC = () => {
  return (
    <AdminLayout activeTab="reservations">
      <ReservationsManager />
    </AdminLayout>
  );
};

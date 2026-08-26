import React from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { StaffManager } from '../../components/admin/StaffManager';

export const StaffAdminPage: React.FC = () => {
  return (
    <AdminLayout activeTab="staff" onAddNewItem={undefined}>
      <StaffManager />
    </AdminLayout>
  );
};

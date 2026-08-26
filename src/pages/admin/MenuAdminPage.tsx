import React from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { MenuManager } from '../../components/admin/MenuManager';

export const MenuAdminPage: React.FC = () => {
  return (
    <AdminLayout activeTab="menu">
      <MenuManager />
    </AdminLayout>
  );
};

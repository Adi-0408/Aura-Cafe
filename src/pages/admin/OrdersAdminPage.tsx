import React from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { StockOrdersManager } from '../../components/admin/StockOrdersManager';

export const OrdersAdminPage: React.FC = () => {
  return (
    <AdminLayout activeTab="orders">
      <StockOrdersManager />
    </AdminLayout>
  );
};

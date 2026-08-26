import React from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { LiveStoreCounter } from '../../components/admin/LiveStoreCounter';

export const LiveCounterPage: React.FC = () => {
  return (
    <AdminLayout activeTab="counter" onAddNewItem={undefined}>
      <LiveStoreCounter />
    </AdminLayout>
  );
};

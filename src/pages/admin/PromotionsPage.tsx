import React from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { PromotionsManager } from '../../components/admin/PromotionsManager';

export const PromotionsPage: React.FC = () => {
  return (
    <AdminLayout activeTab="promotions">
      <PromotionsManager />
    </AdminLayout>
  );
};

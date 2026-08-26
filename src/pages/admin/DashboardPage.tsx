import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { KpiMetrics } from '../../components/admin/KpiMetrics';
import { InventoryTable } from '../../components/admin/InventoryTable';
import { RestockAlertPanel } from '../../components/admin/RestockAlertPanel';
import { ItemModal } from '../../components/admin/ItemModal';
import { useInventory } from '../../context/InventoryContext';
import { InventoryItem, StockFilter } from '../../types';

export const DashboardPage: React.FC = () => {
  const { saveItem, stats } = useInventory();
  const [filter, setFilter] = useState<StockFilter>('all');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAddNewItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  return (
    <AdminLayout activeTab="inventory" onAddNewItem={handleAddNewItem}>
      <div className="space-y-6">
        
        {/* KPI Overview Cards */}
        <KpiMetrics activeFilter={filter} onSelectFilter={setFilter} />

        {/* Critical Low Stock Panel (Shown if any items need attention) */}
        {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
          <RestockAlertPanel />
        )}

        {/* Main Inventory Spreadsheet Table */}
        <InventoryTable
          initialFilter={filter}
          onEditItem={handleEditItem}
          onAddNewItem={handleAddNewItem}
        />

        {/* Item Modal */}
        <ItemModal
          isOpen={isModalOpen}
          item={editingItem}
          onClose={() => setIsModalOpen(false)}
          onSave={saveItem}
        />

      </div>
    </AdminLayout>
  );
};

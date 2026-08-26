import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { RestockAlertPanel } from '../../components/admin/RestockAlertPanel';
import { RestockOrdersTracker } from '../../components/admin/RestockOrdersTracker';
import { InventoryTable } from '../../components/admin/InventoryTable';
import { ItemModal } from '../../components/admin/ItemModal';
import { useInventory } from '../../context/InventoryContext';
import { InventoryItem } from '../../types';

export const InventoryPage: React.FC = () => {
  const { saveItem } = useInventory();
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
    <AdminLayout activeTab="restock" onAddNewItem={handleAddNewItem}>
      <div className="space-y-6">
        
        {/* Critical Depletion Panel */}
        <RestockAlertPanel />

        {/* Live Purchase Orders & Delivery Pipeline Tracker */}
        <RestockOrdersTracker />

        {/* Low Stock Filtered Table */}
        <InventoryTable
          initialFilter="low_stock"
          onEditItem={handleEditItem}
          onAddNewItem={handleAddNewItem}
        />

        {/* Item Edit/Create Modal */}
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

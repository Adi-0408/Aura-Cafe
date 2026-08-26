import React, { useState } from 'react';
import { useMenu } from '../../context/MenuContext';
import { MenuItem, MenuCategory, DietaryTag } from '../../types';
import { DietaryBadge } from '../common/Badge';
import { formatCurrency } from '../../utils/currency';
import { 
  UtensilsCrossed, 
  Plus, 
  X, 
  Edit3, 
  Clock, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const CATEGORIES: MenuCategory[] = [
  'Espresso & Specialty Coffee',
  'Cold Brews & Teas',
  'Artisan Bakery',
  'All-Day Brunch'
];

const DIETARY_OPTIONS: DietaryTag[] = ['VG', 'V', 'GF', 'DF', 'N'];

export const MenuManager: React.FC = () => {
  const { menuItems, toggleAvailability, saveMenuItem } = useMenu();
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MenuCategory>('Espresso & Specialty Coffee');
  const [price, setPrice] = useState<number>(280.00);
  const [description, setDescription] = useState('');
  const [dietaryTags, setDietaryTags] = useState<DietaryTag[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [prepTime, setPrepTime] = useState('3-5 mins');
  const [tastingNotesStr, setTastingNotesStr] = useState('');
  const [featured, setFeatured] = useState(false);

  const openEditor = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price);
    setDescription(item.description);
    setDietaryTags(item.dietaryTags);
    setImageUrl(item.imageUrl);
    setPrepTime(item.prepTime || '3-5 mins');
    setTastingNotesStr((item.tastingNotes || []).join(', '));
    setFeatured(!!item.featured);
    setIsCreatingNew(false);
  };

  const openNew = () => {
    setEditingItem(null);
    setName('');
    setCategory('Espresso & Specialty Coffee');
    setPrice(280.00);
    setDescription('');
    setDietaryTags(['V']);
    setImageUrl('https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80');
    setPrepTime('3-5 mins');
    setTastingNotesStr('Aromatic, Smooth, Sweet');
    setFeatured(false);
    setIsCreatingNew(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const notesArray = tastingNotesStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const itemToSave: MenuItem = {
      id: editingItem ? editingItem.id : `menu-${Date.now().toString(36)}`,
      name: name.trim(),
      category,
      price: Number(price),
      description: description.trim(),
      dietaryTags,
      isAvailable: editingItem ? editingItem.isAvailable : true,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80',
      prepTime,
      tastingNotes: notesArray,
      featured,
    };

    await saveMenuItem(itemToSave);
    setEditingItem(null);
    setIsCreatingNew(false);
  };

  const toggleTag = (tag: DietaryTag) => {
    setDietaryTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="space-y-8">
      
      {/* Header Bar */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D2DFE2]/80 shadow-warm-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#10222B]">
            Menu Catalog & Live Availability
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Toggle recipes in real time. Items marked unavailable instantly display a "Sold Out Today" badge on customer devices.
          </p>
        </div>

        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10222B] text-[#F2F6F7] hover:bg-[#1E3A47] text-xs font-bold transition-all shadow-warm-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-[#77C7C6]" />
          <span>Add Menu Item</span>
        </button>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-3xl p-6 border transition-all shadow-warm-sm flex flex-col justify-between space-y-5 ${
              item.isAvailable ? 'border-[#D2DFE2]/80 hover:shadow-warm-md' : 'border-rose-200 bg-rose-50/20'
            }`}
          >
            <div className="space-y-4">
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-stone-100 border border-[#D2DFE2]/60">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#10222B]/90 text-[#77C7C6] font-semibold text-xs shadow-sm">
                  {formatCurrency(item.price)}
                </div>
                {item.featured && (
                  <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-[#1B8585] text-white text-[10px] font-bold uppercase tracking-wider">
                    Signature
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#1B8585] block">
                  {item.category}
                </span>

                <h4 className="font-serif font-bold text-lg text-[#10222B]">
                  {item.name}
                </h4>

                <p className="text-stone-600 text-xs leading-relaxed line-clamp-2">
                  {item.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.dietaryTags.map(tag => (
                    <DietaryBadge key={tag} tag={tag} size="sm" />
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="pt-4 border-t border-[#D2DFE2]/60 flex items-center justify-between gap-2">
              <button
                onClick={() => toggleAvailability(item.id, !item.isAvailable)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  item.isAvailable
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${item.isAvailable ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                <span>{item.isAvailable ? 'Live on Menu' : 'Sold Out Today'}</span>
              </button>

              <button
                onClick={() => openEditor(item)}
                className="p-2 rounded-xl bg-[#F2F6F7] hover:bg-[#E5ECEE] text-stone-700 text-xs font-semibold border border-[#D2DFE2] transition-colors"
                title="Edit item details"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Edit / Create Item Dialog */}
      {(editingItem || isCreatingNew) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-[#F6F9FA] rounded-3xl max-w-xl w-full overflow-hidden shadow-warm-xl border border-[#D2DFE2] my-8 animate-slide-up">
            
            <div className="px-6 py-5 bg-[#10222B] text-[#F2F6F7] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UtensilsCrossed className="w-5 h-5 text-[#77C7C6]" />
                <h3 className="font-serif text-lg font-bold">
                  {editingItem ? `Edit Recipe: ${editingItem.name}` : 'New Menu Offering'}
                </h3>
              </div>
              <button
                onClick={() => { setEditingItem(null); setIsCreatingNew(false); }}
                className="p-1 rounded-lg text-stone-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-5 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pistachio & Rosewater Cruffin"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs font-medium text-[#10222B] focus:outline-none focus:border-[#1B8585]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MenuCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs font-semibold text-[#10222B] focus:outline-none focus:border-[#1B8585]"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Retail Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs font-bold text-[#10222B] focus:outline-none focus:border-[#1B8585]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Recipe Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Craft details, origin ingredients, and extraction techniques..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs text-[#10222B] focus:outline-none focus:border-[#1B8585]"
                />
              </div>

              {/* Dietary Tags Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Dietary & Allergen Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(tag => {
                    const isSelected = dietaryTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-[#1B8585] text-white border-[#146868]'
                            : 'bg-white text-stone-600 border-[#D2DFE2]'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Estimated Prep Time
                  </label>
                  <input
                    type="text"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    placeholder="3-4 mins"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs text-[#10222B] focus:outline-none focus:border-[#1B8585]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Flavor Notes
                  </label>
                  <input
                    type="text"
                    value={tastingNotesStr}
                    onChange={(e) => setTastingNotesStr(e.target.value)}
                    placeholder="Cardamom, Cocoa, Toffee"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs text-[#10222B] focus:outline-none focus:border-[#1B8585]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs text-[#10222B] focus:outline-none focus:border-[#1B8585]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured-check"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-[#D2DFE2] text-[#1B8585] focus:ring-[#1B8585]"
                />
                <label htmlFor="featured-check" className="text-xs font-semibold text-[#10222B]">
                  Highlight as Signature Feature on Homepage
                </label>
              </div>

              <div className="pt-4 border-t border-[#D2DFE2] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setEditingItem(null); setIsCreatingNew(false); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#10222B] text-[#F2F6F7] text-xs font-bold hover:bg-[#1E3A47] transition-colors shadow-sm"
                >
                  Save Menu Item
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

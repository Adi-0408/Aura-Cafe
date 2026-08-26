import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { 
  Boxes, 
  AlertTriangle, 
  UtensilsCrossed, 
  CalendarDays, 
  Store, 
  LogOut, 
  Coffee, 
  RefreshCw, 
  Download, 
  Plus, 
  Users,
  Flame,
  Zap,
  Receipt,
  Truck,
  Menu as MenuIcon,
  X,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { exportInventoryToCSV } from '../../utils/exportCsv';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: 'counter' | 'orders' | 'inventory' | 'restock' | 'menu' | 'reservations' | 'staff' | 'promotions';
  onAddNewItem?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  count?: number;
  alert?: boolean;
  beacon?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, onAddNewItem }) => {
  const { user, isAdmin, logout } = useAuth();
  const { inventory, stats, isSyncing } = useInventory();
  const location = useLocation();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check store counter open status from local storage
  const isCounterOpen = (() => {
    try {
      const saved = localStorage.getItem('aura_counter_open');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  })();

  if (user && user.role === 'customer') {
    return (
      <div className="min-h-screen bg-[#F6F9FA] flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-[#D2DFE2] shadow-warm-xl space-y-4">
          <h3 className="font-serif text-xl font-bold text-[#10222B]">Customer Account</h3>
          <p className="text-xs text-stone-600">You do not have staff or administrator privileges for the operations panel.</p>
          <Link to="/" className="inline-block px-4 py-2 bg-[#10222B] text-white rounded-xl text-xs font-bold">Return Home</Link>
        </div>
      </div>
    );
  }

  const navSections: NavSection[] = [
    {
      title: 'OPERATIONS & COUNTER',
      items: [
        {
          id: 'counter',
          label: 'Live Order Counter',
          path: '/admin/counter',
          icon: <Flame className="w-4 h-4 text-[#3BAFA9]" />,
          beacon: true,
        },
        {
          id: 'orders',
          label: 'Goods & Deliveries',
          path: '/admin/orders',
          icon: <Truck className="w-4 h-4" />,
        },
        {
          id: 'inventory',
          label: 'Inventory & Products',
          path: '/admin',
          icon: <Boxes className="w-4 h-4" />,
          count: stats.totalSkus
        },
        {
          id: 'restock',
          label: 'Restock Warnings',
          path: '/admin/restock',
          icon: <AlertTriangle className="w-4 h-4" />,
          count: stats.lowStockCount + stats.outOfStockCount,
          alert: (stats.lowStockCount + stats.outOfStockCount) > 0
        },
      ]
    },
    {
      title: 'STOREFRONT & GUESTS',
      items: [
        {
          id: 'menu',
          label: 'Menu & Availability',
          path: '/admin/menu',
          icon: <UtensilsCrossed className="w-4 h-4" />
        },
        {
          id: 'promotions',
          label: 'Happy Hour & Deals',
          path: '/admin/promotions',
          icon: <Zap className="w-4 h-4 text-amber-400" />
        },
        {
          id: 'reservations',
          label: 'Table Reservations',
          path: '/admin/reservations',
          icon: <CalendarDays className="w-4 h-4" />
        },
      ]
    },
    ...(isAdmin ? [{
      title: 'ADMINISTRATION',
      items: [
        {
          id: 'staff',
          label: 'Team & Staff',
          path: '/admin/staff',
          icon: <Users className="w-4 h-4" />
        }
      ]
    }] : [])
  ];

  const handleExportCSV = () => {
    exportInventoryToCSV(inventory.filter(i => !i.isArchived));
  };

  const getActiveTabLabel = () => {
    for (const section of navSections) {
      const match = section.items.find(i => i.id === activeTab);
      if (match) return match.label;
    }
    return 'Operations Dashboard';
  };

  return (
    <div className="min-h-screen bg-[#F6F9FA] text-[#10222B] flex font-sans selection:bg-[#1B8585] selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. DESKTOP & MOBILE SLIDE-OVER SIDEBAR */}
      {/* ========================================================================= */}

      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Component */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between
        bg-[#10222B] text-[#F2F6F7] border-r border-[#1E3A47]
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'lg:w-20' : 'lg:w-72 xl:w-80'}
        ${isMobileSidebarOpen ? 'translate-x-0 w-72 sm:w-80' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* TOP SECTION: BRAND HEADER & STORE STATUS */}
        <div className="p-5 border-b border-[#1E3A47]">
          <div className="flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-3 group min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#1E3A47] text-[#77C7C6] flex items-center justify-center shadow-warm-sm border border-[#1B8585]/40 group-hover:scale-105 transition-transform shrink-0">
                <Coffee className="w-5 h-5" />
              </div>
              
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-lg text-white tracking-tight truncate">
                      AURA
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-[#1E3A47] text-[#77C7C6] text-[9px] font-bold uppercase tracking-wider border border-[#1B8585]/30">
                      Operations
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400 truncate">
                    Supply Chain & Kitchen
                  </p>
                </div>
              )}
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Store Register Status Pill */}
          {!isCollapsed && (
            <div className="mt-4 p-2.5 rounded-2xl bg-[#0B171D] border border-[#1E3A47] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isCounterOpen ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
                <span className="text-[11px] font-medium text-stone-300">
                  Store Register
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isCounterOpen 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-stone-800 text-stone-400'
              }`}>
                {isCounterOpen ? 'Open & Live' : 'Shift Closed'}
              </span>
            </div>
          )}
        </div>

        {/* MIDDLE SECTION: CATEGORIZED NAVIGATION LINKS */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-none">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                  {section.title}
                </span>
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const isCurrent = activeTab === item.id;

                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold
                        transition-all duration-150 group relative
                        ${isCurrent
                          ? 'bg-[#1B8585] text-white shadow-warm-sm font-bold'
                          : 'text-stone-300 hover:text-white hover:bg-[#1E3A47]/60'
                        }
                        ${isCollapsed ? 'justify-center px-2' : ''}
                      `}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <span className={`shrink-0 transition-transform group-hover:scale-110 ${isCurrent ? 'text-white' : 'text-stone-400 group-hover:text-[#77C7C6]'}`}>
                        {item.icon}
                      </span>

                      {!isCollapsed && (
                        <>
                          <span className="truncate flex-1">{item.label}</span>

                          {item.beacon && (
                            <span className="w-2 h-2 rounded-full bg-[#3BAFA9] animate-ping shrink-0" />
                          )}

                          {item.count !== undefined && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              item.alert 
                                ? 'bg-rose-500 text-white animate-pulse' 
                                : (isCurrent ? 'bg-[#10222B] text-[#77C7C6]' : 'bg-[#1E3A47] text-stone-300')
                            }`}>
                              {item.count}
                            </span>
                          )}
                        </>
                      )}

                      {/* Active Indicator Accent Line */}
                      {isCurrent && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#77C7C6] rounded-r-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM SECTION: USER PROFILE */}
        <div className="p-4 border-t border-[#1E3A47] bg-[#0B171D]/60">
          
          {/* User Account Strip */}
          {user && (
            <div className={`
              flex items-center gap-3 p-2 rounded-2xl bg-[#10222B] border border-[#1E3A47]
              ${isCollapsed ? 'justify-center p-1.5' : ''}
            `}>
              <div className="w-8 h-8 rounded-xl bg-[#1E3A47] text-[#77C7C6] font-bold text-xs flex items-center justify-center border border-[#1B8585]/40 shadow-xs overflow-hidden shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.displayName?.charAt(0) || 'A'}</span>
                )}
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-white block truncate leading-tight">
                    {user.displayName || 'Admin Lead'}
                  </span>
                  <span className="text-[10px] text-[#77C7C6] font-semibold uppercase tracking-wider block truncate">
                    {user.role} Account
                  </span>
                </div>
              )}

              <button
                onClick={() => logout()}
                className="p-1.5 rounded-xl text-stone-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
                title="Sign out of operations suite"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA & TOP WORKSPACE HEADER */}
      {/* ========================================================================= */}
      <div className={`
        flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72 xl:ml-80'}
      `}>
        
        {/* TOP WORKSPACE TOOLBAR HEADER */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#D2DFE2]/70 shadow-warm-xs">
          <div className="px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-4">
            
            {/* Left: Mobile Hamburger & Breadcrumb Title */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-[#F2F6F7] text-[#10222B] hover:bg-[#E5ECEE] border border-[#D2DFE2] transition-colors"
                title="Open Navigation Menu"
              >
                <MenuIcon className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                  <span>Aura Operations</span>
                  <ChevronRight className="w-3 h-3 text-stone-400" />
                  <span className="text-[#1B8585] font-bold truncate">
                    {getActiveTabLabel()}
                  </span>
                </div>
                <h1 className="font-serif text-lg sm:text-xl font-bold text-[#10222B] tracking-tight hidden sm:block">
                  {getActiveTabLabel()}
                </h1>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              
              {isSyncing && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E5ECEE] text-[11px] text-[#1B8585] border border-[#D2DFE2] animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span className="font-semibold">Syncing</span>
                </div>
              )}

              {/* Export CSV Button */}
              <button
                onClick={handleExportCSV}
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F2F6F7] hover:bg-[#E5ECEE] text-xs font-semibold text-[#1E3A47] border border-[#D2DFE2] transition-colors cursor-pointer"
                title="Export entire inventory to Excel / CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#1B8585]" />
                <span>Export CSV</span>
              </button>

              {/* Add Product CTA (if provided by page) */}
              {onAddNewItem && (
                <button
                  onClick={onAddNewItem}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#F2F6F7] text-xs font-bold transition-all shadow-warm-sm active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#77C7C6]" />
                  <span>+ Add Product</span>
                </button>
              )}

            </div>

          </div>
        </header>

        {/* MAIN PAGE BODY CANVAS */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8">
          {children}
        </main>

      </div>

    </div>
  );
};

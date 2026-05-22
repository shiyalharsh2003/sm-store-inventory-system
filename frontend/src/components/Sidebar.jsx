import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  History, 
  ShoppingCart, 
  LogOut, 
  PackagePlus,
  TrendingUp
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Sidebar({ activeTab, setActiveTab, isOpen, onClose }) {
  const { logout, user } = useApp();

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', name: 'Product Catalog', icon: Package },
    { id: 'sales', name: 'Sales Register', icon: ShoppingCart },
    { id: 'suppliers', name: 'Suppliers', icon: Users },
    { id: 'transactions', name: 'Stock History', icon: History },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (onClose) onClose();
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between h-full transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div>
        {/* Brand Banner */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-3">
          <div className="bg-brand-500 text-white p-2.5 rounded-xl shadow-lg shadow-brand-500/20">
            <PackagePlus size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none text-slate-800 dark:text-slate-100 font-sans tracking-tight">StockSense</h1>
            <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest mt-0.5 block">Inventory</span>
          </div>
        </div>

        {/* User Card Widget */}
        {user && (
          <div className="mx-4 my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold font-sans">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate">{user.username}</h4>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="px-4 py-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20 scale-[1.02]' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={18} className={isActive ? 'stroke-[2.5]' : 'stroke-[2]'} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Action */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/50">
        <button
          onClick={() => {
            logout();
            if (onClose) onClose();
          }}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
        >
          <LogOut size={18} />
          Logout Session
        </button>
      </div>
    </aside>
  );
}
